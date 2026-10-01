"use client";

import React from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import {
  Users,
  PieChart as PieIcon,
  TrendingUp,
  Award,
  DollarSign,
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { IncomeVsSpendingScatter } from "@/components/charts/IncomeVsSpendingScatter";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { getClusterColor, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function OverviewPage() {
  const { edaData, clusteringResult, modelComparison, insights } = useSegmentIQ();

  const totalCustomers = edaData?.quality.total_rows || 0;
  const segmentsFound = clusteringResult?.n_clusters || 0;
  const bestAlgorithm = modelComparison?.recommended_model || "K-Means";
  const silhouetteScore = clusteringResult?.silhouette_score || 0;

  const avgIncome = edaData?.statistics.find(s => s.column.toLowerCase().includes("income"))?.mean || 0;
  const avgSpending = edaData?.statistics.find(s => s.column.toLowerCase().includes("spending"))?.mean || 0;

  const clusterSummaries = clusteringResult?.cluster_summaries || [];
  const points = clusteringResult?.points || [];

  const clusterNamesMap: Record<number, string> = {};
  clusterSummaries.forEach(s => {
    clusterNamesMap[s.cluster_id] = s.segment_name;
  });

  const pieData = clusterSummaries.map(s => ({
    name: s.segment_name,
    value: s.count,
    percentage: s.percentage,
    clusterId: s.cluster_id
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Executive Analytics Overview
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time customer segmentation metrics and automated cluster performance intelligence.
          </p>
        </div>
        <Link
          href="/dashboard/insights"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all w-fit"
        >
          View Full Recommendations
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Customers */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-indigo-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-white">{totalCustomers}</div>
          <div className="text-[10px] text-slate-500">Processed in dataset</div>
        </div>

        {/* Card 2: Segments Found */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Segments Found</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><PieIcon className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-emerald-400">{segmentsFound}</div>
          <div className="text-[10px] text-slate-500">Distinct personas</div>
        </div>

        {/* Card 3: Best Algorithm */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-cyan-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Best Algorithm</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Award className="w-4 h-4" /></div>
          </div>
          <div className="text-lg font-bold text-cyan-300 truncate" title={bestAlgorithm}>{bestAlgorithm}</div>
          <div className="text-[10px] text-slate-500">Recommended ML model</div>
        </div>

        {/* Card 4: Silhouette Score */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-purple-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Silhouette Score</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-purple-300">{silhouetteScore}</div>
          <div className="text-[10px] text-slate-500">Cohesion metric (0-1)</div>
        </div>

        {/* Card 5: Average Income */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-amber-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Income</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-amber-300">${avgIncome}k</div>
          <div className="text-[10px] text-slate-500">Annual population mean</div>
        </div>

        {/* Card 6: Average Spending */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-rose-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Spending</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400"><CreditCard className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-rose-300">{avgSpending}/100</div>
          <div className="text-[10px] text-slate-500">Average spending score</div>
        </div>
      </div>

      {/* Main Scatter & Segment Proportions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Scatter Overview Chart */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Customer Segment Map</h3>
              <p className="text-xs text-slate-400">Income vs Spending Score distribution colored by assigned segment.</p>
            </div>
          </div>
          <IncomeVsSpendingScatter points={points} clusterNames={clusterNamesMap} />
        </div>

        {/* Donut Chart Proportions */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Segment Proportions</h3>
            <p className="text-xs text-slate-400">Share of total customer base per segment.</p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={getClusterColor(entry.clusterId)} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                          <div className="font-bold text-white">{data.name}</div>
                          <div className="text-slate-300">Customers: <strong className="text-white">{data.value}</strong></div>
                          <div className="text-slate-300">Share: <strong className="text-white">{data.percentage}%</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link
              href="/dashboard/segments"
              className="text-xs text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Explore All Segment Profiles →
            </Link>
          </div>
        </div>
      </div>

      {/* Auto-Generated Key Insights Box */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Automated Key Executive Insights</h3>
            <p className="text-xs text-slate-400">Generated directly from ML feature distribution statistics.</p>
          </div>
        </div>

        {insights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Primary Revenue Driver</div>
              <div className="text-sm font-bold text-white">{insights.highest_value_segment.segment_name}</div>
              <p className="text-xs text-slate-400">{insights.highest_value_segment.description}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Largest Market Share</div>
              <div className="text-sm font-bold text-white">{insights.largest_segment.segment_name}</div>
              <p className="text-xs text-slate-400">
                Represents {insights.largest_segment.percentage}% ({insights.largest_segment.customer_count} customers) of total audience.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Reactivation Priority</div>
              <div className="text-sm font-bold text-white">{insights.lowest_engagement_segment.segment_name}</div>
              <p className="text-xs text-slate-400">
                Strategy: {insights.lowest_engagement_segment.marketing_recommendation.strategy}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">Processing ML insights...</div>
        )}
      </div>
    </div>
  );
}
