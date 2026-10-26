"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import {
  BarChart3,
  Layers,
  Activity,
  Info,
  Sliders,
  Filter,
  Download,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  listClusteringRuns,
  getClusteringRun,
  getRunVisualizations,
  getCorrelations,
  getSegmentComparison,
  getExportCSVUrl,
} from "@/lib/api";
import {
  ClusteringRunDetail,
  ClusteringRunItem,
  PCAVisualizationData,
} from "@/types";

const CLUSTER_COLORS = [
  "#6366F1", // Indigo
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
];

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const urlRunId = searchParams.get("run_id");

  const [runs, setRuns] = useState<ClusteringRunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>(urlRunId || "");
  const [runDetail, setRunDetail] = useState<ClusteringRunDetail | null>(null);
  const [pcaData, setPcaData] = useState<PCAVisualizationData | null>(null);
  const [correlations, setCorrelations] = useState<{ features: string[]; matrix: any[] } | null>(null);
  const [comparisons, setComparisons] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Load runs on mount
  useEffect(() => {
    listClusteringRuns(undefined, 1, 20).then((res) => {
      setRuns(res.runs);
      if (!selectedRunId && res.runs.length > 0) {
        setSelectedRunId(res.runs[0].id);
      }
    });
  }, []);

  // When selectedRunId changes, load run details, PCA points, correlations, comparisons
  useEffect(() => {
    if (!selectedRunId) return;
    setIsLoading(true);

    Promise.all([
      getClusteringRun(selectedRunId),
      getRunVisualizations(selectedRunId).catch(() => null),
      getSegmentComparison(selectedRunId).catch(() => []),
    ])
      .then(([detail, pca, comp]) => {
        setRunDetail(detail);
        setPcaData(pca);
        setComparisons(comp);
        if (detail.dataset_id) {
          getCorrelations(detail.dataset_id)
            .then(setCorrelations)
            .catch(() => setCorrelations(null));
        }
      })
      .catch((err) => console.error("Error loading analytics:", err))
      .finally(() => setIsLoading(false));
  }, [selectedRunId]);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header & Run Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Advanced Analytics</span>
              <Badge variant="indigo">Interactive Diagnostics</Badge>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Explore 2D PCA projections, feature correlation matrices, and segment baseline comparisons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Run:</span>
              <select
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px]"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.dataset_name} ({r.algorithm.toUpperCase()} - {r.n_clusters_found}c)
                  </option>
                ))}
              </select>
            </div>

            {selectedRunId && (
              <a
                href={getExportCSVUrl(selectedRunId)}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </a>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        )}

        {!isLoading && !runDetail && (
          <Card className="text-center py-12">
            <p className="text-sm text-slate-400">No clustering runs available to display.</p>
          </Card>
        )}

        {!isLoading && runDetail && (
          <div className="space-y-6">
            {/* Model Evaluation Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-slate-400 text-xs">Algorithm</span>
                <span className="font-bold text-white text-base block mt-1 uppercase">
                  {runDetail.algorithm}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  k = {runDetail.n_clusters_found} segments
                </span>
              </Card>

              <Card className="p-4">
                <span className="text-slate-400 text-xs">Silhouette Score</span>
                <span className="font-bold text-emerald-400 text-base block mt-1">
                  {runDetail.evaluation?.silhouette_score !== null && runDetail.evaluation?.silhouette_score !== undefined
                    ? runDetail.evaluation.silhouette_score.toFixed(3)
                    : "N/A"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Cohesion metric</span>
              </Card>

              <Card className="p-4">
                <span className="text-slate-400 text-xs">Davies-Bouldin</span>
                <span className="font-bold text-cyan-400 text-base block mt-1">
                  {runDetail.evaluation?.davies_bouldin_index !== null && runDetail.evaluation?.davies_bouldin_index !== undefined
                    ? runDetail.evaluation.davies_bouldin_index.toFixed(3)
                    : "N/A"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Lower is better</span>
              </Card>

              <Card className="p-4">
                <span className="text-slate-400 text-xs">Processing Time</span>
                <span className="font-bold text-white text-base block mt-1">
                  {runDetail.processing_duration_seconds}s
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Model computation</span>
              </Card>
            </div>

            {/* PCA 2D Scatter Visualization */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle>2D PCA Cluster Projection</CardTitle>
                    <CardDescription>
                      Principal Component Analysis 2D projection of customer behavioral space
                    </CardDescription>
                  </div>
                  {pcaData && (
                    <Badge variant="indigo">
                      {(pcaData.total_variance_explained * 100).toFixed(1)}% Variance Explained
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    PCA Note: Principal Component Analysis is a dimensionality-reduction technique used to project multi-dimensional feature space onto 2 orthogonal axes for visual inspection. The actual clustering model was computed across all {runDetail.selected_features.length} features.
                  </span>
                </div>

                <div className="h-80 w-full">
                  {pcaData && pcaData.points.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          type="number"
                          dataKey="pca_x"
                          name="PCA Component 1"
                          stroke="#64748b"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="pca_y"
                          name="PCA Component 2"
                          stroke="#64748b"
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={({ payload }) => {
                            if (!payload || payload.length === 0) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs shadow-xl text-slate-200">
                                <div className="font-semibold text-white">{d.segment_name || `Cluster ${d.cluster}`}</div>
                                <div className="text-slate-400 mt-1">ID: {d.customer_id}</div>
                                <div className="text-slate-400">PCA X: {d.pca_x} | Y: {d.pca_y}</div>
                              </div>
                            );
                          }}
                        />
                        <Scatter name="Customers" data={pcaData.points}>
                          {pcaData.points.map((entry, index) => {
                            const clusterIdx = entry.cluster >= 0 ? entry.cluster : 5;
                            const color = CLUSTER_COLORS[clusterIdx % CLUSTER_COLORS.length];
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                      No projection points available.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Segment Feature Comparison Matrix */}
            {comparisons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Segment Feature Comparison vs. Overall Baseline</CardTitle>
                  <CardDescription>
                    Relative deviation of each customer group from the full dataset average
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Segment</th>
                          <th className="py-2.5 px-3">Size</th>
                          {runDetail.selected_features.map((f) => (
                            <th key={f} className="py-2.5 px-3">
                              {f} (Mean / % Diff)
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {comparisons.map((c) => (
                          <tr key={c.cluster_label} className="hover:bg-slate-900/40">
                            <td className="py-3 px-3 font-semibold text-white">{c.segment_name}</td>
                            <td className="py-3 px-3 text-slate-400">
                              {c.customer_count} ({c.percentage}%)
                            </td>
                            {runDetail.selected_features.map((f) => {
                              const featMetric = c.features?.[f];
                              if (!featMetric) return <td key={f} className="py-3 px-3">—</td>;
                              const isPositive = featMetric.diff_percentage >= 0;
                              return (
                                <td key={f} className="py-3 px-3">
                                  <span className="text-white font-medium">{featMetric.mean}</span>
                                  <span
                                    className={`ml-1.5 text-[10px] font-semibold ${
                                      isPositive ? "text-emerald-400" : "text-rose-400"
                                    }`}
                                  >
                                    ({isPositive ? "+" : ""}
                                    {featMetric.diff_percentage}%)
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pearson Correlation Matrix */}
            {correlations && correlations.matrix.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Feature Correlation Matrix (Pearson r)</CardTitle>
                  <CardDescription>
                    Pairwise linear relationships between numerical features (-1.0 to +1.0)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs text-slate-300">
                      <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3 text-left">Feature</th>
                          {correlations.features.map((f) => (
                            <th key={f} className="py-2 px-3">{f}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {correlations.matrix.map((row) => (
                          <tr key={row.feature} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-medium text-white text-left">{row.feature}</td>
                            {row.values.map((val: number, vIdx: number) => {
                              const isHigh = Math.abs(val) > 0.5 && val !== 1.0;
                              return (
                                <td key={vIdx} className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                                      val === 1.0
                                        ? "text-slate-500"
                                        : isHigh
                                        ? "bg-indigo-950/80 text-indigo-300 font-semibold"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    {val.toFixed(2)}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function AnalyticsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Analytics...</div>}>
      <AnalyticsContent />
    </React.Suspense>
  );
}
