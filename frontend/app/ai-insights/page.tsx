"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  listClusteringRuns,
  getAIInsights,
  getAIStatus,
} from "@/lib/api";
import { ClusteringRunItem } from "@/types";

export default function AIInsightsPage() {
  const [runs, setRuns] = useState<ClusteringRunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [insights, setInsights] = useState<any | null>(null);
  const [aiStatus, setAiStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAIStatus().then(setAiStatus).catch(() => null);

    listClusteringRuns(undefined, 1, 20).then((res) => {
      setRuns(res.runs);
      if (res.runs.length > 0) {
        setSelectedRunId(res.runs[0].id);
      }
    });
  }, []);

  const fetchInsights = (runId: string) => {
    setIsLoading(true);
    getAIInsights(runId)
      .then(setInsights)
      .catch((err) => console.error("Error fetching AI insights:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (selectedRunId) {
      fetchInsights(selectedRunId);
    }
  }, [selectedRunId]);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>AI Customer Intelligence</span>
              <Badge variant="cyan">Evidence Grounded</Badge>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Automated, evidence-grounded interpretations derived from verified clustering metrics.
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
                    {r.dataset_name} ({r.algorithm.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => fetchInsights(selectedRunId)}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* AI Grounding Security Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Engine: <strong className="text-white">{aiStatus?.configured_provider || "Deterministic Grounded Engine"}</strong>. Zero customer PII transmitted.
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">Strict Numeric Validation Active</span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        )}

        {!isLoading && !insights && (
          <Card className="text-center py-12 text-slate-500 text-sm">
            No insights available. Please run a clustering model in the Studio.
          </Card>
        )}

        {!isLoading && insights && (
          <div className="space-y-6">
            {/* Executive Summary Card */}
            <Card className="bg-gradient-to-r from-indigo-950/30 via-slate-900 to-slate-900 border-indigo-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Executive Summary</span>
                  </CardTitle>
                  <Badge variant="indigo">Verified Calculation</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {insights.executive_summary}
                </p>
                {insights.model_performance_note && (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
                    {insights.model_performance_note}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Segment Deep-Dives */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">Segment Behavioral Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(insights.segment_insights || []).map((seg: any) => (
                  <Card key={seg.cluster_label} className="border-slate-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base text-white">{seg.segment_name}</CardTitle>
                          <span className="text-xs text-slate-400">
                            Cluster {seg.cluster_label} • {seg.customer_count.toLocaleString()} customers ({seg.percentage}%)
                          </span>
                        </div>
                        <Badge variant="cyan">{seg.percentage}%</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block">
                          Behavioral Interpretation:
                        </span>
                        <p className="text-slate-300 mt-1 leading-relaxed">{seg.interpretation}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-indigo-200">
                        <span className="font-semibold text-[10px] uppercase text-indigo-300 block">
                          Strategic Opportunity:
                        </span>
                        <p className="text-[11px] mt-0.5 text-slate-300">{seg.opportunity}</p>
                      </div>

                      <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{seg.limitations}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
