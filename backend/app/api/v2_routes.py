"""
v2_routes.py
------------
Phase 2 & 3 API endpoints for SegmentIQ.

Routes:
  POST   /api/v2/datasets/upload
  GET    /api/v2/datasets
  GET    /api/v2/datasets/{dataset_id}/preview
  GET    /api/v2/datasets/{dataset_id}/eda
  POST   /api/v2/datasets/{dataset_id}/preprocess
  POST   /api/v2/clustering/train
  POST   /api/v2/clustering/compare
  GET    /api/v2/clustering/{run_id}/results
  GET    /api/v2/clustering/{run_id}/metrics
  GET    /api/v2/clustering/{run_id}/segments
  GET    /api/v2/clustering/{run_id}/visualizations
  GET    /api/v2/clustering/{run_id}/export
  GET    /api/v2/clustering/{run_id}/elbow
"""

import io
import csv
import uuid
import datetime
import unicodedata
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, Body, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.ml import preprocessor as pre
from app.ml import clusterer as cl
from app.ml import profiler as prof
from app.ml import session as sess

router = APIRouter(prefix="/v2", tags=["v2"])

# ── constants ────────────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 50 * 1024 * 1024   # 50 MB

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class PreprocessRequest(BaseModel):
    selected_features: Optional[List[str]] = None
    missing_strategy: str = Field(default="median", pattern="^(median|mean|most_frequent)$")
    drop_duplicates: bool = True
    scale_type: str = Field(default="standard", pattern="^(standard|robust|minmax)$")

class KMeansTrainRequest(BaseModel):
    dataset_id: str
    n_clusters: int = Field(default=4, ge=2, le=20)
    selected_features: Optional[List[str]] = None
    missing_strategy: str = "median"
    drop_duplicates: bool = True
    scale_type: str = "standard"

class HierarchicalTrainRequest(BaseModel):
    dataset_id: str
    n_clusters: int = Field(default=4, ge=2, le=20)
    linkage: str = Field(default="ward", pattern="^(ward|complete|average|single)$")
    selected_features: Optional[List[str]] = None
    missing_strategy: str = "median"
    drop_duplicates: bool = True
    scale_type: str = "standard"

class DBSCANTrainRequest(BaseModel):
    dataset_id: str
    eps: float = Field(default=0.5, gt=0.0)
    min_samples: int = Field(default=5, ge=1)
    selected_features: Optional[List[str]] = None
    missing_strategy: str = "median"
    drop_duplicates: bool = True
    scale_type: str = "standard"

class CompareRequest(BaseModel):
    dataset_id: str
    kmeans_k: int = Field(default=4, ge=2, le=20)
    hier_k: int = Field(default=4, ge=2, le=20)
    hier_linkage: str = "ward"
    dbscan_eps: float = Field(default=0.5, gt=0.0)
    dbscan_min_samples: int = Field(default=5, ge=1)
    selected_features: Optional[List[str]] = None
    missing_strategy: str = "median"
    drop_duplicates: bool = True
    scale_type: str = "standard"

# ── helpers ───────────────────────────────────────────────────────────────────

def _require_dataset(dataset_id: str) -> Dict[str, Any]:
    ds = sess.get_dataset(dataset_id)
    if ds is None:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found. Upload it first.")
    return ds

def _require_run(run_id: str) -> Dict[str, Any]:
    run = sess.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Clustering run '{run_id}' not found.")
    return run

def _sanitize_csv_field(value: Any) -> str:
    """Prevent CSV formula injection (=, +, -, @ at start)."""
    s = str(value) if value is not None else ""
    if s and s[0] in ("=", "+", "-", "@"):
        s = "'" + s
    return s

def _preprocess_for_run(ds: Dict[str, Any], req_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Run preprocessing and return the result dict."""
    df = ds["df"]
    result = pre.run_preprocessing(
        df=df,
        selected_features=req_dict.get("selected_features"),
        missing_strategy=req_dict.get("missing_strategy", "median"),
        drop_duplicates=req_dict.get("drop_duplicates", True),
        scale_type=req_dict.get("scale_type", "standard"),
    )
    return result

def _find_id_col(df: pd.DataFrame) -> Optional[str]:
    from app.ml.preprocessor import _is_id_column
    for col in df.columns:
        if _is_id_column(col):
            return col
    return None

# ── Dataset endpoints ─────────────────────────────────────────────────────────

@router.post("/datasets/upload")
async def upload_dataset_v2(file: UploadFile = File(...)):
    """Upload a customer CSV file. Returns dataset_id + preview."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {MAX_UPLOAD_BYTES // (1024*1024)} MB limit."
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    validation = pre.validate_dataset(df, filename=file.filename)
    if not validation["valid"]:
        raise HTTPException(status_code=422, detail={
            "errors": validation["errors"],
            "warnings": validation["warnings"],
        })

    preview = pre.build_preview(df)
    eda_data = pre.compute_eda(df)

    dataset_id = str(uuid.uuid4())
    sess.store_dataset(dataset_id, {
        "df": df,
        "filename": file.filename,
        "preview": preview,
        "eda": eda_data,
        "validation_warnings": validation["warnings"],
        "created_at": datetime.datetime.utcnow().isoformat(),
    })
    sess.set_active(dataset_id)

    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "preview": preview,
        "validation_warnings": validation["warnings"],
    }


