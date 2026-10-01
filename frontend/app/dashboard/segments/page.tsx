"use client";

import React, { useState } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { Users, Filter, Sparkles, LineChart, ArrowRight } from "lucide-react";
import { IncomeVsSpendingScatter } from "@/components/charts/IncomeVsSpendingScatter";
import { PcaScatterPlot } from "@/components/charts/PcaScatterPlot";
import { getClusterColor } from "@/lib/utils";
import Link from "next/link";

export default function SegmentsPage() {
  const { clusteringResult, insights } = useSegmentIQ();
  const [activeTab, setActiveTab] = useState<"cards" | "scatter" | "pca">("cards");

  if (!clusteringResult) {
    return <div className="text-center text-slate-400 py-12">Generating customer segments...</div>;
  }

  const { points, cluster_summaries } = clusteringResult;
  const profiles = insights?.all_profiles || [];

  const clusterNamesMap: Record<number, string> = {};
  cluster_summaries.forEach((s) => {
    clusterNamesMap[s.cluster_id] = s.segment_name;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Discovered Customer Segments
            <Users className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Statistically derived customer personas, spatial distributions, and PCA component projections.
          </p>
        </div>
        <Link
          href="/dashboard/insights"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all w-fit"
        >
          View Executive Marketing Strategy
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Workspace View Switcher Tabs */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex gap-2 w-fit">
        <button
          onClick={() => setActiveTab("cards")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "cards"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Segment Persona Cards ({cluster_summaries.length})
        </button>
        <button
          onClick={() => setActiveTab("scatter")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "scatter"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Income vs Spending Map
        </button>
        <button
          onClick={() => setActiveTab("pca")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "pca"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          2D PCA Spatial Map
        </button>
      </div>

      {/* TAB 1: Persona Cards */}
      {activeTab === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cluster_summaries.map((summary) => {
            const profile = profiles.find((p) => p.cluster_id === summary.cluster_id);
            const color = getClusterColor(summary.cluster_id);

            return (
              <div
                key={summary.cluster_id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden transition-all hover:border-slate-700"
              >
                {/* Cluster accent color top strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: color }}
                />

                <div className="flex items-start justify-between gap-4 pt-1">
                  <div>
                    <span
                      className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: color }}
                    >
                      Cluster {summary.cluster_id >= 0 ? summary.cluster_id : "Noise"}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-2">{summary.segment_name}</h3>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{summary.count}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{summary.percentage}% of total</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {profile?.description || "Cluster derived from normalized customer behavioral features."}
                </p>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Avg Income</div>
                    <div className="font-bold text-white mt-0.5">${summary.avg_income}k</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Avg Spending</div>
                    <div className="font-bold text-white mt-0.5">{summary.avg_spending}/100</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Avg Frequency</div>
                    <div className="font-bold text-white mt-0.5">{summary.avg_frequency} /yr</div>
                  </div>
                </div>

                {/* Key Characteristics */}
                {profile?.key_characteristics && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Key Traits:</span>
                    <ul className="space-y-1">
                      {profile.key_characteristics.map((trait, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          {trait}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Income vs Spending Scatter */}
      {activeTab === "scatter" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Annual Income vs Spending Score</h3>
              <p className="text-xs text-slate-400">Hover over any customer data point to inspect individual attributes.</p>
            </div>
          </div>
          <IncomeVsSpendingScatter points={points} clusterNames={clusterNamesMap} />
        </div>
      )}

      {/* TAB 3: PCA 2D Map */}
      {activeTab === "pca" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">PCA 2D Spatial Segmentation Map</h3>
              <p className="text-xs text-slate-400">Multi-dimensional customer features projected onto 2 Principal Components.</p>
            </div>
          </div>
          <PcaScatterPlot points={points} />
        </div>
      )}
    </div>
  );
}
