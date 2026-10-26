/**
 * api.ts – SegmentIQ Centralized Frontend API Client
 *
 * Full TypeScript client communicating with FastAPI backend:
 * - Phase 4 & 5 persistent REST routes (/api/datasets, /api/clustering, /api/analytics, /api/health)
 * - Phase 1 legacy routes (/api/*) and Phase 2-3 routes (/api/v2/*) preserved for backward compatibility.
 */

import {
  AnalyticsOverviewResponse,
  ClusteringResult,
  ClusteringRunDetail,
  ClusteringRunItem,
  ClusteringRunListResponse,
  ClusteringRunSummary,
  CustomerExplorerResponse,
  DatasetDetailResponse,
  DatasetItem,
  DatasetListResponse,
  DatasetPreviewResponse,
  EDAOverviewResponse,
  InsightsResponse,
  ModelComparisonResponse,
  PCAVisualizationData,
  PreprocessResponse,
} from "@/types";

export type { ClusteringRunSummary, ClusteringRunItem };

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Generic fetch wrapper ────────────────────────────────────────────────────

async function fetchJSON<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ detail: res.statusText, error: res.statusText }));
      throw new Error(
        errorData.message ||
          errorData.detail ||
          errorData.error ||
          `API request failed with status ${res.status}`
      );
    }

    return (await res.json()) as T;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`API Error on ${endpoint}:`, errMsg);
    throw error;
  }
}

// ── Modern Phase 4/5 API Functions ───────────────────────────────────────────

export async function getHealth() {
  return fetchJSON<{
    status: string;
    version: string;
    environment: string;
    database: string;
    timestamp: string;
  }>("/api/health");
}

export async function getAnalyticsOverview(datasetId?: string): Promise<AnalyticsOverviewResponse> {
  const q = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : "";
  return fetchJSON<AnalyticsOverviewResponse>(`/api/analytics/overview${q}`);
}

export async function getSegmentsDistribution(runId?: string): Promise<any[]> {
  const q = runId ? `?run_id=${encodeURIComponent(runId)}` : "";
  return fetchJSON<any[]>(`/api/analytics/segments${q}`);
}

export async function listDatasets(
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<DatasetListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) params.append("search", search);
  return fetchJSON<DatasetListResponse>(`/api/datasets?${params.toString()}`);
}

export async function getDataset(datasetId: string): Promise<DatasetDetailResponse> {
  return fetchJSON<DatasetDetailResponse>(`/api/datasets/${datasetId}`);
}

export async function getDatasetPreview(datasetId: string): Promise<DatasetPreviewResponse> {
  return fetchJSON<DatasetPreviewResponse>(`/api/datasets/${datasetId}/preview`);
}

export async function getDatasetEDA(datasetId: string): Promise<Record<string, any>> {
  return fetchJSON<Record<string, any>>(`/api/datasets/${datasetId}/eda`);
}

export async function uploadDatasetCSV(file: File): Promise<DatasetDetailResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const url = `${API_BASE_URL}/api/datasets/upload`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.message || errorData.detail || "Upload failed");
  }
  return (await res.json()) as DatasetDetailResponse;
}

export async function loadDemoDataset(): Promise<DatasetDetailResponse> {
  return fetchJSON<DatasetDetailResponse>("/api/datasets/demo", {
    method: "POST",
  });
}

