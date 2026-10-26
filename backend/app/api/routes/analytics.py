"""
analytics.py
------------
API routes for aggregate analytics, segment distributions, correlations, and feature diagnostics.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import pandas as pd

from app.api.dependencies.db import get_db
from app.core.exceptions import ClusteringRunNotFoundError, DatasetNotFoundError
from app.ml.advanced_analytics import (
    compute_correlation_matrix,
    compute_feature_distributions,
    compute_segment_comparison,
)
from app.models.db_models import ClusteringRunModel, DatasetModel
from app.repositories.clustering_repo import ClusteringRepository
from app.repositories.dataset_repo import DatasetRepository
from app.schemas.schemas import AnalyticsOverviewResponse
from app.services.analytics_service import AnalyticsService
from app.utils.storage import load_dataset_dataframe

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Get aggregated statistics across datasets, runs, and best model performance",
)
def get_analytics_overview(
    dataset_id: Optional[str] = Query(None, description="Optional dataset ID filter"),
    db: Session = Depends(get_db),
):
    return AnalyticsService.get_overview(db, dataset_id=dataset_id)


@router.get(
    "/segments",
    response_model=List[Dict[str, Any]],
    summary="Get segment distribution and characteristics for the active or specified run",
)
def get_segments_distribution(
    run_id: Optional[str] = Query(None, description="Optional run ID"),
    db: Session = Depends(get_db),
):
    return AnalyticsService.get_segments_distribution(db, run_id=run_id)


@router.get(
    "/correlations",
    summary="Get Pearson correlation matrix for numerical features of a dataset",
)
def get_correlations(
    dataset_id: str = Query(..., description="Target dataset ID"),
    db: Session = Depends(get_db),
):
    dataset = DatasetRepository.get_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
    df = load_dataset_dataframe(dataset.storage_path)
    return compute_correlation_matrix(df)


@router.get(
    "/distributions",
    summary="Get histogram and box-plot percentiles for a feature across segments",
)
def get_distributions(
    run_id: str = Query(..., description="Target clustering run ID"),
    feature: str = Query(..., description="Numerical feature name"),
    db: Session = Depends(get_db),
):
    run = ClusteringRepository.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found.")

    art = ClusteringRepository.get_artifact_by_run_and_type(db, run_id, "segmentation_csv")
    if not art:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found.")

    df = pd.read_csv(art.file_path)
    labels = df["Cluster"].values
    return compute_feature_distributions(df, feature=feature, labels=labels)


@router.get(
    "/comparison",
    summary="Get side-by-side segment feature comparisons against dataset baseline",
)
def get_segment_comparison(
    run_id: str = Query(..., description="Target clustering run ID"),
    db: Session = Depends(get_db),
):
    run = ClusteringRepository.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found.")

    art = ClusteringRepository.get_artifact_by_run_and_type(db, run_id, "segmentation_csv")
    if not art:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found.")

    df = pd.read_csv(art.file_path)
    labels = df["Cluster"].values
    import json
    feature_names = json.loads(run.selected_features)
    return compute_segment_comparison(df, labels, feature_names)
