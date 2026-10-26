"""
analytics_service.py
--------------------
Aggregates real application and machine learning metrics across stored datasets,
clustering runs, and customer segments.
No simulated data; returns actual database calculations and null when unavailable.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.db_models import (
    ClusteringRunModel,
    DatasetModel,
    ModelEvaluationModel,
    SegmentProfileModel,
)
from app.repositories.clustering_repo import ClusteringRepository
from app.schemas.schemas import (
    AnalyticsOverviewResponse,
    ClusteringRunListItem,
)


class AnalyticsService:

    @classmethod
    def get_overview(cls, db: Session, dataset_id: Optional[str] = None) -> AnalyticsOverviewResponse:
        total_datasets = db.query(DatasetModel).count()
        run_counts = ClusteringRepository.get_runs_count(db)
        
        # Latest completed run
        latest_run = ClusteringRepository.get_latest_completed_run(db)
        latest_item = None
        if latest_run:
            dataset_name = latest_run.dataset.original_filename if latest_run.dataset else "Dataset"
            sil = latest_run.evaluation.silhouette_score if latest_run.evaluation else None
            latest_item = ClusteringRunListItem(
                id=latest_run.id,
                dataset_id=latest_run.dataset_id,
                dataset_name=dataset_name,
                algorithm=latest_run.algorithm,
                status=latest_run.status,
                n_clusters_found=latest_run.n_clusters_found,
                silhouette_score=sil,
                processing_duration_seconds=latest_run.processing_duration_seconds,
                created_at=latest_run.created_at,
            )

        # Active dataset details
        active_dataset = None
        if dataset_id:
            active_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
        elif latest_run and latest_run.dataset:
            active_dataset = latest_run.dataset
        elif total_datasets > 0:
            active_dataset = db.query(DatasetModel).order_by(DatasetModel.created_at.desc()).first()

        active_customers = active_dataset.row_count if active_dataset else None
        active_name = active_dataset.original_filename if active_dataset else None

        # Find best silhouette score across all completed runs
        best_eval = (
            db.query(ModelEvaluationModel)
            .filter(ModelEvaluationModel.metrics_valid == True, ModelEvaluationModel.silhouette_score != None)
            .order_by(ModelEvaluationModel.silhouette_score.desc())
            .first()
        )
        best_sil = best_eval.silhouette_score if best_eval else None
        best_algo = best_eval.run.algorithm if (best_eval and best_eval.run) else None

        segments_count = latest_run.n_clusters_found if latest_run else None

        return AnalyticsOverviewResponse(
            total_datasets=total_datasets,
            total_runs=run_counts["total"],
            completed_runs=run_counts["completed"],
            failed_runs=run_counts["failed"],
            latest_run=latest_item,
            active_dataset_customers=active_customers,
            active_dataset_name=active_name,
            discovered_segments_count=segments_count,
            best_silhouette_score=best_sil,
            best_model_algorithm=best_algo,
        )

    @classmethod
    def get_segments_distribution(cls, db: Session, run_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns distribution and feature profiles for segments of the specified or latest completed run."""
        target_run = None
        if run_id:
            target_run = db.query(ClusteringRunModel).filter(ClusteringRunModel.id == run_id).first()
        if not target_run:
            target_run = ClusteringRepository.get_latest_completed_run(db)
        
        if not target_run or not target_run.segment_profiles:
            return []

        import json
        distribution = []
        for sp in target_run.segment_profiles:
            avg_f = {}
            try:
                avg_f = json.loads(sp.average_features_json)
            except Exception:
                pass
            distribution.append({
                "cluster_label": sp.cluster_label,
                "segment_name": sp.segment_name,
                "customer_count": sp.customer_count,
                "segment_percentage": sp.segment_percentage,
                "average_features": avg_f,
                "marketing_strategy": sp.marketing_strategy,
            })
        return distribution
