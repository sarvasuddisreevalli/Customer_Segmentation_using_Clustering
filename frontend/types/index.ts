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
  avg_income: number;
  avg_spending: number;
  avg_age: number;
  avg_frequency: number;
  avg_order_value: number;
  avg_recency: number;
  description: string;
  key_characteristics: string[];
  marketing_recommendation: MarketingRecommendation;
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

