"""
schemas.py
----------
Pydantic schemas for request validation and structured API responses.
Strict typing ensures high software quality and automated Swagger documentation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ── Generic Responses ─────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    timestamp: datetime


# ── Dataset Schemas ───────────────────────────────────────────────────────────

class DatasetListItem(BaseModel):
    id: str
    original_filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    validation_status: str
    processing_status: str
    created_at: datetime
    updated_at: datetime


class DatasetListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    datasets: List[DatasetListItem]


class NumericStat(BaseModel):
    column: str
    count: int
    mean: float
    median: float
    std: float
    min: float
    max: float
    q25: float
    q75: float
    skewness: float
    n_outliers: int
    pct_outliers: float


class DatasetPreviewResponse(BaseModel):
    dataset_id: str
    filename: str
    total_rows: int
    total_columns: int
    columns: List[str]
    column_types: Dict[str, List[str]]
    missing_counts: Dict[str, int]
    dtypes: Dict[str, str]
    head: List[Dict[str, Any]]
    numeric_stats: List[NumericStat]


class DatasetDetailResponse(BaseModel):
    id: str
    original_filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    columns: List[str]
    column_types: Dict[str, List[str]]
    validation_status: str
    processing_status: str
    created_at: datetime
    updated_at: datetime
    preview: Optional[DatasetPreviewResponse] = None


class PreprocessRequest(BaseModel):
    selected_features: Optional[List[str]] = Field(None, description="Subset of numeric features to retain")
    missing_strategy: str = Field("median", description="imputation: 'median', 'mean', or 'most_frequent'")
    drop_duplicates: bool = Field(True, description="Whether to drop identical rows")
    scale_type: str = Field("standard", description="Scaling: 'standard', 'minmax', or 'robust'")


class PreprocessingStep(BaseModel):
    stage: str
    status: str
    detail: str
    strategy: Optional[str] = None
    missing_before: Optional[int] = None
    missing_after: Optional[int] = None
    scaler: Optional[str] = None
    features: Optional[List[str]] = None


class PreprocessingReport(BaseModel):
    initial_rows: int
    final_rows: int
    initial_cols: int
    final_cols: int
    steps: List[Dict[str, Any]]
    feature_names: List[str]
    features_dropped: List[str]
    scaler_used: str


# ── Clustering Run Schemas ────────────────────────────────────────────────────

class ClusteringRunCreateRequest(BaseModel):
    dataset_id: str
    algorithm: str = Field(..., description="'kmeans', 'hierarchical', or 'dbscan'")
    selected_features: Optional[List[str]] = None
    missing_strategy: str = "median"
    drop_duplicates: bool = True
    scale_type: str = "standard"
    # Algorithm parameters
    n_clusters: Optional[int] = Field(4, ge=2, le=30, description="K-Means & Hierarchical cluster count")
    linkage: Optional[str] = Field("ward", description="Hierarchical linkage: ward, complete, average, single")
    eps: Optional[float] = Field(0.5, gt=0.01, le=10.0, description="DBSCAN epsilon radius")
    min_samples: Optional[int] = Field(5, ge=2, le=100, description="DBSCAN core point neighbor threshold")


class ModelEvaluationSchema(BaseModel):
    silhouette_score: Optional[float] = None
    davies_bouldin_index: Optional[float] = None
    calinski_harabasz_index: Optional[float] = None
    noise_percentage: float = 0.0
    metrics_valid: bool = True
    evaluation_warnings: Optional[str] = None


class SegmentProfileSchema(BaseModel):
    cluster_label: int
    segment_name: str
    customer_count: int
    segment_percentage: float
    average_features: Dict[str, float]
    distinguishing_characteristics: List[str]
    key_characteristics: Optional[List[str]] = None
    description: str
    marketing_strategy: Optional[str] = None
    marketing_campaign: Optional[str] = None
    business_goal: Optional[str] = None


class ClusteringRunResponse(BaseModel):
    id: str
    dataset_id: str
    dataset_name: Optional[str] = None
    algorithm: str
    status: str
    n_clusters_found: int
    noise_count: int
    processing_duration_seconds: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    selected_features: List[str]
    parameters: Dict[str, Any]
    evaluation: Optional[ModelEvaluationSchema] = None
    profiles: Optional[List[SegmentProfileSchema]] = None
    executive_summary: Optional[str] = None
    error_message: Optional[str] = None


class ClusteringRunListItem(BaseModel):
    id: str
    dataset_id: str
    dataset_name: str
    algorithm: str
    status: str
    n_clusters_found: int
    silhouette_score: Optional[float] = None
    processing_duration_seconds: float
    created_at: datetime


class ClusteringRunListResponse(BaseModel):
    total: int
    runs: List[ClusteringRunListItem]


# ── Analytics & Visualizations ────────────────────────────────────────────────

class PCAVisualPoint(BaseModel):
    customer_id: str
    pca_x: float
    pca_y: float
    cluster: int
    segment_name: Optional[str] = None


class PCAVisualizationData(BaseModel):
    explained_variance_ratio: List[float]
    total_variance_explained: float
    points: List[Dict[str, Any]]
    cluster_centers_pca: Optional[List[Dict[str, Any]]] = None


class AnalyticsOverviewResponse(BaseModel):
    total_datasets: int
    total_runs: int
    completed_runs: int
    failed_runs: int
    latest_run: Optional[ClusteringRunListItem] = None
    active_dataset_customers: Optional[int] = None
    active_dataset_name: Optional[str] = None
    discovered_segments_count: Optional[int] = None
    best_silhouette_score: Optional[float] = None
    best_model_algorithm: Optional[str] = None


class CustomerTableRow(BaseModel):
    row_id: str
    cluster: int
    segment_name: str
    attributes: Dict[str, Any]


class CustomerExplorerResponse(BaseModel):
    total_customers: int
    page: int
    page_size: int
    cluster_filter: Optional[int] = None
    customers: List[CustomerTableRow]
    feature_names: List[str]
