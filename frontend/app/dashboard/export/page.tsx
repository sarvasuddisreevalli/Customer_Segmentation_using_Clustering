"use client";

import React, { useState } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { Download, FileSpreadsheet, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { downloadSegmentedCSV } from "@/lib/api";

export default function ExportPage() {
  const { clusteringResult, insights, activeDatasetName } = useSegmentIQ();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportCSV = async () => {
    if (!clusteringResult) return;
    setIsExporting(true);
    setExportSuccess(false);
    try {
      await downloadSegmentedCSV(clusteringResult);
      setExportSuccess(true);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSONStats = () => {
    if (!insights) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(insights, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "segmentiq_insights_summary.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Export Segmented Data & Reports
          <Download className="w-6 h-6 text-indigo-400" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Export full customer datasets enriched with Machine Learning cluster IDs, segment profiles, and executive stats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Full CSV Card */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 w-fit rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Segmented Customer CSV</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Contains original customer feature columns appended with predicted <code className="text-indigo-300 font-mono">Cluster_ID</code> and dynamic <code className="text-indigo-300 font-mono">Segment_Name</code> labels.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Original Numerical Customer Features
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Predicted Machine Learning Cluster ID
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Human-Readable Segment Persona
              </div>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!clusteringResult || isExporting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Preparing CSV Download..." : "Download Segmented CSV"}
          </button>
        </div>

        {/* Export JSON Executive Summary Card */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 w-fit rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Executive Insights JSON</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Export executive takeaways, high-value segment profiles, and recommended marketing campaign strategies in JSON format.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Cluster Persona Breakdown & Metrics
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Marketing Campaign Suggestions
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Machine Learning Model Evaluation
              </div>
            </div>
          </div>

          <button
            onClick={handleExportJSONStats}
            disabled={!insights}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-slate-200 border border-slate-700 shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export Executive Report (JSON)
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Successfully generated and downloaded segmented customer dataset!
        </div>
      )}
    </div>
  );
}
