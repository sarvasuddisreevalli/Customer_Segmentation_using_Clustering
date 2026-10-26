"""
clustering.py
-------------
API routes for clustering run execution, historical retrieval, customer table exploration,
visualizations, model comparisons, and CSV export.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.dependencies.db import get_db
from app.core.exceptions import (
    ClusteringExecutionError,
    ClusteringRunNotFoundError,
    DatasetNotFoundError,
)
from app.schemas.schemas import (
    ClusteringRunCreateRequest,
    ClusteringRunListResponse,
    ClusteringRunResponse,
    CustomerExplorerResponse,
    PCAVisualizationData,
)
from app.services.clustering_service import ClusteringService

router = APIRouter(prefix="/clustering", tags=["Clustering Runs"])


@router.post(
    "/runs",
    response_model=ClusteringRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute machine learning clustering on a dataset and persist results",
)
def create_clustering_run(
    request: ClusteringRunCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Runs K-Means, Hierarchical, or DBSCAN. Calculates true silhouette, Davies-Bouldin,
    Calinski-Harabasz metrics, assigns segments, derives customer personas, and stores all artifacts.
    """
    try:
        return ClusteringService.run_clustering(db, request)
    except (DatasetNotFoundError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except ClusteringExecutionError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.get(
    "/runs",
    response_model=ClusteringRunListResponse,
    summary="List historical clustering runs with optional dataset filtering",
)
def list_clustering_runs(
    dataset_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return ClusteringService.list_runs(db, dataset_id=dataset_id, page=page, page_size=page_size)


@router.get(
    "/runs/{run_id}",
    response_model=ClusteringRunResponse,
    summary="Retrieve complete details, evaluations, and segment profiles for a run",
)
def get_clustering_run(run_id: str, db: Session = Depends(get_db)):
    try:
        return ClusteringService.get_run(db, run_id)
    except ClusteringRunNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get(
    "/runs/{run_id}/visualizations",
    response_model=PCAVisualizationData,
    summary="Retrieve PCA 2D coordinates for cluster visualization",
)
def get_run_visualizations(run_id: str, db: Session = Depends(get_db)):
    try:
        return ClusteringService.get_run_visualizations(db, run_id)
    except ClusteringRunNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get(
    "/runs/{run_id}/customers",
    response_model=CustomerExplorerResponse,
    summary="Paginated customer table with cluster filtering and search",
)
def get_run_customers(
    run_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    cluster: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        return ClusteringService.get_customer_explorer(
            db, run_id=run_id, page=page, page_size=page_size, cluster_filter=cluster, search=search
        )
    except ClusteringRunNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get(
    "/runs/{run_id}/export",
    summary="Download the customer dataset with assigned clusters as sanitized CSV",
)
def export_run_csv(run_id: str, db: Session = Depends(get_db)):
    try:
        file_path, filename = ClusteringService.export_run_csv(db, run_id)
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="text/csv",
        )
    except ClusteringRunNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.post(
    "/compare",
    response_model=Dict[str, Any],
    summary="Run all 3 algorithms on the dataset and compare evaluation scores",
)
def compare_algorithms(
    dataset_id: str = Body(..., embed=True),
    selected_features: Optional[List[str]] = Body(None),
    db: Session = Depends(get_db),
):
    try:
        return ClusteringService.compare_algorithms(db, dataset_id, selected_features=selected_features)
    except DatasetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.post(
    "/elbow",
    response_model=Dict[str, Any],
    summary="Compute inertia and silhouette elbow values across K values",
)
def get_elbow(
    dataset_id: str = Body(..., embed=True),
    k_min: int = Body(2),
    k_max: int = Body(10),
    selected_features: Optional[List[str]] = Body(None),
    db: Session = Depends(get_db),
):
    try:
        return ClusteringService.get_elbow_data(
            db, dataset_id, k_min=k_min, k_max=k_max, selected_features=selected_features
        )
    except DatasetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
