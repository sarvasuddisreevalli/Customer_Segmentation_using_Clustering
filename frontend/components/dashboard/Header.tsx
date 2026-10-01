"use client";

import React from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { Database, Sparkles, RefreshCw, Upload, FileText } from "lucide-react";
import Link from "next/link";

export const Header: React.FC = () => {
  const { activeDatasetName, edaData, loadDemo, isLoading } = useSegmentIQ();

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Dataset:</span>
          <span className="font-mono text-white font-semibold flex items-center gap-1.5">
            {activeDatasetName}
            {activeDatasetName.includes("demo") && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Demo
              </span>
            )}
          </span>
        </div>

        {edaData && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-200">{edaData.quality.total_rows} customers</span>
            <span>•</span>
            <span>{edaData.quality.numeric_columns.length} features</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={loadDemo}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? "animate-spin" : ""}`} />
          Reset Demo Data
        </button>

        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/20 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload New CSV
        </Link>
      </div>
    </header>
  );
};
