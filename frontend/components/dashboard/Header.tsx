"use client";

import React from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { Database, User, RefreshCw, Download, LogOut } from "lucide-react";
import Link from "next/link";

export const Header: React.FC = () => {
  const { activeDatasetName, loadDemo, isLoading } = useSegmentIQ();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/60 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Active Dataset Status Indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-400 font-medium">Active Dataset:</span>
        <span className="font-semibold text-white font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/80">
          {activeDatasetName || "Mall_Customers.csv"}
        </span>
      </div>

      {/* Action Badges & Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* DB Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-medium text-[11px]">
          <Database className="w-3 h-3 text-emerald-400" />
          <span>DB: In-Memory DB</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-200 font-medium text-[11px]">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
            P
          </div>
          <span>Poornitha_reddy</span>
        </div>

        {/* Reset Kaggle Dataset Button */}
        <button
          onClick={loadDemo}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? "animate-spin" : ""}`} />
          <span>Reset Kaggle Dataset</span>
        </button>

        {/* Export Button */}
        <Link
          href="/dashboard/export"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-md shadow-emerald-500/20 transition-all text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </Link>

        {/* Logout Button */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-all text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </Link>
      </div>
    </header>
  );
};
