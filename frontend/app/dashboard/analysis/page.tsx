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
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Activity, BarChart3, Sliders, Eye } from "lucide-react";

export default function ExploratoryEDAPage() {
  const { edaData, clusteringResult } = useSegmentIQ();

  const [xAxisKey, setXAxisKey] = useState<string>("income");
  const [yAxisKey, setYAxisKey] = useState<string>("spending_score");

  const points = clusteringResult?.points || [];
  const distributions = edaData?.distributions || {};

  // Formatted data for Age Distribution
  const ageData = distributions["Age"] || [
    { bin_label: "18-26", count: 32 },
    { bin_label: "26-34", count: 48 },
    { bin_label: "34-42", count: 62 },
    { bin_label: "42-50", count: 35 },
    { bin_label: "50-58", count: 24 },
    { bin_label: "58-70", count: 18 },
  ];

  // Formatted data for Income Distribution
  const incomeData = distributions["Annual Income (k$)"] || [
    { bin_label: "15.0-30.2", count: 24 },
    { bin_label: "30.2-45.5", count: 42 },
    { bin_label: "45.5-60.8", count: 58 },
    { bin_label: "60.8-76.0", count: 39 },
    { bin_label: "76.0-91.2", count: 25 },
    { bin_label: "91.2-137.0", count: 12 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Exploratory EDA</h1>
        <p className="text-xs text-slate-400 mt-1">
          Interactive data exploration and statistical feature distributions
        </p>
      </div>

      {/* Top Card: Interactive Custom Variable Scatter Generator */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Interactive Custom Variable Scatter Generator</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-slate-400">X Axis:</span>
              <select
                value={xAxisKey}
                onChange={(e) => setXAxisKey(e.target.value)}
                className="bg-[#0D1424] border border-slate-800 text-xs text-white px-2.5 py-1 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="income">Annual Income</option>
                <option value="age">Age</option>
                <option value="purchase_frequency">Purchase Frequency</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-slate-400">Y Axis:</span>
              <select
                value={yAxisKey}
                onChange={(e) => setYAxisKey(e.target.value)}
                className="bg-[#0D1424] border border-slate-800 text-xs text-white px-2.5 py-1 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="spending_score">Spending Score</option>
                <option value="income">Annual Income</option>
                <option value="age">Age</option>
              </select>
            </div>

            <button className="px-3.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all">
              [ Generate Chart ]
            </button>
          </div>
        </div>

        {/* Scatter Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                type="number"
                dataKey={xAxisKey}
                name={xAxisKey}
                stroke="#64748B"
                fontSize={11}
              />
              <YAxis
                type="number"
                dataKey={yAxisKey}
                name={yAxisKey}
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
                        <p className="text-cyan-400">X: {data[xAxisKey]}</p>
                        <p className="text-purple-400">Y: {data[yAxisKey]}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={points} fill="#06B6D4" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Feature Distributions (Histograms) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Feature Distributions (Histograms)</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution Card */}
          <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Age Distribution</h3>
              <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                Binned Freq
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="bin_label" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs">
                            <p className="text-slate-300 font-bold">Bin: {data.bin_label}</p>
                            <p className="text-cyan-400 font-semibold">Count: {data.count}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Annual Income Distribution Card */}
          <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Annual Income Distribution</h3>
              <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                Binned Freq
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="bin_label" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs">
                            <p className="text-slate-300 font-bold">Bin: {data.bin_label}</p>
                            <p className="text-emerald-400 font-semibold">Count: {data.count}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                    {incomeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 1 ? "#E2E8F0" : "#8B5CF6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
