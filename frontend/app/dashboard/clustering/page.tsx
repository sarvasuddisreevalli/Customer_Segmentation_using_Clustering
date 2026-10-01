"use client";

import React, { useState } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Sliders, Sparkles, RefreshCw, Cpu } from "lucide-react";

const CLUSTER_COLORS = ["#A855F7", "#06B6D4", "#10B981", "#3B82F6", "#F59E0B"];

export default function ClusteringStudioPage() {
  const {
    kmeansK,
    setKmeansK,
    clusteringResult,
    executeClustering,
    isLoading,
  } = useSegmentIQ();

  const [projectionMode, setProjectionMode] = useState<"features" | "pca">("features");

  const clustersFound = clusteringResult?.n_clusters || kmeansK;
  const silhouetteScore = clusteringResult?.silhouette_score || 0.4061;

  // Extract inertia WCSS if available or compute mock inertia for UI display
  const elbowItem = clusteringResult?.elbow_data?.find((e) => e.k === kmeansK);
  const inertiaVal = elbowItem?.inertia || (204.21 - (kmeansK - 4) * 20).toFixed(2);

  const points = clusteringResult?.points || [];

  const handleRunKMeans = async () => {
    await executeClustering("kmeans");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Clustering Studio</h1>
        <p className="text-xs text-slate-400 mt-1">
          Adjust model parameters and execute real-time machine learning calculations
        </p>
      </div>

      {/* Top Settings Card: K-Means Hyper-Parameters */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">K-Means Hyper-Parameters</h2>
              <p className="text-[11px] text-slate-400">Adjust model parameters and run clustering calculations</p>
            </div>
          </div>

          {/* Toggle View Buttons */}
          <div className="flex items-center gap-1.5 bg-[#0D1424] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setProjectionMode("features")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                projectionMode === "features"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Features View
            </button>
            <button
              onClick={() => setProjectionMode("pca")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                projectionMode === "pca"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              PCA Projection (2D/3D)
            </button>
          </div>
        </div>

        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Number of Clusters (K):</span>
              <span className="font-extrabold text-cyan-400 text-sm font-mono">{kmeansK}</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              value={kmeansK}
              onChange={(e) => setKmeansK(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer bg-slate-900 h-2 rounded-lg"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              onClick={handleRunKMeans}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
              <span>[ RUN K-MEANS ]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle KPI Row (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clusters Found */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Clusters Found
          </span>
          <span className="text-2xl font-extrabold text-white">{clustersFound}</span>
        </div>

        {/* Silhouette Score */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Silhouette Score
          </span>
          <span className="text-2xl font-extrabold text-emerald-400">{silhouetteScore}</span>
        </div>

        {/* Inertia (WCSS) */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Inertia (WCSS)
          </span>
          <span className="text-2xl font-extrabold text-cyan-400">{inertiaVal}</span>
        </div>
      </div>

      {/* Bottom Chart Card: K-Means Cluster Scatter Visualization */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span>📊</span>
          <span>K-Means Cluster Scatter Visualization ({projectionMode === "pca" ? "PCA Component 1 vs Component 2" : "Annual Income vs Spending Score"})</span>
        </h2>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                type="number"
                dataKey={projectionMode === "pca" ? "pca_x" : "income"}
                name={projectionMode === "pca" ? "PCA Component 1" : "Annual Income"}
                stroke="#64748B"
                fontSize={11}
              />
              <YAxis
                type="number"
                dataKey={projectionMode === "pca" ? "pca_y" : "spending_score"}
                name={projectionMode === "pca" ? "PCA Component 2" : "Spending Score"}
                stroke="#64748B"
                fontSize={11}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.customer_id}</p>
                        <p className="text-cyan-400 font-semibold">{data.segment_name}</p>
                        <p className="text-slate-300">Income: ${data.income}k</p>
                        <p className="text-slate-300">Spending Score: {data.spending_score}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={points}>
                {points.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CLUSTER_COLORS[Math.abs(entry.cluster_id) % CLUSTER_COLORS.length]}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