@router.get("/datasets")
def list_all_datasets():
    return {"datasets": sess.list_datasets()}


@router.get("/datasets/{dataset_id}/preview")
def get_dataset_preview(dataset_id: str):
    ds = _require_dataset(dataset_id)
    return ds["preview"]


@router.get("/datasets/{dataset_id}/eda")
def get_dataset_eda(dataset_id: str):
    ds = _require_dataset(dataset_id)
    # Re-compute EDA on the stored df (fresh each time, no stale cache issues)
    return pre.compute_eda(ds["df"])


@router.post("/datasets/{dataset_id}/preprocess")
def preprocess_dataset_v2(dataset_id: str, req: PreprocessRequest = Body(...)):
    """Apply preprocessing; returns a full report and clean/scaled samples."""
    ds = _require_dataset(dataset_id)
    try:
        result = pre.run_preprocessing(
            df=ds["df"],
            selected_features=req.selected_features,
            missing_strategy=req.missing_strategy,
            drop_duplicates=req.drop_duplicates,
            scale_type=req.scale_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Update stored dataset with preprocessed context
    ds["last_preprocess_params"] = req.dict()
    ds["last_preprocess_result"] = {
        "feature_names": result["feature_names"],
        "report": result["report"],
    }

    return {
        "message": "Preprocessing applied successfully.",
        "dataset_id": dataset_id,
        "raw_info": result["raw_info"],
        "clean_info": result["clean_info"],
        "selected_features": result["feature_names"],
        "pipeline_flow": result["pipeline_flow"],
        "raw_sample": result["raw_sample"],
        "clean_sample": result["clean_sample"],
        "scaled_sample": result["scaled_sample"],
        "report": result["report"],
    }

# ── Clustering endpoints ──────────────────────────────────────────────────────

def _build_run(
    dataset_id: str,
    algorithm: str,
    result: Dict[str, Any],
    profiles: Dict[str, Any],
    feature_names: List[str],
    preprocess_report: Dict[str, Any],
) -> str:
    run_id = str(uuid.uuid4())
    sess.store_run(run_id, {
        "run_id": run_id,
        "dataset_id": dataset_id,
        "algorithm": algorithm,
        "feature_names": feature_names,
        "result": result,
        "profiles": profiles,
        "preprocess_report": preprocess_report,
        "created_at": datetime.datetime.utcnow().isoformat(),
    })
    return run_id


@router.post("/clustering/train")
def train_clustering(
    algorithm: str = Query(..., pattern="^(kmeans|hierarchical|dbscan)$"),
    req: Dict[str, Any] = Body(...),
):
    """
    Train a clustering model.

    Pass ?algorithm=kmeans|hierarchical|dbscan in query string.
    Request body accepts dataset_id + algorithm-specific params + preprocessing params.
    """
    dataset_id = req.get("dataset_id")
    if not dataset_id:
        raise HTTPException(status_code=422, detail="'dataset_id' is required in the request body.")

    ds = _require_dataset(dataset_id)

    try:
        preprocess_result = pre.run_preprocessing(
            df=ds["df"],
            selected_features=req.get("selected_features"),
            missing_strategy=req.get("missing_strategy", "median"),
            drop_duplicates=req.get("drop_duplicates", True),
            scale_type=req.get("scale_type", "standard"),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    X = preprocess_result["X_scaled"]
    X_raw = preprocess_result["X_imputed"]
    feature_names = preprocess_result["feature_names"]
    df_clean = preprocess_result["df_clean"]
    id_col = _find_id_col(df_clean)
    id_series = df_clean[id_col].iloc[:len(X)] if id_col else None

    try:
        if algorithm == "kmeans":
            k = int(req.get("n_clusters", 4))
            result = cl.run_kmeans(X, k, feature_names, X_raw=X_raw, id_series=id_series)
        elif algorithm == "hierarchical":
            k = int(req.get("n_clusters", 4))
            lnk = req.get("linkage", "ward")
            result = cl.run_hierarchical(X, k, lnk, feature_names, X_raw=X_raw, id_series=id_series)
        else:  # dbscan
            eps = float(req.get("eps", 0.5))
            min_s = int(req.get("min_samples", 5))
            result = cl.run_dbscan(X, eps, min_s, feature_names, X_raw=X_raw, id_series=id_series)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering failed: {e}")

    labels = np.array(result["labels"])
    profiles = prof.build_segment_profiles(df_clean, labels, feature_names, id_column=id_col)

    run_id = _build_run(
        dataset_id, algorithm, result, profiles, feature_names, preprocess_result["report"]
    )

    return {
        "run_id": run_id,
        "algorithm": algorithm,
        "n_clusters_found": result["n_clusters_found"],
        "noise_count": result.get("noise_count", 0),
        "silhouette_score": result["silhouette_score"],
        "davies_bouldin_score": result["davies_bouldin_score"],
        "calinski_harabasz_score": result["calinski_harabasz_score"],
        "metrics_valid": result["metrics_valid"],
        "feature_names": feature_names,
        "elapsed_seconds": result["elapsed_seconds"],
        "executive_summary": profiles["executive_summary"],
    }


@router.post("/clustering/compare")
def compare_clustering_v2(req: CompareRequest = Body(...)):
    """Run all 3 algorithms on the same preprocessed features and compare."""
    ds = _require_dataset(req.dataset_id)

    try:
        preprocess_result = pre.run_preprocessing(
            df=ds["df"],
            selected_features=req.selected_features,
            missing_strategy=req.missing_strategy,
            drop_duplicates=req.drop_duplicates,
            scale_type=req.scale_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    X = preprocess_result["X_scaled"]
    feature_names = preprocess_result["feature_names"]
    df_clean = preprocess_result["df_clean"]
    id_col = _find_id_col(df_clean)
    id_series = df_clean[id_col].iloc[:len(X)] if id_col else None

    try:
        comparison = cl.compare_algorithms(
            X=X,
            feature_names=feature_names,
            kmeans_k=req.kmeans_k,
            hier_k=req.hier_k,
            hier_linkage=req.hier_linkage,
            dbscan_eps=req.dbscan_eps,
            dbscan_min_samples=req.dbscan_min_samples,
            id_series=id_series,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {e}")

    # Store the recommended algorithm's result as a run
    rec_algo = comparison["recommended_algorithm"].lower().replace("-", "").replace(" ", "")
    rec_result = comparison.get(f"{rec_algo.replace('kmeans', 'kmeans')}_result") or comparison["kmeans_result"]
    labels = np.array(rec_result["labels"])
    profiles = prof.build_segment_profiles(df_clean, labels, feature_names, id_column=id_col)

    run_id = _build_run(
        req.dataset_id, rec_algo, rec_result, profiles, feature_names, preprocess_result["report"]
    )

    return {
        "run_id": run_id,
        "comparison_table": comparison["comparison_table"],
        "recommended_algorithm": comparison["recommended_algorithm"],
        "reasoning": comparison["reasoning"],
        "feature_names": feature_names,
    }


@router.post("/clustering/elbow")
def get_elbow_data(
    dataset_id: str = Body(..., embed=True),
    k_min: int = Body(default=2),
    k_max: int = Body(default=10),
    selected_features: Optional[List[str]] = Body(default=None),
    scale_type: str = Body(default="standard"),
    missing_strategy: str = Body(default="median"),
):
    """Compute elbow chart data (inertia + silhouette) for K-Means."""
    ds = _require_dataset(dataset_id)
    try:
        pre_result = pre.run_preprocessing(
            df=ds["df"],
            selected_features=selected_features,
            missing_strategy=missing_strategy,
            scale_type=scale_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    k_max = min(k_max, len(pre_result["X_scaled"]) - 1, 15)
    data = cl.elbow_data(pre_result["X_scaled"], k_min=max(2, k_min), k_max=k_max)
    return {"elbow_data": data, "feature_names": pre_result["feature_names"]}


# ── Run result endpoints ──────────────────────────────────────────────────────

@router.get("/clustering/{run_id}/results")
def get_run_results(run_id: str):
    run = _require_run(run_id)
    result = run["result"]
    return {
        "run_id": run_id,
        "algorithm": run["algorithm"],
        "feature_names": run["feature_names"],
        "n_clusters_found": result["n_clusters_found"],
        "noise_count": result.get("noise_count", 0),
        "cluster_sizes": result["cluster_sizes"],
        "silhouette_score": result["silhouette_score"],
        "davies_bouldin_score": result["davies_bouldin_score"],
        "calinski_harabasz_score": result["calinski_harabasz_score"],
        "metrics_valid": result["metrics_valid"],
        "metrics_reason": result.get("reason"),
        "inertia": result.get("inertia"),
        "elapsed_seconds": result["elapsed_seconds"],
        "preprocess_report": run["preprocess_report"],
    }


@router.get("/clustering/{run_id}/metrics")
def get_run_metrics(run_id: str):
    run = _require_run(run_id)
    result = run["result"]
    return {
        "run_id": run_id,
        "algorithm": run["algorithm"],
        "silhouette_score": result["silhouette_score"],
        "davies_bouldin_score": result["davies_bouldin_score"],
        "calinski_harabasz_score": result["calinski_harabasz_score"],
        "metrics_valid": result["metrics_valid"],
        "reason": result.get("reason"),
        "noise_count": result.get("noise_count", 0),
        "noise_percentage": result.get("noise_percentage", 0.0),
        "n_clusters_found": result["n_clusters_found"],
        "cluster_sizes": result["cluster_sizes"],
        "inertia": result.get("inertia"),
        "elbow_data": result.get("elbow_data"),
    }


@router.get("/clustering/{run_id}/segments")
def get_run_segments(run_id: str):
    run = _require_run(run_id)
    profiles = run["profiles"]
    return {
        "run_id": run_id,
        "algorithm": run["algorithm"],
        "executive_summary": profiles["executive_summary"],
        "n_segments": profiles["n_segments"],
        "n_noise_points": profiles["n_noise_points"],
        "profiles": profiles["profiles"],
        "largest_segment": profiles["largest_segment"],
        "highest_value_segment": profiles["highest_value_segment"],
        "highest_spending_segment": profiles["highest_spending_segment"],
        "most_frequent_segment": profiles["most_frequent_segment"],
        "lowest_engagement_segment": profiles["lowest_engagement_segment"],
    }


@router.get("/clustering/{run_id}/visualizations")
def get_run_visualizations(run_id: str):
    """
    Return pre-computed visualization data arrays.
    PCA coordinates are 2D projections of higher-dimensional feature space.
    They preserve relative distances approximately, not exactly.
    """
    run = _require_run(run_id)
    result = run["result"]

    # PCA scatter data
    pca_points = [
        {
            "pca_x": p["pca_x"],
            "pca_y": p["pca_y"],
            "cluster_id": p["cluster_id"],
            "customer_id": p.get("customer_id", str(i)),
            "is_noise": p.get("is_noise", False),
        }
        for i, p in enumerate(result["points"])
    ]

    # Cluster size distribution
    cluster_dist = [
        {"cluster_id": cid, "count": cnt, "label": f"Segment {cid + 1}" if cid >= 0 else "Noise"}
        for cid, cnt in result["cluster_sizes"].items()
    ]

    # Dendrogram (hierarchical only)
    dendro = result.get("dendrogram_data")

    return {
        "run_id": run_id,
        "algorithm": run["algorithm"],
        "pca_points": pca_points,
        "pca_explained_variance": result.get("pca_explained_variance"),
        "pca_note": (
            "PCA reduces the feature space to 2 dimensions for visualization. "
            "The actual clustering was performed in the full feature space."
        ),
        "cluster_distribution": cluster_dist,
        "dendrogram_data": dendro,
        "elbow_data": result.get("elbow_data"),
        "n_features": len(run["feature_names"]),
        "feature_names": run["feature_names"],
    }


@router.get("/clustering/{run_id}/export")
def export_segmented_csv(run_id: str):
    """
    Download a CSV with original customer data + cluster_id + segment_name.
    Fields are sanitized against CSV formula injection.
    """
    run = _require_run(run_id)
    result = run["result"]
    profiles_data = run["profiles"]

    # Build a quick cluster_id → segment_name map
    seg_map: Dict[int, str] = {
        p["cluster_id"]: p["segment_name"]
        for p in profiles_data["profiles"]
    }

    points = result["points"]
    feature_names = run["feature_names"]

    output = io.StringIO()
    fieldnames = (
        ["customer_id", "cluster_id", "segment_name", "is_noise"]
        + feature_names
        + ["pca_x", "pca_y"]
    )
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for p in points:
        row = {
            "customer_id": _sanitize_csv_field(p.get("customer_id", "")),
            "cluster_id": int(p["cluster_id"]),
            "segment_name": _sanitize_csv_field(seg_map.get(int(p["cluster_id"]), "Unknown")),
            "is_noise": p.get("is_noise", False),
            "pca_x": p.get("pca_x", 0.0),
            "pca_y": p.get("pca_y", 0.0),
        }
        for feat in feature_names:
            row[feat] = p.get(feat, "")
        writer.writerow(row)

    output.seek(0)
    safe_filename = f"segmentiq_results_{run_id[:8]}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'},
    )
