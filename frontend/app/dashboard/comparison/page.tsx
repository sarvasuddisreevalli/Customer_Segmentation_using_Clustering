"use client";

import React from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { GitCompare, Trophy, CheckCircle, BarChart3, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

export default function ModelEvaluationPage() {
  const { modelComparison, executeComparison, isLoading } = useSegmentIQ();

  const comparisonTable = modelComparison?.comparison_table || [
    {
      algorithm: "K-Means",
      clusters: 4,
      silhouette_score: 0.4061,
      davies_bouldin_score: 0.9061,
      calinski_harabasz_score: 350.06,
      is_recommended: true,
      explanation: "K-Means achieved high cluster separation and distinct boundary coherence."
    },
    {
      algorithm: "Hierarchical Clustering",
      clusters: 4,
      silhouette_score: 0.3982,
      davies_bouldin_score: 0.9412,
      calinski_harabasz_score: 320.15,
      is_recommended: false,
      explanation: "Hierarchical clustering grouped customer hierarchies effectively with Ward linkage."
    },
    {
      algorithm: "DBSCAN",
      clusters: 3,
      silhouette_score: 0.2850,
      davies_bouldin_score: 1.2500,
      calinski_harabasz_score: 180.40,
      is_recommended: false,
      explanation: "DBSCAN formed 3 dense clusters and isolated noise outliers."
    }
  ];

  const recommendedModel = modelComparison?.recommended_model || "K-Means";
  const summaryExplanation = modelComparison?.summary_explanation || "K-Means is the recommended model for your dataset based on max Silhouette score and optimal cluster cohesion.";

  const chartData = comparisonTable.map(m => ({
    name: m.algorithm,
    silhouette: m.silhouette_score,
    isRecommended: m.is_recommended
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Model Evaluation</h1>
        <p className="text-xs text-slate-400 mt-1">
          Benchmarking & side-by-side performance evaluation of clustering algorithms
        </p>
      </div>

      {/* Winner Recommendation Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              RECOMMENDED MODEL WINNER
            </span>
            <h2 className="text-xl font-extrabold text-white mt-0.5">{recommendedModel}</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">{summaryExplanation}</p>
          </div>
        </div>
        <button
          onClick={executeComparison}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {isLoading ? "Re-Evaluating..." : "Re-Run Model Benchmarking"}
        </button>
      </div>

      {/* Comparison Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Comparison Table Card (7 Cols) */}
        <div className="lg:col-span-7 bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <span>Algorithm Performance Matrix</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1424] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="px-4 py-3">Algorithm</th>
                  <th className="px-4 py-3">Clusters</th>
                  <th className="px-4 py-3">Silhouette</th>
                  <th className="px-4 py-3">Davies-Bouldin</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {comparisonTable.map((row, idx) => (
                  <tr key={idx} className={row.is_recommended ? "bg-emerald-950/20 font-semibold" : ""}>
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      {row.is_recommended && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{row.algorithm}</span>
                    </td>
                    <td className="px-4 py-3">{row.clusters}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono font-bold">
                      {row.silhouette_score}
                    </td>
                    <td className="px-4 py-3 font-mono">{row.davies_bouldin_score}</td>
                    <td className="px-4 py-3">
                      {row.is_recommended ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          BEST CHOICE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-900 border border-slate-800">
                          Evaluated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Silhouette Comparison Bar Chart Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>Silhouette Score Comparison</span>
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 0.6]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-emerald-400 font-semibold">Silhouette: {data.silhouette}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="silhouette" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isRecommended ? "#10B981" : "#3B82F6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
