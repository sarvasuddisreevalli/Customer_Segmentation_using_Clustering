"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Layers,
  Activity,
  Award,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Sliders,
  TrendingUp,
  Brain,
  Lightbulb,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getAnalyticsOverview,
  getSegmentsDistribution,
  listClusteringRuns,
  loadDemoDataset,
} from "@/lib/api";
import { AnalyticsOverviewResponse, ClusteringRunItem } from "@/types";

const SEGMENT_COLORS = [
  "#6366F1", // Indigo
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
];

export default function OverviewPage() {
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<ClusteringRunItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ov, segs, runs] = await Promise.all([
        getAnalyticsOverview().catch(() => null),
        getSegmentsDistribution().catch(() => []),
        listClusteringRuns(undefined, 1, 5).catch(() => ({ total: 0, runs: [] })),
      ]);
      setOverview(ov);
      setSegments(segs || []);
      setRecentRuns(runs?.runs || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    try {
      await loadDemoDataset();
      await fetchData();
    } catch (err) {
      console.error("Failed to load demo:", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Prepare Donut chart data
  const pieData = segments.map((s, idx) => ({
    name: s.segment_name,
    value: s.customer_count,
    percentage: s.segment_percentage,
    color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
  }));

  const hasData = overview && overview.total_datasets > 0;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Title & Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Customer Intelligence Overview</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Live Analytics
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Data-grounded customer segmentation, cluster profiles, and ML performance metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/datasets">
              <Button variant="secondary" size="sm" leftIcon={<UploadCloud className="w-4 h-4" />}>
                Upload CSV
              </Button>
            </Link>
            <Link href="/studio">
              <Button variant="primary" size="sm" leftIcon={<Sliders className="w-4 h-4" />}>
                New Run
              </Button>
            </Link>
          </div>
        </div>

        {/* Empty State when no data */}
        {!isLoading && !hasData && (
          <EmptyState
            title="Turn Customer Data into Actionable Segments"
            description="Upload your customer dataset (CSV) to discover meaningful personas, compare clustering algorithms, and explore customer behavior."
            actionLabel="Upload First Dataset"
            onAction={() => (window.location.href = "/datasets")}
            secondaryActionLabel={isDemoLoading ? "Loading Demo..." : "Load Mall Customers Demo"}
            onSecondaryAction={handleLoadDemo}
          />
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        )}

        {/* Real KPI Cards */}
        {!isLoading && hasData && overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Customers Analyzed</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {overview.active_dataset_customers != null
                    ? overview.active_dataset_customers.toLocaleString()
                    : "—"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Dataset: {overview.active_dataset_name || "Active dataset"}
              </p>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Customer Segments</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {overview.discovered_segments_count !== null
                    ? overview.discovered_segments_count
                    : "—"}
                </span>
                <span className="text-xs text-emerald-400 font-medium">Discovered</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                From latest completed clustering run
              </p>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Clustering Runs</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {overview.completed_runs}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  / {overview.total_runs} total
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Persisted in PostgreSQL/SQLite
              </p>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Best Silhouette Score</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {overview.best_silhouette_score != null
                    ? overview.best_silhouette_score.toFixed(3)
                    : "—"}
                </span>
                {overview.best_model_algorithm && (
                  <Badge variant="indigo" className="uppercase text-[10px]">
                    {overview.best_model_algorithm}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Cohesion & separation index</p>
            </Card>
          </div>
        )}

        {/* Analytics & Segment Distribution Grid */}
        {!isLoading && hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Segment Population Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer Segment Distribution</CardTitle>
                    <CardDescription>
                      Actual proportion of customer population per discovered cluster
                    </CardDescription>
                  </div>
                  <Link href="/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                    Explore Analytics <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
                    <div className="h-56 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                          >
                            {pieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "0.5rem",
                              color: "#f8fafc",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {segments.map((seg, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
                            />
                            <span className="font-medium text-slate-200 truncate">
                              {seg.segment_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-slate-400">{seg.customer_count.toLocaleString()}</span>
                            <span className="font-semibold text-white">({seg.segment_percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-500">
                    No clustering segments discovered yet. Run your first segmentation model in the Studio.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Strategic Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Strategic Intelligence</span>
                </CardTitle>
                <CardDescription>Automated, data-backed insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs leading-relaxed text-indigo-200">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                    <Brain className="w-3.5 h-3.5" />
                    AI Customer Analyst
                  </div>
                  Ask SegmentIQ is ready to answer questions regarding customer spending habits, segment differences, and campaign strategies.
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    href="/ai-insights"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-indigo-400" />
                      View Segment Deep-Dives
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>

                  <Link
                    href="/recommendations"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Explore Recommendations
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>

                  <Link
                    href="/ask-segmentiq"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Ask SegmentIQ Chat
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Clustering Runs Table */}
        {!isLoading && hasData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Clustering Runs</CardTitle>
                  <CardDescription>
                    Historical model executions stored persistently in the database
                  </CardDescription>
                </div>
                <Link href="/reports" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                  View All Runs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentRuns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Dataset</th>
                        <th className="py-2.5 px-3">Algorithm</th>
                        <th className="py-2.5 px-3">Clusters</th>
                        <th className="py-2.5 px-3">Silhouette</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {recentRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3 font-medium text-white">{run.dataset_name}</td>
                          <td className="py-3 px-3">
                            <Badge variant="indigo" className="uppercase text-[10px]">
                              {run.algorithm}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">{run.n_clusters_found}</td>
                          <td className="py-3 px-3">
                            {run.silhouette_score !== null && run.silhouette_score !== undefined
                              ? run.silhouette_score.toFixed(3)
                              : "—"}
                          </td>
                          <td className="py-3 px-3 text-slate-400">{run.processing_duration_seconds}s</td>
                          <td className="py-3 px-3">
                            <Badge variant={run.status === "completed" ? "success" : "danger"}>
                              {run.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/analytics?run_id=${run.id}`}
                              className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                            >
                              View Analysis
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No recent runs recorded.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
