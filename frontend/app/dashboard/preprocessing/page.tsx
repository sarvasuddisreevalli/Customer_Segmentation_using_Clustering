"use client";

import React, { useState } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { SlidersHorizontal, Check, RefreshCw, CheckSquare } from "lucide-react";

export default function PreprocessingModulePage() {
  const { edaData } = useSegmentIQ();

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "Age",
    "Annual Income (k$)",
    "Spending Score (1-100)",
  ]);

  const [missingStrategy, setMissingStrategy] = useState<"median" | "remove">("median");
  const [scalingStrategy, setScalingStrategy] = useState<string>("StandardScaler");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      if (selectedFeatures.length > 2) {
        setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
      }
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const handleApply = () => {
    setIsApplying(true);
    setApplySuccess(false);
    setTimeout(() => {
      setIsApplying(false);
      setApplySuccess(true);
    }, 600);
  };

  const totalMissing = edaData?.quality?.missing_values || 0;
  const duplicateCount = edaData?.quality?.duplicate_rows || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Data Preprocessing Module</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure missing value handling, feature selection, and standardization
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Preprocessing Pipeline Settings</h2>
          </div>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isApplying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
            ) : (
              <Check className="w-3.5 h-3.5 text-slate-950" />
            )}
            <span>{applySuccess ? "PREPROCESSING APPLIED" : "APPLY PREPROCESSING"}</span>
          </button>
        </div>

        {/* 3 Config Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Feature Selection */}
          <div className="bg-[#0D1424] border border-slate-800/80 rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              FEATURE SELECTION
            </span>
            <div className="space-y-2 text-xs">
              {["CustomerID", "Age", "Annual Income (k$)", "Spending Score (1-100)"].map((feat) => {
                const isChecked = selectedFeatures.includes(feat);
                return (
                  <label
                    key={feat}
                    onClick={() => toggleFeature(feat)}
                    className="flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span>{feat}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
              Check features to include in distance calculations.
            </p>
          </div>

          {/* 2. Missing Value Strategy */}
          <div className="bg-[#0D1424] border border-slate-800/80 rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              MISSING VALUE STRATEGY
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setMissingStrategy("median")}
                className={`px-3 py-2 rounded-lg font-medium border text-center transition-all ${
                  missingStrategy === "median"
                    ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300 font-semibold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Median Imputation
              </button>
              <button
                onClick={() => setMissingStrategy("remove")}
                className={`px-3 py-2 rounded-lg font-medium border text-center transition-all ${
                  missingStrategy === "remove"
                    ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300 font-semibold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Remove Missing Rows
              </button>
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
              Impute missing numeric values using column median.
            </p>
          </div>

          {/* 3. Feature Scaling */}
          <div className="bg-[#0D1424] border border-slate-800/80 rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              FEATURE SCALING
            </span>
            <select
              value={scalingStrategy}
              onChange={(e) => setScalingStrategy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="StandardScaler">StandardScaler (Mean=0, Variance=1)</option>
              <option value="MinMaxScaler">MinMaxScaler (Range 0 to 1)</option>
              <option value="RobustScaler">RobustScaler (IQR Centered)</option>
            </select>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
              Normalizes features to prevent high-range dominance.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Missing Values Status */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Missing Values Status
          </span>
          <span className="text-lg font-bold text-emerald-400">
            Cleaned ({totalMissing} missing)
          </span>
        </div>

        {/* Duplicate Status */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Duplicate Status
          </span>
          <span className="text-lg font-bold text-emerald-400">
            {duplicateCount} Duplicates
          </span>
        </div>

        {/* Active Selected Features */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Selected Features
          </span>
          <span className="text-lg font-bold text-cyan-400">
            {selectedFeatures.length} Features
          </span>
        </div>

        {/* Scaling Status */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Scaling Status
          </span>
          <span className="text-lg font-bold text-cyan-400">
            STANDARD
          </span>
        </div>
      </div>
    </div>
  );
}
