"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ElbowMetric } from "@/types";

interface ElbowProps {
  data: ElbowMetric[];
}

export const ElbowChart: React.FC<ElbowProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Inertia / Elbow Curve */}
      <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <h4 className="text-sm font-semibold text-white">Elbow Method (Inertia vs K)</h4>
        <p className="text-xs text-slate-400">Look for the "elbow point" where inertia decrease levels off.</p>
        <div className="h-[260px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="k" stroke="#64748b" fontSize={12} label={{ value: 'Number of Clusters (K)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="inertia" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: "#6366f1" }} activeDot={{ r: 8 }} name="Inertia (Within-Cluster SS)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Silhouette Score Curve */}
      <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <h4 className="text-sm font-semibold text-white">Silhouette Score vs K</h4>
        <p className="text-xs text-slate-400">Higher values indicate well-separated, dense clusters (optimal K).</p>
        <div className="h-[260px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="k" stroke="#64748b" fontSize={12} label={{ value: 'Number of Clusters (K)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#64748b" fontSize={12} domain={[0, 1]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="silhouette" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: "#10b981" }} activeDot={{ r: 8 }} name="Silhouette Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
