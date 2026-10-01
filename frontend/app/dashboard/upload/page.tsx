"use client";

import React, { useState, useRef } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import {
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Database,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const { uploadFile, loadDemo, activeDatasetName, edaData, isLoading, error } = useSegmentIQ();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv")) {
        uploadFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const quality = edaData?.quality;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Dataset Upload & Data Quality
          <Upload className="w-6 h-6 text-indigo-400" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload custom customer CSV data or switch back to the built-in demo dataset.
        </p>
      </div>

      {/* Upload Drag & Drop Area */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 text-center space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all flex flex-col items-center justify-center space-y-4 ${
            isDragOver
              ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
              : "border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <Upload className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Drop your customer CSV here</h3>
            <p className="text-xs text-slate-400">or click to browse your computer (.csv files only)</p>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Supported columns: CustomerID, Age, Annual Income, Spending Score, Purchase Frequency
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">or</span>
        </div>

        <div className="flex justify-center">
          <button
            onClick={loadDemo}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-slate-200 border border-slate-700 shadow-md transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Use Built-in Demo Dataset
          </button>
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Unable to process dataset</div>
            <div>{error}</div>
            <div className="text-[11px] text-rose-400/80">
              Ensure your CSV file contains numerical features such as Age, Annual Income, Spending Score, or Purchase Frequency.
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Pipeline Indicator & Data Quality Metrics */}
      {quality && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Active Dataset Quality Audit</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Clustering
            </span>
          </div>

          {/* Pipeline Status */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓ Uploading
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓ Validating
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓ Preprocessing
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30">
              Ready
            </div>
          </div>

          {/* Quality Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Rows</div>
              <div className="text-xl font-bold text-white mt-1">{quality.total_rows}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Columns</div>
              <div className="text-xl font-bold text-white mt-1">{quality.total_columns}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Missing Values</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{quality.missing_values} (Auto-imputed)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Duplicate Records</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{quality.duplicate_rows} (Auto-cleaned)</div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex justify-end pt-2">
            <Link
              href="/dashboard/analysis"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all"
            >
              Proceed to Exploratory Data Analysis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
