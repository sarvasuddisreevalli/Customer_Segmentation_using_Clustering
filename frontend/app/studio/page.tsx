"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sliders,
  CheckCircle2,
  Database,
  Layers,
  Settings,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Activity,
  Award,
  Download,
  AlertCircle,
  HelpCircle,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  listDatasets,
  getDatasetPreview,
  createClusteringRun,
  getExportCSVUrl,
} from "@/lib/api";
import { DatasetItem, DatasetPreviewResponse, ClusteringRunDetail } from "@/types";

function SegmentationStudioContent() {
  const searchParams = useSearchParams();
  const preselectedDatasetId = searchParams.get("dataset_id");

  // Step Tracking: 1 = Dataset, 2 = Features, 3 = Preprocessing, 4 = Algorithm & Params, 5 = Run/Results
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(preselectedDatasetId || "");
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [missingStrategy, setMissingStrategy] = useState<string>("median");
  const [scaleType, setScaleType] = useState<string>("standard");
  const [dropDuplicates, setDropDuplicates] = useState<boolean>(true);

  const [algorithm, setAlgorithm] = useState<"kmeans" | "hierarchical" | "dbscan">("kmeans");
  const [nClusters, setNClusters] = useState<number>(4);
  const [linkage, setLinkage] = useState<string>("ward");
  const [eps, setEps] = useState<number>(0.5);
  const [minSamples, setMinSamples] = useState<number>(5);

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<ClusteringRunDetail | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Load datasets on mount
  useEffect(() => {
    listDatasets(1, 20).then((res) => {
      setDatasets(res.datasets);
      if (!selectedDatasetId && res.datasets.length > 0) {
        setSelectedDatasetId(res.datasets[0].id);
      }
    });
  }, []);

  // When selectedDatasetId changes, load preview & default numeric features
  useEffect(() => {
    if (selectedDatasetId) {
      getDatasetPreview(selectedDatasetId).then((p) => {
        setPreview(p);
        // Exclude ID columns from default selection
        const numeric = p.column_types?.numeric || [];
        const nonId = numeric.filter((col) => !col.toLowerCase().includes("id"));
        setSelectedFeatures(nonId.length >= 2 ? nonId : numeric);
      });
    }
  }, [selectedDatasetId]);

  const handleToggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      if (selectedFeatures.length <= 2) return; // Keep at least 2 features
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const handleExecute = async () => {
    setExecutionError(null);
    setIsExecuting(true);
    try {
      const result = await createClusteringRun({
        dataset_id: selectedDatasetId,
        algorithm,
        selected_features: selectedFeatures,
        missing_strategy: missingStrategy,
        drop_duplicates: dropDuplicates,
        scale_type: scaleType,
        n_clusters: nClusters,
        linkage,
        eps,
        min_samples: minSamples,
      });
      setRunResult(result);
      setCurrentStep(5);
    } catch (err: any) {
      setExecutionError(err.message || "Clustering execution failed.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Segmentation Studio</span>
              <Badge variant="indigo">Experimentation Engine</Badge>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Configure data preprocessing, select clustering algorithms, tune parameters, and discover customer segments.
            </p>
          </div>

          {currentStep === 5 && runResult && (
            <div className="flex items-center gap-3">
              <a
                href={getExportCSVUrl(runResult.id)}
                download
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Results CSV</span>
              </a>
              <Link href={`/analytics?run_id=${runResult.id}`}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Open in Analytics
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 overflow-x-auto text-xs">
          {[
            { step: 1, label: "1. Dataset" },
            { step: 2, label: "2. Features" },
            { step: 3, label: "3. Preprocessing" },
            { step: 4, label: "4. Algorithm" },
            { step: 5, label: "5. Results" },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => {
                if (item.step < currentStep || (item.step === 5 && runResult)) {
                  setCurrentStep(item.step);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                currentStep === item.step
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                  : currentStep > item.step
                  ? "text-slate-300 hover:text-white"
                  : "text-slate-600 cursor-not-allowed"
              }`}
            >
              {currentStep > item.step && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {executionError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{executionError}</span>
          </div>
        )}

        {/* STEP 1: Select Dataset */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Choose Dataset</CardTitle>
              <CardDescription>
                Select the customer dataset you want to segment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {datasets.map((ds) => (
                  <div
                    key={ds.id}
                    onClick={() => setSelectedDatasetId(ds.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedDatasetId === ds.id
                        ? "bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm"
                        : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-400" />
                        <span>{ds.original_filename}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {ds.row_count.toLocaleString()} rows • {ds.column_count} columns
                      </div>
                    </div>
                    {selectedDatasetId === ds.id && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <Button
                  variant="primary"
                  disabled={!selectedDatasetId}
                  onClick={() => setCurrentStep(2)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Features
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Select Features */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Select Clustering Features</CardTitle>
              <CardDescription>
                Choose numeric features for clustering. Non-informative ID columns are excluded.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Feature Selection Note: Unsupervised clustering calculates Euclidean or Manhattan distance in multi-dimensional space. Unique identifiers (e.g., CustomerID) distort distance calculations and must not be used for clustering.
                </span>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Available Numeric Features (Select at least 2):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(preview?.column_types?.numeric || []).map((col) => {
                    const isSelected = selectedFeatures.includes(col);
                    return (
                      <div
                        key={col}
                        onClick={() => handleToggleFeature(col)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                            : "bg-slate-900/30 border-slate-800 hover:bg-slate-900/60 text-slate-400"
                        }`}
                      >
                        <span className="text-xs font-medium">{col}</span>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "border-slate-700 bg-slate-950"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={selectedFeatures.length < 2}
                  onClick={() => setCurrentStep(3)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Preprocessing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Configure Preprocessing */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Configure Preprocessing</CardTitle>
              <CardDescription>
                Define missing value imputation, duplicate removal, and numerical scaling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Missing Value Strategy:
                  </label>
                  <select
                    value={missingStrategy}
                    onChange={(e) => setMissingStrategy(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="median">Median Imputation (Robust to outliers)</option>
                    <option value="mean">Mean Imputation (Standard)</option>
                    <option value="most_frequent">Mode Imputation (Most frequent)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Feature Scaling Method:
                  </label>
                  <select
                    value={scaleType}
                    onChange={(e) => setScaleType(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="standard">StandardScaler (Zero mean, unit variance)</option>
                    <option value="minmax">MinMaxScaler (Normalized between 0 and 1)</option>
                    <option value="robust">RobustScaler (Median and IQR scaling)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Remove Duplicate Customer Rows
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Drop identical duplicate records to prevent cluster bias
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={dropDuplicates}
                  onChange={(e) => setDropDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button variant="primary" onClick={() => setCurrentStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue to Algorithm
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Choose Algorithm & Tune Parameters */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Algorithm & Parameter Tuning</CardTitle>
              <CardDescription>
                Select clustering algorithm and configure hyperparameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Algorithm Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: "kmeans",
                    name: "K-Means",
                    desc: "Fast centroid-based clustering. Best for spherical clusters.",
                  },
                  {
                    id: "hierarchical",
                    name: "Hierarchical (Agglomerative)",
                    desc: "Builds a nested cluster hierarchy. Excellent for structured customer tiers.",
                  },
                  {
                    id: "dbscan",
                    name: "DBSCAN",
                    desc: "Density-based spatial clustering. Isolates noise and arbitrary shapes.",
                  },
                ].map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setAlgorithm(a.id as any)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      algorithm === a.id
                        ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                        : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 text-slate-300"
                    }`}
                  >
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span>{a.name}</span>
                      {algorithm === a.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>

              {/* Dynamic Parameter Settings */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
                  Parameter Configuration
                </span>

                {algorithm === "kmeans" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Number of Clusters (k):</span>
                      <span className="font-bold text-indigo-400">{nClusters}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      value={nClusters}
                      onChange={(e) => setNClusters(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                )}

                {algorithm === "hierarchical" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Clusters (k):</span>
                        <span className="font-bold text-indigo-400">{nClusters}</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={10}
                        value={nClusters}
                        onChange={(e) => setNClusters(parseInt(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block">Linkage Metric:</label>
                      <select
                        value={linkage}
                        onChange={(e) => setLinkage(e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="ward">Ward (Minimizes variance)</option>
                        <option value="complete">Complete (Maximum distance)</option>
                        <option value="average">Average (Mean distance)</option>
                      </select>
                    </div>
                  </div>
                )}

                {algorithm === "dbscan" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Epsilon Radius (eps):</span>
                        <span className="font-bold text-indigo-400">{eps}</span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        value={eps}
                        onChange={(e) => setEps(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Min Samples (min_samples):</span>
                        <span className="font-bold text-indigo-400">{minSamples}</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={20}
                        value={minSamples}
                        onChange={(e) => setMinSamples(parseInt(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  isLoading={isExecuting}
                  onClick={handleExecute}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Run Segmentation Model
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Results & Discovered Segments */}
        {currentStep === 5 && runResult && (
          <div className="space-y-6">
            {/* Run Overview Banner */}
            <Card className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Execution Completed</Badge>
                      <Badge variant="indigo" className="uppercase text-[10px]">
                        {runResult.algorithm}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-2">
                      Discovered {runResult.n_clusters_found} Customer Segments
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Computed in {runResult.processing_duration_seconds}s across {runResult.selected_features.length} features.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Silhouette Score</span>
                      <span className="font-bold text-white text-base">
                        {runResult.evaluation?.silhouette_score !== null && runResult.evaluation?.silhouette_score !== undefined
                          ? runResult.evaluation.silhouette_score.toFixed(3)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">Davies-Bouldin</span>
                      <span className="font-bold text-white text-base">
                        {runResult.evaluation?.davies_bouldin_index !== null && runResult.evaluation?.davies_bouldin_index !== undefined
                          ? runResult.evaluation.davies_bouldin_index.toFixed(3)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Segment Profile Cards */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white">Discovered Customer Personas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(runResult.profiles || []).map((prof) => (
                  <Card key={prof.cluster_label} className="border-slate-800/80">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{prof.segment_name}</CardTitle>
                          <span className="text-xs text-slate-400">
                            Cluster {prof.cluster_label} • {prof.customer_count.toLocaleString()} customers ({prof.segment_percentage}%)
                          </span>
                        </div>
                        <Badge variant="indigo">{prof.segment_percentage}%</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed">{prof.description}</p>
                      
                      {prof.distinguishing_characteristics && prof.distinguishing_characteristics.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-slate-500">
                            Distinguishing Traits:
                          </span>
                          <ul className="text-xs text-slate-400 space-y-0.5 list-disc list-inside">
                            {prof.distinguishing_characteristics.slice(0, 3).map((trait, tIdx) => (
                              <li key={tIdx} className="truncate">{trait}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {prof.marketing_strategy && (
                        <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300">
                          <span className="font-semibold block text-[10px] text-indigo-400 uppercase">
                            Recommended Strategy: {prof.marketing_strategy}
                          </span>
                          <span className="text-slate-300 text-[11px] mt-0.5 block">
                            {prof.marketing_campaign}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep(4)}>
                Run Another Configuration
              </Button>
              <Link href={`/analytics?run_id=${runResult.id}`}>
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Full Visualizations in Analytics
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SegmentationStudioPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Segmentation Studio...</div>}>
      <SegmentationStudioContent />
    </React.Suspense>
  );
}
