"use client";

import React, { useState, useEffect } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import {
  SlidersHorizontal,
  Check,
  RefreshCw,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  Table,
  Sparkles,
  Database,
  Filter,
  Scale,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
  RotateCcw,
  ChevronRight,
  Scissors,
  Wrench,
  Sliders,
  Cpu
} from "lucide-react";

export default function PreprocessingModulePage() {
  const { edaData, preprocessResult, applyPreprocessing, isLoading } = useSegmentIQ();

  const availableFeatures: string[] = edaData?.quality?.numeric_columns || (edaData as any)?.clean_info?.numeric_columns || [
    "Age",
    "Annual Income",
    "Spending Score"
  ];

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [missingStrategy, setMissingStrategy] = useState<"median" | "mean" | "remove">("median");
  const [dropDuplicates, setDropDuplicates] = useState<boolean>(true);
  const [scalingStrategy, setScalingStrategy] = useState<string>("standard");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"raw" | "cleaned" | "stats">("cleaned");
  const [activeNodeId, setActiveNodeId] = useState<string>("ingestion");

  useEffect(() => {
    if (availableFeatures.length > 0 && selectedFeatures.length === 0) {
      setSelectedFeatures(availableFeatures);
    }
  }, [availableFeatures]);

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      if (selectedFeatures.length > 2) {
        setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
      }
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const selectAllFeatures = () => {
    setSelectedFeatures(availableFeatures);
  };

  const resetDefaults = () => {
    setSelectedFeatures(availableFeatures);
    setMissingStrategy("median");
    setDropDuplicates(true);
    setScalingStrategy("standard");
  };

  const handleApply = async () => {
    setIsApplying(true);
    setApplySuccess(false);
    setApplyError(null);
    try {
      await applyPreprocessing(
        missingStrategy !== "remove",
        dropDuplicates,
        scalingStrategy,
        selectedFeatures,
        missingStrategy
      );
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 3500);
    } catch (err: any) {
      console.error("Failed to apply preprocessing:", err);
      setApplyError(err.message || "Preprocessing execution failed.");
    } finally {
      setIsApplying(false);
    }
  };

  const rawRows = preprocessResult?.raw_info?.total_rows || edaData?.quality?.total_rows || 200;
  const rawCols = preprocessResult?.raw_info?.total_columns || edaData?.quality?.total_columns || 5;
  const totalMissing = preprocessResult?.raw_info?.missing_values ?? edaData?.quality?.missing_values ?? 0;
  const duplicateCount = preprocessResult?.raw_info?.duplicate_rows ?? edaData?.quality?.duplicate_rows ?? 0;

  const cleanRows = preprocessResult?.clean_info?.total_rows || (edaData as any)?.clean_info?.total_rows || rawRows;
  const cleanCols = preprocessResult?.clean_info?.numeric_columns?.length || selectedFeatures.length || 3;

  const rawRecords = preprocessResult?.raw_sample || edaData?.sample_records || [];
  const cleanRecords = preprocessResult?.clean_sample || edaData?.sample_records || [];

  // Default step flowchart nodes
  const pipelineFlow = preprocessResult?.pipeline_flow || [
    {
      stage_id: "ingestion",
      title: "Raw Data Ingestion",
      status: "completed",
      summary: `Loaded dataset containing ${rawRows} rows and ${rawCols} attributes.`,
      details: { total_records: rawRows, total_columns: rawCols }
    },
    {
      stage_id: "duplicates",
      title: "Duplicate Purging",
      status: dropDuplicates ? "completed" : "skipped",
      summary: dropDuplicates ? `Purged ${duplicateCount} duplicate records.` : "Duplicate purging disabled.",
      details: { duplicates_purged: dropDuplicates ? duplicateCount : 0 }
    },
    {
      stage_id: "missing_values",
      title: "Missing Imputation",
      status: "completed",
      summary: `Imputed null entries using ${missingStrategy.toUpperCase()} strategy.`,
      details: { nulls_handled: totalMissing, strategy: missingStrategy }
    },
    {
      stage_id: "feature_selection",
      title: "Feature Selection",
      status: "completed",
      summary: `Activated ${selectedFeatures.length} / ${availableFeatures.length} numeric features.`,
      details: { active_features: selectedFeatures }
    },
    {
      stage_id: "scaling",
      title: "Feature Scaling",
      status: scalingStrategy !== "none" ? "completed" : "skipped",
      summary: scalingStrategy !== "none" ? `Applied ${scalingStrategy.toUpperCase()} normalization matrix.` : "No scaling applied.",
      details: { scale_type: scalingStrategy }
    },
    {
      stage_id: "output",
      title: "ML Output Matrix",
      status: "completed",
      summary: `Transformed into (${cleanRows} x ${cleanCols}) clustering input matrix.`,
      details: { final_rows: cleanRows, final_features: cleanCols }
    }
  ];

  const getNodeIcon = (id: string) => {
    switch (id) {
      case "ingestion":
        return <Database className="w-4 h-4 text-cyan-400" />;
      case "duplicates":
        return <Scissors className="w-4 h-4 text-rose-400" />;
      case "missing_values":
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case "feature_selection":
        return <Filter className="w-4 h-4 text-emerald-400" />;
      case "scaling":
        return <Scale className="w-4 h-4 text-purple-400" />;
      case "output":
        return <Cpu className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-cyan-400" />;
    }
  };

  const activeNodeData = pipelineFlow.find((node) => node.stage_id === activeNodeId) || pipelineFlow[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#131B2E] via-[#0F172A] to-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Data Preprocessing & Flowchart Studio</h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl pl-1">
            Configure imputation, deduplication, feature filtering, and feature scaling. Visualize step-by-step transformations in the interactive flowchart pipeline.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3 z-10">
          <button
            onClick={resetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-all"
            title="Reset to default pipeline parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying || isLoading}
            className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-xl shadow-cyan-500/25 transition-all duration-300 transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isApplying ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : applySuccess ? (
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
            ) : (
              <Sparkles className="w-4 h-4 text-slate-950" />
            )}
            <span className="tracking-wide">
              {isApplying ? "RUNNING PIPELINE..." : applySuccess ? "PIPELINE EXECUTED!" : "APPLY PREPROCESSING PIPELINE"}
            </span>
          </button>
        </div>
      </div>

      {applyError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{applyError}</span>
        </div>
      )}

      {/* VISUAL FLOWCHART PIPELINE DIAGRAM */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6 relative">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Interactive Transformation Flowchart</h2>
              <p className="text-[11px] text-slate-400">Click any pipeline node to inspect transformation details</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
            6 Pipeline Stages
          </span>
        </div>

        {/* Flowchart Node Ribbon */}
        <div className="relative pt-2 pb-4">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-emerald-500/40 -translate-y-4 z-0 rounded-full" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
            {pipelineFlow.map((node, index) => {
              const isSelected = activeNodeId === node.stage_id;
              const isSkipped = node.status === "skipped";

              return (
                <div
                  key={node.stage_id}
                  onClick={() => setActiveNodeId(node.stage_id)}
                  className={`group relative flex flex-col items-center p-3.5 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
                    isSelected
                      ? "bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10 -translate-y-1"
                      : isSkipped
                      ? "bg-[#0D1424]/60 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700"
                      : "bg-[#0D1424] border-slate-800 hover:border-slate-700 hover:-translate-y-0.5"
                  }`}
                >
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-slate-400">
                      STAGE {index + 1}
                    </span>
                    {isSkipped ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold uppercase">
                        Skipped
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>

                  {/* Icon Circle */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                        : "bg-slate-900 text-slate-400 border border-slate-800 group-hover:text-white"
                    }`}
                  >
                    {getNodeIcon(node.stage_id)}
                  </div>

                  {/* Title & Summary */}
                  <span className="text-xs font-bold text-white text-center line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {node.title}
                  </span>
                  <span className="text-[10px] text-slate-400 text-center line-clamp-2 mt-1">
                    {node.summary}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        <div className="bg-[#0D1424] border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              {getNodeIcon(activeNodeData.stage_id)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{activeNodeData.title} Inspector</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-mono">
                  {activeNodeData.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{activeNodeData.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
            {Object.entries(activeNodeData.details || {}).map(([key, val]) => (
              <div key={key} className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase">{key.replace(/_/g, " ")}:</span>
                <span className="font-semibold text-cyan-300">
                  {Array.isArray(val) ? val.join(", ") : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PREPROCESSING CONTROL HUB */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Pipeline Configuration Controls</h2>
              <p className="text-[11px] text-slate-400">Customize parameters for data refinement and scaling</p>
            </div>
          </div>
          <button
            onClick={selectAllFeatures}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Select All Features
          </button>
        </div>

        {/* 4 Control Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Panel 1: Feature Selection */}
          <div className="bg-[#0D1424] border border-slate-800/80 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> 1. FEATURE SELECTION
                </span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {selectedFeatures.length} Active
                </span>
              </div>
              <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                {availableFeatures.map((feat: string) => {
                  const isChecked = selectedFeatures.includes(feat);
                  return (
                    <label
                      key={feat}
                      onClick={() => toggleFeature(feat)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-cyan-950/40 border-cyan-500/40 text-white font-medium"
                          : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="truncate">{feat}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
              Select numeric columns for distance calculations.
            </p>
          </div>

          {/* Panel 2: Missing Value Strategy */}
          <div className="bg-[#0D1424] border border-slate-800/80 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" /> 2. MISSING VALUES
                </span>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                  {totalMissing} Nulls
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMissingStrategy("median")}
                  className={`w-full px-3 py-2.5 rounded-lg font-medium border text-left transition-all flex items-center justify-between ${
                    missingStrategy === "median"
                      ? "bg-amber-950/50 border-amber-500/50 text-amber-300 font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">Median Imputation</div>
                    <div className="text-[10px] text-slate-400">Robust to skew & outliers</div>
                  </div>
                  {missingStrategy === "median" && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setMissingStrategy("mean")}
                  className={`w-full px-3 py-2.5 rounded-lg font-medium border text-left transition-all flex items-center justify-between ${
                    missingStrategy === "mean"
                      ? "bg-amber-950/50 border-amber-500/50 text-amber-300 font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">Mean Imputation</div>
                    <div className="text-[10px] text-slate-400">Standard average value fill</div>
                  </div>
                  {missingStrategy === "mean" && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setMissingStrategy("remove")}
                  className={`w-full px-3 py-2.5 rounded-lg font-medium border text-left transition-all flex items-center justify-between ${
                    missingStrategy === "remove"
                      ? "bg-amber-950/50 border-amber-500/50 text-amber-300 font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">Drop Missing Rows</div>
                    <div className="text-[10px] text-slate-400">Purge rows with nulls</div>
                  </div>
                  {missingStrategy === "remove" && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
              Imputes null values before feature scaling.
            </p>
          </div>

          {/* Panel 3: Duplicate Removal */}
          <div className="bg-[#0D1424] border border-slate-800/80 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" /> 3. DUPLICATE PURGING
                </span>
                <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/40">
                  {duplicateCount} Duplicates
                </span>
              </div>
              <label
                onClick={() => setDropDuplicates(!dropDuplicates)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                  dropDuplicates
                    ? "bg-rose-950/40 border-rose-500/40 text-white font-medium"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={dropDuplicates}
                  onChange={() => {}}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-white">Drop Duplicate Rows</div>
                  <div className="text-[10px] text-slate-400">Removes exact matching records</div>
                </div>
              </label>
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
              Prevents duplicate rows from skewing cluster centroids.
            </p>
          </div>

          {/* Panel 4: Feature Scaling */}
          <div className="bg-[#0D1424] border border-slate-800/80 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" /> 4. FEATURE SCALING
                </span>
                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40 uppercase">
                  {scalingStrategy}
                </span>
              </div>
              <select
                value={scalingStrategy}
                onChange={(e) => setScalingStrategy(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="standard">StandardScaler (Z-Score: Mean=0, Std=1)</option>
                <option value="minmax">MinMaxScaler (Normalized Range [0, 1])</option>
                <option value="none">No Scaling (Raw original values)</option>
              </select>
              <p className="text-[11px] text-slate-400 pt-2">
                {scalingStrategy === "standard"
                  ? "Recommended for K-Means and Hierarchical. Centers features around 0 with unit variance."
                  : scalingStrategy === "minmax"
                  ? "Scales features to fixed range [0, 1]. Preserves zero values."
                  : "Preserves raw units ($ income, age years). Features with large magnitudes will dominate distance metrics."}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
              Normalizes attributes for Euclidean/Manhattan distance calculation.
            </p>
          </div>
        </div>
      </div>

      {/* KPI METRICS COMPARISON CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Dataset Retention
            </span>
            <span className="text-xl font-extrabold text-cyan-400">
              {cleanRows} / {rawRows} Rows
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              ({Math.round((cleanRows / Math.max(rawRows, 1)) * 100)}% retained)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Missing Values Status
            </span>
            <span className="text-xl font-extrabold text-emerald-400">
              {totalMissing === 0 ? "0 Nulls (Clean)" : `${totalMissing} Imputed`}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Strategy: {missingStrategy.toUpperCase()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Duplicates Purged
            </span>
            <span className="text-xl font-extrabold text-rose-400">
              {duplicateCount} Duplicates
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {dropDuplicates ? "Purging Active" : "Deduplication Off"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Scissors className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Clustering Input Features
            </span>
            <span className="text-xl font-extrabold text-purple-400">
              {selectedFeatures.length} Features
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 uppercase">
              Scale: {scalingStrategy}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Scale className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DATASET INSPECTION TABLE */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <Table className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Dataset Inspection Studio</h2>
              <p className="text-[11px] text-slate-400">Compare raw input vs preprocessed and scaled customer features</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0D1424] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("cleaned")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "cleaned"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ✨ Preprocessed Dataset
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "raw"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📋 Raw Dataset ({rawRows} rows)
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 max-h-96">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-[#0D1424] text-slate-400 uppercase font-semibold text-[10px] tracking-wider sticky top-0 border-b border-slate-800/80 z-10">
              <tr>
                <th className="px-4 py-3">INDEX</th>
                <th className="px-4 py-3">CUSTOMER ID</th>
                {(activeTab === "cleaned" ? selectedFeatures : availableFeatures).map((col: string) => (
                  <th key={col} className="px-4 py-3">
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(() => {
                const currentRecords = activeTab === "cleaned" ? cleanRecords : rawRecords;
                if (!Array.isArray(currentRecords) || currentRecords.length === 0) {
                  return (
                    <tr>
                      <td colSpan={availableFeatures.length + 2} className="text-center py-8 text-slate-500">
                        No customer records loaded. Click "Apply Preprocessing Pipeline" to generate processed dataset.
                      </td>
                    </tr>
                  );
                }

                return currentRecords.slice(0, 30).map((row, idx) => {
                  const displayCols = activeTab === "cleaned" ? selectedFeatures : availableFeatures;
                  const custId = row["CustomerID"] || row["customer_id"] || row["CustomerID ($k)"] || `CUST-${1001 + idx}`;

                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-mono text-cyan-400 font-semibold">{String(custId)}</td>
                      {displayCols.map((col: string) => {
                        // Find key matching col or fuzzy col name
                        const colKey = Object.keys(row).find(
                          (k) => k.toLowerCase() === col.toLowerCase() || k.toLowerCase().includes(col.toLowerCase())
                        ) || col;
                        const val = row[colKey];
                        const formattedVal =
                          typeof val === "number"
                            ? Number.isInteger(val)
                              ? val
                              : val.toFixed(3)
                            : val ?? "N/A";

                        return (
                          <td key={col} className="px-4 py-2.5 font-mono">
                            {formattedVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