export async function deleteDataset(datasetId: string): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/datasets/${datasetId}`, {
    method: "DELETE",
  });
}

export interface ClusteringRunParams {
  dataset_id: string;
  algorithm: "kmeans" | "hierarchical" | "dbscan";
  selected_features?: string[];
  missing_strategy?: string;
  drop_duplicates?: boolean;
  scale_type?: string;
  n_clusters?: number;
  linkage?: string;
  eps?: number;
  min_samples?: number;
}

export async function createClusteringRun(
  params: ClusteringRunParams
): Promise<ClusteringRunDetail> {
  return fetchJSON<ClusteringRunDetail>("/api/clustering/runs", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listClusteringRuns(
  datasetId?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ClusteringRunListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (datasetId) params.append("dataset_id", datasetId);
  return fetchJSON<ClusteringRunListResponse>(`/api/clustering/runs?${params.toString()}`);
}

export async function getClusteringRun(runId: string): Promise<ClusteringRunDetail> {
  return fetchJSON<ClusteringRunDetail>(`/api/clustering/runs/${runId}`);
}

export async function getRunVisualizations(runId: string): Promise<PCAVisualizationData> {
  return fetchJSON<PCAVisualizationData>(`/api/clustering/runs/${runId}/visualizations`);
}

export async function getRunCustomers(
  runId: string,
  page: number = 1,
  pageSize: number = 25,
  cluster?: number,
  search?: string
): Promise<CustomerExplorerResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (cluster !== undefined && cluster !== null) params.append("cluster", String(cluster));
  if (search) params.append("search", search);
  return fetchJSON<CustomerExplorerResponse>(`/api/clustering/runs/${runId}/customers?${params.toString()}`);
}

export function getExportCSVUrl(runId: string): string {
  return `${API_BASE_URL}/api/clustering/runs/${runId}/export`;
}

export function downloadSegmentedCSV(target?: string | any): void {
  const url =
    typeof target === "string"
      ? getExportCSVUrl(target)
      : target?.id
      ? getExportCSVUrl(target.id)
      : `${API_BASE_URL}/api/export`;
  window.open(url, "_blank");
}

export async function compareAlgorithms(
  datasetId: string,
  selectedFeatures?: string[]
): Promise<Record<string, any>> {
  return fetchJSON<Record<string, any>>("/api/clustering/compare", {
    method: "POST",
    body: JSON.stringify({
      dataset_id: datasetId,
      selected_features: selectedFeatures,
    }),
  });
}

export async function getElbowData(
  datasetId: string,
  kMin: number = 2,
  kMax: number = 10,
  selectedFeatures?: string[]
): Promise<Record<string, any>> {
  return fetchJSON<Record<string, any>>("/api/clustering/elbow", {
    method: "POST",
    body: JSON.stringify({
      dataset_id: datasetId,
      k_min: kMin,
      k_max: kMax,
      selected_features: selectedFeatures,
    }),
  });
}

// ── Phase 6 & 7 AI and Analytics ─────────────────────────────────────────────

export async function getCorrelations(datasetId: string): Promise<{ features: string[]; matrix: { feature: string; values: number[] }[] }> {
  return fetchJSON<{ features: string[]; matrix: { feature: string; values: number[] }[] }>(`/api/analytics/correlations?dataset_id=${encodeURIComponent(datasetId)}`);
}

export async function getDistributions(runId: string, feature: string): Promise<any> {
  return fetchJSON<any>(`/api/analytics/distributions?run_id=${encodeURIComponent(runId)}&feature=${encodeURIComponent(feature)}`);
}

export async function getSegmentComparison(runId: string): Promise<any[]> {
  return fetchJSON<any[]>(`/api/analytics/comparison?run_id=${encodeURIComponent(runId)}`);
}

export async function getAIStatus(): Promise<{ status: string; configured_provider: string; has_external_key: boolean; mode: string; privacy_policy: string }> {
  return fetchJSON<{ status: string; configured_provider: string; has_external_key: boolean; mode: string; privacy_policy: string }>("/api/ai/status");
}

export async function getAIInsights(runId?: string): Promise<any> {
  return fetchJSON<any>("/api/ai/insights", {
    method: "POST",
    body: JSON.stringify({ run_id: runId }),
  });
}

export async function getAIRecommendations(runId?: string): Promise<any[]> {
  return fetchJSON<any[]>("/api/ai/recommendations", {
    method: "POST",
    body: JSON.stringify({ run_id: runId }),
  });
}

export async function askSegmentIQ(question: string, runId?: string): Promise<{ question: string; answer: string; supporting_metrics: Record<string, any>; evidence_source: string; grounded: boolean }> {
  return fetchJSON<{ question: string; answer: string; supporting_metrics: Record<string, any>; evidence_source: string; grounded: boolean }>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ question, run_id: runId }),
  });
}

export async function getAIReport(runId?: string): Promise<{ run_id: string; dataset_name: string; report_markdown: string }> {
  return fetchJSON<{ run_id: string; dataset_name: string; report_markdown: string }>("/api/ai/reports", {
    method: "POST",
    body: JSON.stringify({ run_id: runId }),
  });
}

// ── Phase 1 Legacy Functions (Backward Compatibility) ─────────────────────────

export async function uploadCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const url = `${API_BASE_URL}/api/upload`;
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function getEDAAnalysis(): Promise<EDAOverviewResponse> {
  return fetchJSON<EDAOverviewResponse>("/api/analysis");
}

export async function preprocessDataset(
  fillMissingOrOptions:
    | boolean
    | {
        fill_missing?: boolean;
        drop_duplicates?: boolean;
        scale_type?: string;
        selected_features?: string[];
        missing_strategy?: string;
      } = true,
  dropDuplicates: boolean = true,
  scaleType: string = "StandardScaler",
  selectedFeatures: string[] = [],
  missingStrategy?: string
): Promise<PreprocessResponse> {
  let body: Record<string, any>;
  if (typeof fillMissingOrOptions === "object" && fillMissingOrOptions !== null) {
    body = fillMissingOrOptions;
  } else {
    body = {
      fill_missing: fillMissingOrOptions,
      drop_duplicates: dropDuplicates,
      scale_type: scaleType,
      selected_features: selectedFeatures,
      missing_strategy: missingStrategy,
    };
  }
  return fetchJSON<PreprocessResponse>("/api/preprocess", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function runKMeans(nClusters: number = 4): Promise<ClusteringResult> {
  return fetchJSON<ClusteringResult>("/api/cluster/kmeans", {
    method: "POST",
    body: JSON.stringify({ n_clusters: nClusters }),
  });
}

export async function runHierarchical(
  nClusters: number = 4,
  linkage: string = "ward"
): Promise<ClusteringResult> {
  return fetchJSON<ClusteringResult>("/api/cluster/hierarchical", {
    method: "POST",
    body: JSON.stringify({ n_clusters: nClusters, linkage }),
  });
}

export async function runDBSCAN(
  eps: number = 0.5,
  minSamples: number = 5
): Promise<ClusteringResult> {
  return fetchJSON<ClusteringResult>("/api/cluster/dbscan", {
    method: "POST",
    body: JSON.stringify({ eps, min_samples: minSamples }),
  });
}

export async function compareModels(): Promise<ModelComparisonResponse> {
  return fetchJSON<ModelComparisonResponse>("/api/compare-models", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getInsights(clusterResult: ClusteringResult): Promise<InsightsResponse> {
  return fetchJSON<InsightsResponse>("/api/insights", {
    method: "POST",
    body: JSON.stringify(clusterResult),
  });
}
