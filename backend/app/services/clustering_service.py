"""
clustering_service.py
---------------------
Service layer orchestrating machine learning clustering executions (K-Means,
Hierarchical, DBSCAN), evaluation metrics calculation, segment profiling,
database persistence, and CSV artifact generation.
"""

import datetime
import json
import uuid
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.core.exceptions import (
    ClusteringExecutionError,
    ClusteringRunNotFoundError,
    DatasetNotFoundError,
)
from app.models.db_models import (
    ArtifactModel,
    ClusteringRunModel,
    DatasetModel,
    ModelEvaluationModel,
    SegmentProfileModel,
)
from app.repositories.clustering_repo import ClusteringRepository
from app.repositories.dataset_repo import DatasetRepository
from app.schemas.schemas import (
    ClusteringRunCreateRequest,
    ClusteringRunListItem,
    ClusteringRunListResponse,
    ClusteringRunResponse,
    CustomerExplorerResponse,
    CustomerTableRow,
    ModelEvaluationSchema,
    PCAVisualizationData,
    SegmentProfileSchema,
)
from app.utils.storage import (
    load_dataset_dataframe,
    save_artifact_csv,
)
from app.ml import clusterer as cl
from app.ml import preprocessor as pre
from app.ml import profiler as prof


def _to_builtin(obj):
    if isinstance(obj, dict):
        return {k: _to_builtin(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_to_builtin(x) for x in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj


class ClusteringService:

    @classmethod
    def run_clustering(
        cls, db: Session, req: ClusteringRunCreateRequest
    ) -> ClusteringRunResponse:
        """Executes full ML clustering pipeline, persists results, profiles segments, and creates artifacts."""
        dataset = DatasetRepository.get_by_id(db, req.dataset_id)
        if not dataset:
            raise DatasetNotFoundError(f"Dataset '{req.dataset_id}' not found.")

        # Load raw dataset
        raw_df = load_dataset_dataframe(dataset.storage_path)

        # 1. Preprocessing
        try:
            preprocess_result = pre.run_preprocessing(
                df=raw_df,
                selected_features=req.selected_features,
                missing_strategy=req.missing_strategy,
                drop_duplicates=req.drop_duplicates,
                scale_type=req.scale_type,
            )
        except Exception as e:
            raise ClusteringExecutionError(f"Preprocessing error: {e}")

        X = preprocess_result["X_scaled"]
        X_imputed = preprocess_result["X_imputed"]
        feature_names = preprocess_result["feature_names"]
        df_clean = preprocess_result["df_clean"]

        # Detect optional ID column for alignment
        id_cols = [c for c in df_clean.columns if "id" in c.lower() or "customer" in c.lower()]
        id_col = id_cols[0] if id_cols else None
        id_series = df_clean[id_col].iloc[:len(X)] if id_col else None

        # 2. Run Algorithm
        start_time = datetime.datetime.now(datetime.timezone.utc)
        algo = req.algorithm.lower().strip()
        try:
            if algo == "kmeans":
                k = req.n_clusters or 4
                ml_result = cl.run_kmeans(X, k, feature_names, X_raw=X_imputed, id_series=id_series)
            elif algo in ["hierarchical", "agglomerative"]:
                algo = "hierarchical"
                k = req.n_clusters or 4
                lnk = req.linkage or "ward"
                ml_result = cl.run_hierarchical(X, k, lnk, feature_names, X_raw=X_imputed, id_series=id_series)
            elif algo == "dbscan":
                eps = req.eps or 0.5
                min_s = req.min_samples or 5
                ml_result = cl.run_dbscan(X, eps, min_s, feature_names, X_raw=X_imputed, id_series=id_series)
            else:
                raise ClusteringExecutionError(f"Unsupported algorithm '{req.algorithm}'. Must be kmeans, hierarchical, or dbscan.")
        except Exception as e:
            raise ClusteringExecutionError(f"Clustering execution failed: {e}")

        completed_time = datetime.datetime.now(datetime.timezone.utc)
        duration = ml_result.get("elapsed_seconds", (completed_time - start_time).total_seconds())

        labels = np.array(ml_result["labels"])

        # 3. Generate Segment Profiles
        profiles_dict = prof.build_segment_profiles(df_clean, labels, feature_names, id_column=id_col)

        # 4. Save Export CSV Artifact (with formula injection protection)
        export_df = df_clean.iloc[:len(labels)].copy()
        export_df["Cluster"] = labels
        # Map label to segment name
        label_to_name = {p["cluster_label"] if "cluster_label" in p else p.get("cluster_id"): p["segment_name"] for p in profiles_dict["profiles"]}
        export_df["Segment_Name"] = [label_to_name.get(int(l), f"Cluster {l}") for l in labels]
        
        run_uuid = str(uuid.uuid4())
        art_id, art_path, art_size = save_artifact_csv(export_df, "segmented_dataset", run_uuid)

        # 5. Persist ClusteringRun to Database
        params = {
            "n_clusters": req.n_clusters,
            "linkage": req.linkage,
            "eps": req.eps,
            "min_samples": req.min_samples,
        }
        pre_config = {
            "scale_type": req.scale_type,
            "missing_strategy": req.missing_strategy,
            "drop_duplicates": req.drop_duplicates,
        }

        run_model = ClusteringRunModel(
            id=run_uuid,
            dataset_id=dataset.id,
            algorithm=algo,
            selected_features=json.dumps(feature_names),
            parameters=json.dumps(params),
            preprocessing_config=json.dumps(pre_config),
            status="completed",
            n_clusters_found=ml_result["n_clusters_found"],
            noise_count=ml_result.get("noise_count", 0),
            processing_duration_seconds=round(duration, 4),
            created_at=start_time,
            completed_at=completed_time,
        )
        ClusteringRepository.create_run(db, run_model)

        # 6. Persist ModelEvaluation
        eval_model = ModelEvaluationModel(
            run_id=run_uuid,
            silhouette_score=ml_result.get("silhouette_score"),
            davies_bouldin_index=ml_result.get("davies_bouldin_score"),
            calinski_harabasz_index=ml_result.get("calinski_harabasz_score"),
            noise_percentage=ml_result.get("noise_percentage", 0.0),
            metrics_valid=bool(ml_result.get("metrics_valid", True)),
            evaluation_warnings=ml_result.get("reason"),
        )
        ClusteringRepository.save_evaluation(db, eval_model)

        # 7. Persist Segment Profiles
        seg_models = []
        for p in profiles_dict["profiles"]:
            rec = p.get("marketing_recommendation") or {}
            seg_models.append(
                SegmentProfileModel(
                    run_id=run_uuid,
                    cluster_label=int(p.get("cluster_id", p.get("cluster_label", 0))),
                    segment_name=p["segment_name"] or f"Segment {p.get('cluster_id')}",
                    customer_count=int(p["customer_count"]),
                    segment_percentage=float(p["percentage"]),
                    average_features_json=json.dumps(_to_builtin(p["average_features"])),
                    distinguishing_characteristics_json=json.dumps(_to_builtin(p["distinguishing_characteristics"])),
                    description=p.get("description", ""),
                    marketing_strategy=rec.get("strategy"),
                    marketing_campaign=rec.get("campaign"),
                    business_goal=rec.get("business_goal"),
                )
            )
        ClusteringRepository.save_segment_profiles(db, seg_models)

        # 8. Persist Artifact record
        art_model = ArtifactModel(
            id=art_id,
            run_id=run_uuid,
            dataset_id=dataset.id,
            artifact_type="segmentation_csv",
            file_path=art_path,
            file_size_bytes=art_size,
        )
        ClusteringRepository.save_artifact(db, art_model)

        return cls._build_run_response(run_model, dataset, eval_model, seg_models, profiles_dict.get("executive_summary"))

    @classmethod
    def get_run(cls, db: Session, run_id: str) -> ClusteringRunResponse:
        run = ClusteringRepository.get_run_by_id(db, run_id)
        if not run:
            raise ClusteringRunNotFoundError(f"Run with ID '{run_id}' not found.")
        dataset = DatasetRepository.get_by_id(db, run.dataset_id)
        return cls._build_run_response(run, dataset, run.evaluation, run.segment_profiles)

    @classmethod
    def list_runs(
        cls, db: Session, dataset_id: Optional[str] = None, page: int = 1, page_size: int = 20
    ) -> ClusteringRunListResponse:
        skip = max(0, (page - 1) * page_size)
        runs, total = ClusteringRepository.list_runs(db, dataset_id=dataset_id, skip=skip, limit=page_size)

        items = []
        for r in runs:
            dataset_name = r.dataset.original_filename if r.dataset else "Unknown Dataset"
            sil = r.evaluation.silhouette_score if r.evaluation else None
            items.append(
                ClusteringRunListItem(
                    id=r.id,
                    dataset_id=r.dataset_id,
                    dataset_name=dataset_name,
                    algorithm=r.algorithm,
                    status=r.status,
                    n_clusters_found=r.n_clusters_found,
                    silhouette_score=sil,
                    processing_duration_seconds=r.processing_duration_seconds,
                    created_at=r.created_at,
                )
            )
        return ClusteringRunListResponse(total=total, runs=items)

    @classmethod
    def get_run_visualizations(cls, db: Session, run_id: str) -> PCAVisualizationData:
        run = ClusteringRepository.get_run_by_id(db, run_id)
        if not run:
            raise ClusteringRunNotFoundError(f"Run with ID '{run_id}' not found.")
        
        art = ClusteringRepository.get_artifact_by_run_and_type(db, run_id, "segmentation_csv")
        if not art:
            raise ClusteringRunNotFoundError(f"Segmentation artifact for run '{run_id}' not found.")
        
        df = pd.read_csv(art.file_path)
        feature_names = json.loads(run.selected_features)
        valid_features = [f for f in feature_names if f in df.columns]

        X = df[valid_features].values
        # Standard scale for PCA
        from sklearn.preprocessing import StandardScaler
        X_scaled = StandardScaler().fit_transform(X)

        labels = df["Cluster"].values
        id_col = next((c for c in df.columns if "id" in c.lower()), None)
        id_series = df[id_col] if id_col else pd.Series([f"Cust_{i+1}" for i in range(len(df))])

        pca_res = cl.compute_pca_visualization(X_scaled, labels, id_series=id_series)

        # Map cluster labels to segment names
        label_map = {sp.cluster_label: sp.segment_name for sp in run.segment_profiles}
        for pt in pca_res["points"]:
            pt["segment_name"] = label_map.get(pt["cluster"], f"Cluster {pt['cluster']}")

        return PCAVisualizationData(
            explained_variance_ratio=pca_res["explained_variance_ratio"],
            total_variance_explained=pca_res["total_variance_explained"],
            points=pca_res["points"],
            cluster_centers_pca=pca_res.get("cluster_centers_pca"),
        )

    @classmethod
    def get_customer_explorer(
        cls,
        db: Session,
        run_id: str,
        page: int = 1,
        page_size: int = 25,
        cluster_filter: Optional[int] = None,
        search: Optional[str] = None,
    ) -> CustomerExplorerResponse:
        run = ClusteringRepository.get_run_by_id(db, run_id)
        if not run:
            raise ClusteringRunNotFoundError(f"Run '{run_id}' not found.")
        
        art = ClusteringRepository.get_artifact_by_run_and_type(db, run_id, "segmentation_csv")
        if not art:
            raise ClusteringRunNotFoundError(f"Artifact for run '{run_id}' not found.")
        
        df = pd.read_csv(art.file_path)

        if cluster_filter is not None:
            df = df[df["Cluster"] == cluster_filter]

        if search:
            # String search across all columns
            mask = df.astype(str).apply(lambda row: row.str.contains(search, case=False).any(), axis=1)
            df = df[mask]

        total = len(df)
        skip = max(0, (page - 1) * page_size)
        paged = df.iloc[skip : skip + page_size]

        feature_names = json.loads(run.selected_features)
        label_map = {sp.cluster_label: sp.segment_name for sp in run.segment_profiles}

        id_col = next((c for c in df.columns if "id" in c.lower()), None)

        rows = []
        for idx, row in paged.iterrows():
            row_id = str(row[id_col]) if id_col else f"Row_{idx+1}"
            cluster_val = int(row["Cluster"])
            seg_name = label_map.get(cluster_val, f"Cluster {cluster_val}")
            
            # Attributes dict
            attrs = {k: float(row[k]) if pd.api.types.is_numeric_dtype(type(row[k])) and not pd.isna(row[k]) else str(row[k])
                     for k in feature_names if k in row}

            rows.append(
                CustomerTableRow(
                    row_id=row_id,
                    cluster=cluster_val,
                    segment_name=seg_name,
                    attributes=attrs,
                )
            )

        return CustomerExplorerResponse(
            total_customers=total,
            page=page,
            page_size=page_size,
            cluster_filter=cluster_filter,
            customers=rows,
            feature_names=feature_names,
        )

    @classmethod
    def export_run_csv(cls, db: Session, run_id: str) -> Tuple[str, str]:
        run = ClusteringRepository.get_run_by_id(db, run_id)
        if not run:
            raise ClusteringRunNotFoundError(f"Run '{run_id}' not found.")
        
        art = ClusteringRepository.get_artifact_by_run_and_type(db, run_id, "segmentation_csv")
        if not art:
            raise ClusteringRunNotFoundError(f"Artifact for run '{run_id}' not found.")
        
        dataset_name = run.dataset.original_filename if run.dataset else "customer_data"
        base_name = dataset_name.rsplit(".", 1)[0]
        download_filename = f"{base_name}_{run.algorithm}_segmented.csv"
        return art.file_path, download_filename

    @classmethod
    def compare_algorithms(
        cls, db: Session, dataset_id: str, selected_features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Runs K-Means, Hierarchical, and DBSCAN on identical scaled data and compares evaluation metrics."""
        dataset = DatasetRepository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(f"Dataset '{dataset_id}' not found.")
        
        df = load_dataset_dataframe(dataset.storage_path)
        pre_res = pre.run_preprocessing(df, selected_features=selected_features)
        X = pre_res["X_scaled"]
        feats = pre_res["feature_names"]

        return cl.compare_models(X, feats)

    @classmethod
    def get_elbow_data(
        cls, db: Session, dataset_id: str, k_min: int = 2, k_max: int = 10, selected_features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        dataset = DatasetRepository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(f"Dataset '{dataset_id}' not found.")
        
        df = load_dataset_dataframe(dataset.storage_path)
        pre_res = pre.run_preprocessing(df, selected_features=selected_features)
        X = pre_res["X_scaled"]

        k_max = min(k_max, len(X) - 1, 15)
        elbow = cl.elbow_data(X, k_min=max(2, k_min), k_max=k_max)
        return {"elbow_data": elbow, "feature_names": pre_res["feature_names"]}

    @classmethod
    def _build_run_response(
        cls,
        run: ClusteringRunModel,
        dataset: Optional[DatasetModel],
        evaluation: Optional[ModelEvaluationModel],
        segment_profiles: List[SegmentProfileModel],
        executive_summary: Optional[str] = None,
    ) -> ClusteringRunResponse:
        eval_schema = None
        if evaluation:
            eval_schema = ModelEvaluationSchema(
                silhouette_score=evaluation.silhouette_score,
                davies_bouldin_index=evaluation.davies_bouldin_index,
                calinski_harabasz_index=evaluation.calinski_harabasz_index,
                noise_percentage=evaluation.noise_percentage,
                metrics_valid=evaluation.metrics_valid,
                evaluation_warnings=evaluation.evaluation_warnings,
            )

        profiles_schema = []
        for sp in segment_profiles:
            try:
                avg_f = json.loads(sp.average_features_json)
            except Exception:
                avg_f = {}
            try:
                dist = json.loads(sp.distinguishing_characteristics_json)
            except Exception:
                dist = []

            profiles_schema.append(
                SegmentProfileSchema(
                    cluster_label=sp.cluster_label,
                    segment_name=sp.segment_name,
                    customer_count=sp.customer_count,
                    segment_percentage=sp.segment_percentage,
                    average_features=avg_f,
                    distinguishing_characteristics=dist,
                    description=sp.description,
                    marketing_strategy=sp.marketing_strategy,
                    marketing_campaign=sp.marketing_campaign,
                    business_goal=sp.business_goal,
                )
            )

        return ClusteringRunResponse(
            id=run.id,
            dataset_id=run.dataset_id,
            dataset_name=dataset.original_filename if dataset else "Dataset",
            algorithm=run.algorithm,
            status=run.status,
            n_clusters_found=run.n_clusters_found,
            noise_count=run.noise_count,
            processing_duration_seconds=run.processing_duration_seconds,
            created_at=run.created_at,
            completed_at=run.completed_at,
            selected_features=json.loads(run.selected_features),
            parameters=json.loads(run.parameters),
            evaluation=eval_schema,
            profiles=profiles_schema,
            executive_summary=executive_summary or (segment_profiles[0].description if segment_profiles else ""),
            error_message=run.error_message,
        )
