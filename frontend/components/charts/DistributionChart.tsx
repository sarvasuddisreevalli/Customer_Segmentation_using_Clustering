"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DistributionData } from "@/types";

interface DistProps {
  title: string;
  data: DistributionData[];
  color?: string;
}

export const DistributionChart: React.FC<DistProps> = ({ title, data, color = "#6366f1" }) => {
  return (
    <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 w-full">
      <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">{title}</h4>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <XAxis
              dataKey="bin_label"
              stroke="#64748b"
              fontSize={10}
              angle={-25}
              textAnchor="end"
              interval={0}
            />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.5rem", fontSize: "12px" }}
            />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={color} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
