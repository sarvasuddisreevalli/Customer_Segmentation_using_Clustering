export interface DataQuality {
  total_rows: number;
  total_columns: number;
  missing_values: number;
  duplicate_rows: number;
  numeric_columns: string[];
  categorical_columns: string[];
}

export interface ColumnStat {
  column: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
}

export interface NumericStat {
  column: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  skewness: number;
  n_outliers: number;
  pct_outliers: number;
}

export interface DistributionData {
  bin_label: string;
  count: number;
}

export interface CorrelationData {
  feature1: string;
  feature2: string;
  correlation: number;
}

export interface EDAOverviewResponse {
  quality: DataQuality;
  statistics: ColumnStat[];
  distributions: Record<string, DistributionData[]>;
  correlations: CorrelationData[];
  sample_records: Record<string, any>[];
}

export interface ClusterPoint {
  customer_id: string;
  gender?: string;
  age: number;
  income: number;
  spending_score: number;
  purchase_frequency: number;
  avg_order_value?: number;
  recency?: number;
  cluster_id: number;
  segment_name: string;
  pca_x: number;
  pca_y: number;
  cluster?: number;
}

export interface ClusterSummary {
  cluster_id: number;
  segment_name: string;
  count: number;
  percentage: number;
  avg_income: number;
  avg_spending: number;
  avg_age: number;
  avg_frequency: number;
  avg_order_value: number;
  avg_recency: number;
}

export interface ElbowMetric {
  k: number;
  inertia: number;
  silhouette: number;
  davies_bouldin: number;
  calinski_harabasz: number;
}

export interface ClusteringResult {
  algorithm: string;
  n_clusters: number;
  noise_count: number;
  silhouette_score: number;
  davies_bouldin_score: number;
  calinski_harabasz_score: number;
  elbow_data?: ElbowMetric[];
  dendrogram_data?: {
    icoord: number[][];
    dcoord: number[][];
    ivl: string[];
  };
  points: ClusterPoint[];
  cluster_summaries: ClusterSummary[];
}

export interface ModelComparisonItem {
  algorithm: string;
  clusters: number;
  silhouette_score: number;
  davies_bouldin_score: number;
  calinski_harabasz_score: number;
  is_recommended: boolean;
  explanation: string;
}

export interface ModelComparisonResponse {
  comparison_table: ModelComparisonItem[];
  recommended_model: string;
  summary_explanation: string;
}

export interface MarketingRecommendation {
  strategy: string;
  campaign: string;
  business_goal: string;
}

export interface SegmentProfile {
  cluster_id: number;
  segment_name: string;
  customer_count: number;
  percentage: number;
  avg_income?: number;
  avg_spending?: number;
  avg_age?: number;
  avg_frequency?: number;
  avg_order_value?: number;
  avg_recency?: number;
  average_features?: Record<string, number>;
  description: string;
  key_characteristics?: string[];
  distinguishing_characteristics?: string[];
  marketing_recommendation?: MarketingRecommendation;
}

export interface InsightsResponse {
  executive_summary: string;
  highest_value_segment: SegmentProfile;
  largest_segment: SegmentProfile;
  highest_spending_segment: SegmentProfile;
  most_frequent_segment: SegmentProfile;
  lowest_engagement_segment: SegmentProfile;
  all_profiles: SegmentProfile[];
}

export interface PreprocessStageInfo {
  stage_id: string;
  title: string;
  status: "completed" | "active" | "skipped";
  summary: string;
  details: Record<string, any>;
}

export interface PreprocessResponse {
  message: string;
  raw_info: Record<string, any>;
  clean_info: Record<string, any>;
  selected_features: string[];
  pipeline_flow: PreprocessStageInfo[];
  raw_sample: Record<string, any>[];
  clean_sample: Record<string, any>[];
}

// ── Phase 4 & 5 Modern Schema Types ──────────────────────────────────────────

export interface DatasetItem {
  id: string;
  original_filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  validation_status: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export type DatasetDetailResponse = DatasetItem;

export interface DatasetListResponse {
  total: number;
  page: number;
  page_size: number;
  datasets: DatasetItem[];
}

export interface DatasetPreviewResponse {
  dataset_id: string;
  filename: string;
  total_rows: number;
  total_columns: number;
  columns: string[];
  column_types: {
    numeric: string[];
    categorical: string[];
  };
  missing_counts: Record<string, number>;
  dtypes: Record<string, string>;
  head: Record<string, any>[];
  numeric_stats: NumericStat[];
}

export interface ClusteringRunItem {
  id: string;
  dataset_id: string;
  dataset_name: string;
  algorithm: string;
  status: string;
  n_clusters: number;
  n_clusters_found: number;
  silhouette_score?: number | null;
  processing_duration_seconds: number;
  created_at: string;
}

export type ClusteringRunSummary = ClusteringRunItem;

export interface ClusteringRunListResponse {
  total: number;
  runs: ClusteringRunItem[];
}

export interface ModelEvaluationSchema {
  silhouette_score?: number | null;
  davies_bouldin_index?: number | null;
  calinski_harabasz_index?: number | null;
  noise_percentage: number;
  metrics_valid: boolean;
  evaluation_warnings?: string | null;
}

export interface SegmentProfileSchema {
  cluster_label: number;
  segment_name: string;
  customer_count: number;
  segment_percentage: number;
  average_features: Record<string, number>;
  distinguishing_characteristics: string[];
  key_characteristics?: string[];
  description: string;
  marketing_strategy?: string | null;
  marketing_campaign?: string | null;
  business_goal?: string | null;
}

export interface ClusteringRunDetail {
  id: string;
  dataset_id: string;
  dataset_name?: string;
  algorithm: string;
  status: string;
  n_clusters_found: number;
  noise_count: number;
  processing_duration_seconds: number;
  created_at: string;
  completed_at?: string | null;
  selected_features: string[];
  parameters: Record<string, any>;
  evaluation?: ModelEvaluationSchema | null;
  profiles?: SegmentProfileSchema[];
  executive_summary?: string | null;
  error_message?: string | null;
}

export interface PCAVisualPoint {
  point_index: number;
  customer_id: string;
  pca_x: number;
  pca_y: number;
  cluster: number;
  is_noise: boolean;
  segment_name?: string;
}

export interface PCAVisualizationData {
  explained_variance_ratio: number[];
  total_variance_explained: number;
  points: PCAVisualPoint[];
}

export interface CustomerTableRow {
  row_id: string;
  cluster: number;
  segment_name: string;
  attributes: Record<string, any>;
}

export interface CustomerExplorerResponse {
  total_customers: number;
  page: number;
  page_size: number;
  cluster_filter?: number | null;
  customers: CustomerTableRow[];
  feature_names: string[];
}

export interface AnalyticsOverviewResponse {
  total_datasets: number;
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  latest_run?: ClusteringRunItem | null;
  active_dataset_customers?: number | null;
  active_dataset_name?: string | null;
  discovered_segments_count?: number | null;
  best_silhouette_score?: number | null;
  best_model_algorithm?: string | null;
}
