"use client";

import React, { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ClusterPoint } from "@/types";
import { getClusterColor } from "@/lib/utils";
import { Filter, SlidersHorizontal } from "lucide-react";

interface ScatterProps {
  points: ClusterPoint[];
  clusterNames: Record<number, string>;
}

export const IncomeVsSpendingScatter: React.FC<ScatterProps> = ({ points, clusterNames }) => {
  const [selectedCluster, setSelectedCluster] = useState<number | "all">("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  
  // Dynamic ranges based on data points
  const minIncVal = useMemo(() => Math.floor(Math.min(...points.map((p) => p.income || 0), 0)), [points]);
  const maxIncVal = useMemo(() => Math.ceil(Math.max(...points.map((p) => p.income || 100), 100)), [points]);
  const minAgeVal = useMemo(() => Math.floor(Math.min(...points.map((p) => p.age || 18), 18)), [points]);
  const maxAgeVal = useMemo(() => Math.ceil(Math.max(...points.map((p) => p.age || 70), 70)), [points]);

  const [maxIncomeFilter, setMaxIncomeFilter] = useState<number>(maxIncVal);
  const [maxAgeFilter, setMaxAgeFilter] = useState<number>(maxAgeVal);

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (selectedCluster !== "all" && p.cluster_id !== selectedCluster) return false;
      if (selectedGender !== "all" && p.gender && p.gender.toLowerCase() !== selectedGender.toLowerCase()) return false;
      if (p.income > maxIncomeFilter) return false;
      if (p.age > maxAgeFilter) return false;
      return true;
    });
  }, [points, selectedCluster, selectedGender, maxIncomeFilter, maxAgeFilter]);

  const uniqueClusters = Array.from(new Set(points.map((p) => p.cluster_id))).sort((a, b) => a - b);
  const availableGenders = Array.from(new Set(points.map((p) => p.gender).filter((g): g is string => !!g && g !== "N/A")));

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Interactive Filter Control Panel */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-800 pb-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          Interactive Scatter Filters ({filteredPoints.length} / {points.length} Customers)
        </div>

        {/* Filter Rows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Gender Filter */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400">Gender Filter:</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedGender("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedGender === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                All
              </button>
              {availableGenders.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all capitalize ${
                    selectedGender.toLowerCase() === g.toLowerCase()
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Income Range Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-slate-400">Max Income Filter:</span>
              <span className="text-indigo-400 font-mono font-bold">${maxIncomeFilter}k</span>
            </div>
            <input
              type="range"
              min={minIncVal}
              max={maxIncVal}
              value={maxIncomeFilter}
              onChange={(e) => setMaxIncomeFilter(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Age Range Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-slate-400">Max Age Filter:</span>
              <span className="text-emerald-400 font-mono font-bold">{maxAgeFilter} yrs</span>
            </div>
            <input
              type="range"
              min={minAgeVal}
              max={maxAgeVal}
              value={maxAgeFilter}
              onChange={(e) => setMaxAgeFilter(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Segment Persona Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Segment Persona:</span>
          <button
            onClick={() => setSelectedCluster("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              selectedCluster === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            All Personas
          </button>
          {uniqueClusters.map((cId) => (
            <button
              key={cId}
              onClick={() => setSelectedCluster(cId)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                selectedCluster === cId
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getClusterColor(cId) }}
              />
              {clusterNames[cId] || `Cluster ${cId}`}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[360px] sm:h-[420px] bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              type="number"
              dataKey="income"
              name="Annual Income"
              unit="k"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              type="number"
              dataKey="spending_score"
              name="Spending Score"
              unit="/100"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <ZAxis type="number" dataKey="purchase_frequency" range={[60, 200]} name="Frequency" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ClusterPoint;
                  return (
                    <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs space-y-1 z-50">
                      <div className="font-semibold text-indigo-400 flex items-center justify-between gap-4">
                        <span>{data.customer_id}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] text-white"
                          style={{ backgroundColor: getClusterColor(data.cluster_id) }}
                        >
                          {data.segment_name}
                        </span>
                      </div>
                      <div className="text-slate-300">Gender: <strong className="text-white">{data.gender}</strong></div>
                      <div className="text-slate-300">Annual Income: <strong className="text-white">${data.income}k</strong></div>
                      <div className="text-slate-300">Spending Score: <strong className="text-white">{data.spending_score}/100</strong></div>
                      <div className="text-slate-300">Age: <strong className="text-white">{data.age} yrs</strong></div>
                      <div className="text-slate-300">Purchase Frequency: <strong className="text-white">{data.purchase_frequency} /yr</strong></div>
                      {data.recency !== undefined && (
                        <div className="text-slate-300">Recency: <strong className="text-white">{data.recency} days ago</strong></div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={filteredPoints}>
              {filteredPoints.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getClusterColor(entry.cluster_id)} opacity={0.85} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
