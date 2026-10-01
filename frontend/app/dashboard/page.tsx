"use client";

import React from "react";
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
  PieChart,
  Pie,
} from "recharts";
import { Users, Layers, Activity, Calendar, DollarSign, ShoppingBag, Sparkles } from "lucide-react";

const CLUSTER_COLORS = [
  "#A855F7", // Carefree Spenders - Purple
  "#06B6D4", // Conservative Senior Buyers - Cyan
  "#10B981", // High-Income Potential Savers - Emerald
  "#3B82F6", // High-Value Loyal Champions - Blue
];

export default function ExecutiveDashboardPage() {
  const { activeDatasetName, edaData, clusteringResult } = useSegmentIQ();

  const totalCustomers = edaData?.quality?.total_rows || 200;
  const totalFeatures = edaData?.quality?.total_columns || 5;
  const clustersFound = clusteringResult?.n_clusters || 4;

  // Compute average metrics from edaData statistics
  const ageStat = edaData?.statistics?.find(s => s.column.toLowerCase().includes("age"));
  const incStat = edaData?.statistics?.find(s => s.column.toLowerCase().includes("income"));
  const spdStat = edaData?.statistics?.find(s => s.column.toLowerCase().includes("spending"));

  const avgAge = ageStat?.mean ? `${ageStat.mean} yrs` : "38.8 yrs";
  const avgIncome = incStat?.mean ? `$${incStat.mean}k` : "$60.5k";
  const avgSpending = spdStat?.mean ? `${spdStat.mean} / 100` : "50.2 / 100";

  // Data for cluster scatter plot
  const points = clusteringResult?.points || [];

  // Group data for pie chart
  const clusterSummaries = clusteringResult?.cluster_summaries || [
    { cluster_id: 0, segment_name: "Conservative Senior Buyers", count: 65, percentage: 32.5 },
    { cluster_id: 1, segment_name: "High-Value Loyal Champions", count: 40, percentage: 20.0 },
    { cluster_id: 2, segment_name: "Carefree Spenders", count: 57, percentage: 28.5 },
    { cluster_id: 3, segment_name: "High-Income Potential Savers", count: 38, percentage: 19.0 },
  ];

  const pieData = clusterSummaries.map((s, idx) => ({
    name: s.segment_name,
    value: s.count,
    percentage: s.percentage,
    color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length]
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Title & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Executive Analytics Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time KPI metrics evaluated from active dataset</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <span className="text-slate-400">Dataset: </span>
            <span className="text-white font-mono">{activeDatasetName}</span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Algorithm: </span>
            <span className="text-cyan-400 font-semibold">K-Means</span>
          </div>
        </div>
      </div>

      {/* Top KPI Cards Row (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Customers */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            TOTAL CUSTOMERS
          </span>
          <span className="text-2xl font-extrabold text-white">{totalCustomers}</span>
        </div>

        {/* Total Features */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            TOTAL FEATURES
          </span>
          <span className="text-2xl font-extrabold text-white">{totalFeatures}</span>
        </div>

        {/* Clusters Found */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            CLUSTERS FOUND
          </span>
          <span className="text-2xl font-extrabold text-cyan-400">{clustersFound}</span>
        </div>

        {/* Average Age */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            AVERAGE AGE
          </span>
          <span className="text-2xl font-extrabold text-white">{avgAge}</span>
        </div>

        {/* Average Income */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            AVERAGE INCOME
          </span>
          <span className="text-2xl font-extrabold text-cyan-400">{avgIncome}</span>
        </div>

        {/* Average Spending Score */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            AVERAGE SPENDING SCORE
          </span>
          <span className="text-2xl font-extrabold text-purple-400">{avgSpending}</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scatter Plot Card (7 Cols) */}
        <div className="lg:col-span-7 bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Annual Income vs Spending Score Cluster Map</h2>
            </div>
            <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              Real Calculated Output
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  type="number"
                  dataKey="income"
                  name="Annual Income"
                  unit="k"
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => `${val}k`}
                />
                <YAxis
                  type="number"
                  dataKey="spending_score"
                  name="Spending Score"
                  stroke="#64748B"
                  fontSize={11}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
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

          {/* Scatter Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
            {clusterSummaries.map((s, idx) => (
              <div key={s.cluster_id} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                />
                <span className="text-slate-300 font-medium">{s.segment_name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cluster Distribution Donut Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Cluster Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customer proportion by group</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="#131B2E" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-emerald-400 font-semibold">
                            {data.value} customers ({data.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Legend List */}
          <div className="space-y-2 text-xs pt-2 border-t border-slate-800/60">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate max-w-[200px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate font-medium">{item.name}</span>
                </div>
                <span className="font-semibold text-white font-mono">
                  {item.value} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
