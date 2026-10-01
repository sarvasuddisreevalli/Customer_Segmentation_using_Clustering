"use client";

import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ClusterPoint } from "@/types";
import { getClusterColor } from "@/lib/utils";

interface PcaProps {
  points: ClusterPoint[];
}

export const PcaScatterPlot: React.FC<PcaProps> = ({ points }) => {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="w-full h-[360px] sm:h-[400px] bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              type="number"
              dataKey="pca_x"
              name="PCA Component 1"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              type="number"
              dataKey="pca_y"
              name="PCA Component 2"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ClusterPoint;
                  return (
                    <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs space-y-1 z-50">
                      <div className="font-semibold text-indigo-400 flex items-center justify-between gap-3">
                        <span>{data.customer_id}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] text-white"
                          style={{ backgroundColor: getClusterColor(data.cluster_id) }}
                        >
                          {data.segment_name}
                        </span>
                      </div>
                      <div className="text-slate-300">PCA Component 1: <strong className="text-white">{data.pca_x}</strong></div>
                      <div className="text-slate-300">PCA Component 2: <strong className="text-white">{data.pca_y}</strong></div>
                      <div className="text-slate-300">Income: <strong className="text-white">${data.income}k</strong></div>
                      <div className="text-slate-300">Spending Score: <strong className="text-white">{data.spending_score}/100</strong></div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={points}>
              {points.map((entry, index) => (
                <Cell key={`cell-pca-${index}`} fill={getClusterColor(entry.cluster_id)} opacity={0.85} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-slate-400">
        * Principal Component Analysis (PCA) standardizes and projects multi-dimensional customer features into 2 principal components for 2D spatial visualization.
      </p>
    </div>
  );
};
