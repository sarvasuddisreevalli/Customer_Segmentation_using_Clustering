"use client";

import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Filter,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  listClusteringRuns,
  getAIRecommendations,
} from "@/lib/api";
import { ClusteringRunItem } from "@/types";

export default function RecommendationsPage() {
  const [runs, setRuns] = useState<ClusteringRunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    listClusteringRuns(undefined, 1, 20).then((res) => {
      setRuns(res.runs);
      if (res.runs.length > 0) {
        setSelectedRunId(res.runs[0].id);
      }
    });
  }, []);

  const fetchRecs = (runId: string) => {
    setIsLoading(true);
    getAIRecommendations(runId)
      .then(setRecommendations)
      .catch((err) => console.error("Error fetching recommendations:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (selectedRunId) {
      fetchRecs(selectedRunId);
    }
  }, [selectedRunId]);

  const filteredRecs = recommendations.filter((r) => {
    if (priorityFilter === "all") return true;
    return r.priority.toLowerCase() === priorityFilter.toLowerCase();
  });

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Business Recommendations</span>
              <Badge variant="indigo">Prioritized Hypotheses</Badge>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Grounded, testable marketing actions and retention hypotheses derived from cluster population metrics.
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

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hypothesis Disclaimer Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Marketing Experimentation Principle: Recommendations represent structured hypotheses derived from feature distributions. Before wide-scale rollout, conduct controlled A/B experiments to measure statistical lift on target KPIs.
          </span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        )}

        {!isLoading && filteredRecs.length === 0 && (
          <Card className="text-center py-12 text-slate-500 text-xs">
            No recommendations match the selected filter.
          </Card>
        )}

        {/* Recommendations List */}
        {!isLoading && filteredRecs.length > 0 && (
          <div className="space-y-4">
            {filteredRecs.map((rec) => {
              const priorityBadge =
                rec.priority === "High"
                  ? "danger"
                  : rec.priority === "Medium"
                  ? "warning"
                  : "default";

              return (
                <Card key={rec.id} className="border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{rec.title}</h3>
                        <span className="text-xs text-slate-400">Target Segment: {rec.segment}</span>
                      </div>
                    </div>
                    <Badge variant={priorityBadge as any}>{rec.priority} Priority</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Suggested Business Action:
                        </span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">{rec.action}</p>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                        <strong className="text-slate-300">Supporting Evidence:</strong> {rec.evidence}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Expected Directional Impact:
                        </span>
                        <p className="text-indigo-300 mt-0.5 leading-relaxed">{rec.expected_impact}</p>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-[11px] text-emerald-300">
                        <strong className="text-emerald-400">Suggested Metric (KPI):</strong> {rec.success_metric}
                      </div>
                    </div>
                  </div>

                  {rec.limitations && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{rec.limitations}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
