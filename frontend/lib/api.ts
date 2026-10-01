import {
  EDAOverviewResponse,
  ClusteringResult,
  ModelComparisonResponse,
  InsightsResponse,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorData.detail || `API request failed with status ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export async function uploadCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_BASE_URL}/api/upload`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to upload CSV file.");
  }

  return await res.json();
}

export async function loadDemoDataset() {
  return await fetchJSON<{ message: string; filename: string; quality: any }>("/demo");
}

export async function getEDAAnalysis(): Promise<EDAOverviewResponse> {
  return await fetchJSON<EDAOverviewResponse>("/analysis");
}

export async function runKMeans(nClusters: number, features?: string[]): Promise<ClusteringResult> {
  return await fetchJSON<ClusteringResult>("/cluster/kmeans", {
    method: "POST",
    body: JSON.stringify({ n_clusters: nClusters, features }),
  });
}

export async function runHierarchical(nClusters: number, linkage: string = "ward", features?: string[]): Promise<ClusteringResult> {
  return await fetchJSON<ClusteringResult>("/cluster/hierarchical", {
    method: "POST",
    body: JSON.stringify({ n_clusters: nClusters, linkage, features }),
  });
}

export async function runDBSCAN(eps: number = 0.5, minSamples: number = 5, features?: string[]): Promise<ClusteringResult> {
  return await fetchJSON<ClusteringResult>("/cluster/dbscan", {
    method: "POST",
    body: JSON.stringify({ eps, min_samples: minSamples, features }),
  });
}

export async function compareModels(): Promise<ModelComparisonResponse> {
  return await fetchJSON<ModelComparisonResponse>("/compare-models", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getInsights(clusteringResult: ClusteringResult): Promise<InsightsResponse> {
  return await fetchJSON<InsightsResponse>("/insights", {
    method: "POST",
    body: JSON.stringify(clusteringResult),
  });
}

export async function downloadSegmentedCSV(clusteringResult: ClusteringResult) {
  const url = `${API_BASE_URL}/api/export`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clusteringResult),
  });

  if (!res.ok) {
    throw new Error("Export CSV failed.");
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = "segmentiq_customers_segmented.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
