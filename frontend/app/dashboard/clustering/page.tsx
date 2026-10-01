"use client";

import React, { useMemo } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { Sliders, Play, Info, Sparkles, Layers, ArrowRight, Award } from "lucide-react";
import { ElbowChart } from "@/components/charts/ElbowChart";
import { DendrogramChart } from "@/components/charts/DendrogramChart";
import Link from "next/link";

export default function ClusteringPage() {
  const {
    currentAlgorithm,
    setCurrentAlgorithm,
    kmeansK,
    setKmeansK,
    hierarchicalK,
    setHierarchicalK,
    hierarchicalLinkage,
    setHierarchicalLinkage,
    dbscanEps,
    setDbscanEps,
    dbscanMinSamples,
    setDbscanMinSamples,
    executeClustering,
    clusteringResult,
    isLoading,
  } = useSegmentIQ();

  // Find optimal K recommendation from Elbow / Silhouette data
  const optimalKInfo = useMemo(() => {
    if (!clusteringResult?.elbow_data || clusteringResult.elbow_data.length === 0) return null;
    const bestItem = [...clusteringResult.elbow_data].sort((a, b) => b.silhouette - a.silhouette)[0];
    return bestItem;
  }, [clusteringResult]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            ML Clustering Laboratory
            <Sliders className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure hyperparameters, analyze cluster metrics, and execute clustering algorithms in real time.
          </p>
        </div>
        <Link
          href="/dashboard/comparison"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all w-fit"
        >
          Compare All Models
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Algorithm Selector Tabs */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-2">
        {[
          { id: "kmeans", label: "K-Means Clustering", desc: "Centroid-based spherical grouping" },
          { id: "hierarchical", label: "Hierarchical Clustering", desc: "Agglomerative dendrogram tree" },
          { id: "dbscan", label: "DBSCAN Analysis", desc: "Density-based & noise detection" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentAlgorithm(tab.id as any)}
            className={`flex-1 min-w-[200px] p-4 rounded-xl text-left transition-all ${
              currentAlgorithm === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80"
            }`}
          >
            <div className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              {tab.label}
            </div>
            <div className={`text-xs mt-1 ${currentAlgorithm === tab.id ? "text-indigo-100" : "text-slate-400"}`}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Hyperparameter Control Box */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          Hyperparameter Configuration
        </h3>

        {/* K-Means Controls */}
        {currentAlgorithm === "kmeans" && (
          <div className="space-y-6">
            <div className="space-y-2 max-w-md">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Number of Clusters (K):</span>
                <span className="text-indigo-400 font-mono text-sm">{kmeansK}</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={kmeansK}
                onChange={(e) => setKmeansK(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>K=2</span>
                <span>K=5</span>
                <span>K=10</span>
              </div>
            </div>

            {/* Optimal K Recommendation Alert */}
            {optimalKInfo && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white">Recommended Optimal K: {optimalKInfo.k}</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Highest Silhouette Score ({optimalKInfo.silhouette}) across evaluated range K=2 to 10.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setKmeansK(optimalKInfo.k)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-500 transition-all shrink-0"
                >
                  Apply K={optimalKInfo.k}
                </button>
              </div>
            )}

            {/* Elbow Data Charts */}
            {clusteringResult?.elbow_data && (
              <div className="pt-4 border-t border-slate-800">
                <ElbowChart data={clusteringResult.elbow_data} />
              </div>
            )}
          </div>
        )}

        {/* Hierarchical Controls */}
        {currentAlgorithm === "hierarchical" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Number of Clusters (K):</span>
                  <span className="text-emerald-400 font-mono text-sm">{hierarchicalK}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={hierarchicalK}
                  onChange={(e) => setHierarchicalK(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Linkage Criterion:</label>
                <select
                  value={hierarchicalLinkage}
                  onChange={(e) => setHierarchicalLinkage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ward">Ward (Variance Minimization)</option>
                  <option value="complete">Complete Linkage (Max Distance)</option>
                  <option value="average">Average Linkage (Mean Distance)</option>
                  <option value="single">Single Linkage (Min Distance)</option>
                </select>
              </div>
            </div>

            {/* Dendrogram Visualization */}
            {clusteringResult?.dendrogram_data ? (
              <div className="pt-4 border-t border-slate-800">
                <DendrogramChart data={clusteringResult.dendrogram_data} />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Hierarchical Dendrogram Linkage Matrix:</strong>
                  <p className="text-slate-400 mt-1">
                    Agglomerative clustering creates bottom-up customer pair trees. Ward linkage optimizes total within-cluster variance.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DBSCAN Controls */}
        {currentAlgorithm === "dbscan" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Epsilon Radius (eps):</span>
                  <span className="text-cyan-400 font-mono text-sm">{dbscanEps}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={dbscanEps}
                  onChange={(e) => setDbscanEps(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Min Samples:</span>
                  <span className="text-cyan-400 font-mono text-sm">{dbscanMinSamples}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={dbscanMinSamples}
                  onChange={(e) => setDbscanMinSamples(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Explanation box */}
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Density-Based Spatial Clustering of Applications with Noise (DBSCAN):</strong>
                <p className="mt-1">
                  "DBSCAN identifies dense customer groups and can classify unusual customers as noise (Cluster -1)."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => executeClustering()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            {isLoading ? "Analyzing customer patterns..." : "Run Clustering Algorithm"}
          </button>
        </div>
      </div>

      {/* Live Metric Results Summary */}
      {clusteringResult && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Clustering Execution Results ({clusteringResult.algorithm.toUpperCase()})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Clusters Formed</div>
              <div className="text-xl font-bold text-white mt-1">{clusteringResult.n_clusters}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Silhouette Score</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{clusteringResult.silhouette_score}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Davies-Bouldin Index</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{clusteringResult.davies_bouldin_score}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Calinski-Harabasz</div>
              <div className="text-xl font-bold text-cyan-400 mt-1">{clusteringResult.calinski_harabasz_score}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Noise Outliers</div>
              <div className="text-xl font-bold text-rose-400 mt-1">{clusteringResult.noise_count}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
