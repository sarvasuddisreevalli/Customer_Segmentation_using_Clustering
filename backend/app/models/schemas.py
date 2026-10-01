from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DataQuality(BaseModel):
    total_rows: int
    total_columns: int
    missing_values: int
    duplicate_rows: int
    numeric_columns: List[str]
    categorical_columns: List[str]

class ColumnStat(BaseModel):
    column: str
    mean: float
    median: float
    min: float
    max: float
    std: float

class DistributionData(BaseModel):
    bin_label: str
    count: int

class CorrelationData(BaseModel):
    feature1: str
    feature2: str
    correlation: float

class EDAOverviewResponse(BaseModel):
    quality: DataQuality
    statistics: List[ColumnStat]
    distributions: Dict[str, List[DistributionData]]
    correlations: List[CorrelationData]
    sample_records: List[Dict[str, Any]]

class KMeansParams(BaseModel):
    n_clusters: Optional[int] = Field(default=4, ge=2, le=10)
    features: Optional[List[str]] = None

class HierarchicalParams(BaseModel):
    n_clusters: Optional[int] = Field(default=4, ge=2, le=10)
    linkage: Optional[str] = Field(default="ward")
    features: Optional[List[str]] = None

class DBSCANParams(BaseModel):
    eps: Optional[float] = Field(default=0.5, gt=0.0)
    min_samples: Optional[int] = Field(default=5, ge=1)
    features: Optional[List[str]] = None

class ClusterPoint(BaseModel):
    customer_id: str
    gender: Optional[str] = "N/A"
    age: float
    income: float
    spending_score: float
    purchase_frequency: float
    avg_order_value: Optional[float] = 0.0
    recency: Optional[float] = 0.0
    cluster_id: int
    segment_name: str
    pca_x: float
    pca_y: float

class ClusterSummary(BaseModel):
    cluster_id: int
    segment_name: str
    count: int
    percentage: float
    avg_income: float
    avg_spending: float
    avg_age: float
    avg_frequency: float
    avg_order_value: float
    avg_recency: float

class ElbowMetric(BaseModel):
    k: int
    inertia: float
    silhouette: float
    davies_bouldin: float
    calinski_harabasz: float

class DendrogramNode(BaseModel):
    x: List[float]
    y: List[float]

class ClusteringResult(BaseModel):
    algorithm: str
    n_clusters: int
    noise_count: int
    silhouette_score: float
    davies_bouldin_score: float
    calinski_harabasz_score: float
    elbow_data: Optional[List[ElbowMetric]] = None
    dendrogram_data: Optional[Dict[str, Any]] = None
    points: List[ClusterPoint]
    cluster_summaries: List[ClusterSummary]

class ModelComparisonItem(BaseModel):
    algorithm: str
    clusters: int
    silhouette_score: float
    davies_bouldin_score: float
    calinski_harabasz_score: float
    is_recommended: bool
    explanation: str

class ModelComparisonResponse(BaseModel):
    comparison_table: List[ModelComparisonItem]
    recommended_model: str
    summary_explanation: str

class MarketingRecommendation(BaseModel):
    strategy: str
    campaign: str
    business_goal: str

class SegmentProfile(BaseModel):
    cluster_id: int
    segment_name: str
    customer_count: int
    percentage: float
    avg_income: float
    avg_spending: float
    avg_age: float
    avg_frequency: float
    avg_order_value: float
    avg_recency: float
    description: str
    key_characteristics: List[str]
    marketing_recommendation: MarketingRecommendation

class InsightsResponse(BaseModel):
    executive_summary: str
    highest_value_segment: SegmentProfile
    largest_segment: SegmentProfile
    highest_spending_segment: SegmentProfile
    most_frequent_segment: SegmentProfile
    lowest_engagement_segment: SegmentProfile
    all_profiles: List[SegmentProfile]
