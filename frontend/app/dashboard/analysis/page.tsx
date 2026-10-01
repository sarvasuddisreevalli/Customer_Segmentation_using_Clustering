"use client";

import React, { useState } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { BarChart3, Search, Table, ArrowRight, ScatterChart as ScatterIcon } from "lucide-react";
import { DistributionChart } from "@/components/charts/DistributionChart";
import { CorrelationHeatmap } from "@/components/charts/CorrelationHeatmap";
import Link from "next/link";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AnalysisPage() {
  const { edaData, clusteringResult } = useSegmentIQ();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPair, setSelectedPair] = useState<string>("income_vs_spending");

  if (!edaData) {
    return <div className="text-center text-slate-400 py-12">Loading EDA analysis...</div>;
  }

  const { quality, statistics, distributions, correlations, sample_records } = edaData;
  const points = clusteringResult?.points || [];

  const filteredRecords = sample_records.filter((rec) =>
    Object.values(rec).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getPairConfig = () => {
    switch (selectedPair) {
      case "age_vs_spending":
        return { xKey: "age", yKey: "spending_score", xName: "Age (Years)", yName: "Spending Score (1-100)", color: "#10b981" };
      case "freq_vs_spending":
        return { xKey: "purchase_frequency", yKey: "spending_score", xName: "Purchase Frequency (/yr)", yName: "Spending Score (1-100)", color: "#06b6d4" };
      case "age_vs_income":
        return { xKey: "age", yKey: "income", xName: "Age (Years)", yName: "Annual Income ($k)", color: "#f59e0b" };
      case "income_vs_spending":
      default:
        return { xKey: "income", yKey: "spending_score", xName: "Annual Income ($k)", yName: "Spending Score (1-100)", color: "#6366f1" };
    }
  };

  const pairConfig = getPairConfig();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Exploratory Data Analysis
            <BarChart3 className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Statistical summaries, feature distributions, pairwise scatter relationships, and correlation patterns.
          </p>
        </div>
        <Link
          href="/dashboard/clustering"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all w-fit"
        >
          Proceed to Clustering Laboratory
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Feature Summary Statistics Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Table className="w-4 h-4 text-indigo-400" />
          Feature Statistical Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-3">Feature Name</th>
                <th className="p-3">Mean</th>
                <th className="p-3">Median</th>
                <th className="p-3">Min</th>
                <th className="p-3">Max</th>
                <th className="p-3">Std Dev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {statistics.map((stat) => (
                <tr key={stat.column} className="hover:bg-slate-900/40">
                  <td className="p-3 font-semibold text-white">{stat.column}</td>
                  <td className="p-3 text-indigo-300">{stat.mean}</td>
                  <td className="p-3 text-slate-300">{stat.median}</td>
                  <td className="p-3 text-slate-400">{stat.min}</td>
                  <td className="p-3 text-slate-400">{stat.max}</td>
                  <td className="p-3 text-slate-400">{stat.std}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pairwise Exploratory Scatter Card */}
      {points.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ScatterIcon className="w-4 h-4 text-cyan-400" />
                Pairwise Feature Relationship Scatter Plot
              </h3>
              <p className="text-xs text-slate-400">Select feature pairs to analyze raw behavioral distribution before clustering.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "income_vs_spending", label: "Income vs Spending" },
                { id: "age_vs_spending", label: "Age vs Spending" },
                { id: "freq_vs_spending", label: "Frequency vs Spending" },
                { id: "age_vs_income", label: "Age vs Income" },
              ].map((pair) => (
                <button
                  key={pair.id}
                  onClick={() => setSelectedPair(pair.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPair === pair.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  {pair.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[320px] w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  dataKey={pairConfig.xKey}
                  name={pairConfig.xName}
                  stroke="#64748b"
                  fontSize={12}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  type="number"
                  dataKey={pairConfig.yKey}
                  name={pairConfig.yName}
                  stroke="#64748b"
                  fontSize={12}
                  axisLine={{ stroke: "#334155" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs space-y-1">
                          <div className="font-bold text-white">{data.customer_id}</div>
                          <div className="text-slate-300">{pairConfig.xName}: <strong className="text-white">{data[pairConfig.xKey]}</strong></div>
                          <div className="text-slate-300">{pairConfig.yName}: <strong className="text-white">{data[pairConfig.yKey]}</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={points} fill={pairConfig.color} opacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Feature Distributions Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Feature Binned Distributions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(distributions).map(([featureName, distData], idx) => {
            const colors = ["#6366f1", "#10b981", "#06b6d4", "#f59e0b", "#ec4899"];
            return (
              <DistributionChart
                key={featureName}
                title={featureName}
                data={distData}
                color={colors[idx % colors.length]}
              />
            );
          })}
        </div>
      </div>

      {/* Correlation Matrix */}
      {correlations.length > 0 && (
        <CorrelationHeatmap
          correlations={correlations}
          features={quality.numeric_columns}
        />
      )}

      {/* Raw Data Preview Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-white">Dataset Records Sample Preview</h3>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search sample records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 font-mono">
              <tr>
                {sample_records.length > 0 &&
                  Object.keys(sample_records[0]).map((key) => (
                    <th key={key} className="p-3 whitespace-nowrap">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRecords.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-900/40">
                  {Object.values(rec).map((val, j) => (
                    <td key={j} className="p-3 whitespace-nowrap text-slate-300">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
