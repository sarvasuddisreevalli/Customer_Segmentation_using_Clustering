"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FileText,
  Download,
  Eye,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  listClusteringRuns,
  getAIReport,
  getExportCSVUrl,
  ClusteringRunSummary,
} from "@/lib/api";

export default function ReportsPage() {
  const [runs, setRuns] = useState<ClusteringRunSummary[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [loadingRuns, setLoadingRuns] = useState<boolean>(true);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [reportDatasetName, setReportDatasetName] = useState<string>("");
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      setLoadingRuns(true);
      setError(null);
      const res = await listClusteringRuns(undefined, 1, 30);
      setRuns(res.runs);
      if (res.runs.length > 0) {
        setSelectedRunId(res.runs[0].id);
      }
    } catch (err: any) {
      setError("Failed to load clustering runs.");
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleGenerateReport = async (runId?: string) => {
    const targetRun = runId || selectedRunId;
    if (!targetRun) return;

    try {
      setGeneratingReport(true);
      setError(null);
      const res = await getAIReport(targetRun);
      setReportMarkdown(res.report_markdown);
      setReportDatasetName(res.dataset_name);
    } catch (err: any) {
      setError(err?.message || "Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!reportMarkdown) return;
    const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SegmentIQ_Report_${reportDatasetName.replace(/\.[^/.]+$/, "") || "Run"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Reports & Artifact Exports
            </h1>
            <Badge variant="success">Phase 6 & 7</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Generate executive segmentation reports, export customer-cluster assignments, and download model summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRuns}
            disabled={loadingRuns}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingRuns ? "animate-spin" : ""}`} />}
          >
            Refresh Runs
          </Button>
          {selectedRunId && (
            <Button
              size="sm"
              onClick={() => handleGenerateReport(selectedRunId)}
              disabled={generatingReport}
              icon={<Sparkles className="w-3.5 h-3.5 text-indigo-300" />}
            >
              {generatingReport ? "Generating..." : "Generate AI Report"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Runs List & Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Clustering Runs Table */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader
              title="Clustering Runs"
              subtitle="Select a model run to export or generate an executive brief"
            />
            <CardContent className="p-0">
              {loadingRuns ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  Loading runs...
                </div>
              ) : runs.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No runs available"
                    description="Execute a clustering run in Segmentation Studio to generate reports."
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-800 max-h-[560px] overflow-y-auto">
                  {runs.map((run) => {
                    const isSelected = run.id === selectedRunId;
                    return (
                      <div
                        key={run.id}
                        onClick={() => setSelectedRunId(run.id)}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-950/40 border-l-4 border-indigo-500"
                            : "hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-sm text-slate-200 uppercase tracking-wider">
                            {run.algorithm}
                          </span>
                          <Badge variant="indigo">
                            {run.n_clusters} clusters
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                          <p className="truncate">
                            Dataset: <span className="text-slate-300">{run.dataset_name || run.dataset_id.slice(0, 8)}</span>
                          </p>
                          <p>
                            Silhouette:{" "}
                            <span className="text-slate-200 font-mono">
                              {run.silhouette_score != null ? run.silhouette_score.toFixed(3) : "N/A"}
                            </span>
                          </p>
                          <p className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {new Date(run.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                          <a
                            href={getExportCSVUrl(run.id)}
                            download
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-2 rounded bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            Export CSV
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRunId(run.id);
                              handleGenerateReport(run.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-cyan-400" />
                            Generate Brief
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Executive Report Display */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Executive Analytics Report"
              subtitle={
                reportDatasetName
                  ? `Structured findings for ${reportDatasetName}`
                  : "Ground-truth summaries with verifiable metric references"
              }
              action={
                reportMarkdown ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadMarkdown}
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Markdown
                  </Button>
                ) : null
              }
            />
            <CardContent>
              {generatingReport ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-sm text-slate-300 font-medium">
                    Compiling evidence and generating executive report...
                  </p>
                  <p className="text-xs text-slate-500">
                    Extracting segment distributions, cluster statistics, and KPI hypotheses.
                  </p>
                </div>
              ) : reportMarkdown ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-emerald-400 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Report generated using zero-hallucination ground truth statistics.
                    </span>
                    <Badge variant="success">Deterministic & Grounded</Badge>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-[640px] select-text">
                    {reportMarkdown}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <EmptyState
                    title="No report generated yet"
                    description="Select a clustering run on the left and click 'Generate AI Report' to produce a formatted executive brief."
                  />
                  {selectedRunId && (
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(selectedRunId)}
                        icon={<Sparkles className="w-3.5 h-3.5 text-indigo-300" />}
                      >
                        Generate Now
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
