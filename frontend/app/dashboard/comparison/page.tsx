"use client";

import React from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { GitCompare, Award, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Link from "next/link";

export default function ComparisonPage() {
  const { modelComparison, executeComparison, isLoading } = useSegmentIQ();

  if (!modelComparison) {
    return <div className="text-center text-slate-400 py-12">Comparing models...</div>;
  }

  const { comparison_table, recommended_model, summary_explanation } = modelComparison;

  const chartData = comparison_table.map((item) => ({
    name: item.algorithm,
    Silhouette: item.silhouette_score,
    "Davies-Bouldin (lower=better)": item.davies_bouldin_score,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Algorithmic Model Comparison
            <GitCompare className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evaluate K-Means, Agglomerative Hierarchical, and DBSCAN performance metrics side-by-side.
          </p>
        </div>

        <button
          onClick={executeComparison}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? "animate-spin" : ""}`} />
          Re-evaluate Models
        </button>
      </div>

      {/* Recommended Model Highlight Card */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-indigo-500/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Optimal Recommended Model: {recommended_model}
          </div>
          <h3 className="text-lg font-bold text-white">Why this model was selected</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {summary_explanation}
          </p>
        </div>

        <Link
          href="/dashboard/segments"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          Explore Customer Segments
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Side-by-Side Visual Comparison Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Silhouette Score & Cohesion Comparison</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Silhouette" fill="#6366f1" radius={[4, 4, 0, 0]} name="Silhouette Score (higher=better)" />
              <Bar dataKey="Davies-Bouldin (lower=better)" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Davies-Bouldin Index (lower=better)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Detailed Algorithmic Metrics Table</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-3">Algorithm</th>
                <th className="p-3">Clusters</th>
                <th className="p-3">Silhouette Score</th>
                <th className="p-3">Davies-Bouldin</th>
                <th className="p-3">Calinski-Harabasz</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {comparison_table.map((row) => (
                <tr
                  key={row.algorithm}
                  className={`hover:bg-slate-900/40 ${
                    row.is_recommended ? "bg-indigo-500/10 font-semibold" : ""
                  }`}
                >
                  <td className="p-3 font-semibold text-white flex items-center gap-2">
                    {row.algorithm}
                    {row.is_recommended && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Recommended
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-300">{row.clusters}</td>
                  <td className="p-3 text-indigo-300 font-bold">{row.silhouette_score}</td>
                  <td className="p-3 text-cyan-300">{row.davies_bouldin_score}</td>
                  <td className="p-3 text-amber-300">{row.calinski_harabasz_score}</td>
                  <td className="p-3">
                    {row.is_recommended ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Winner
                      </span>
                    ) : (
                      <span className="text-slate-500">Evaluated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
