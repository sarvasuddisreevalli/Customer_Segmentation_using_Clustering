"use client";

import React from "react";
import { CorrelationData } from "@/types";

interface HeatmapProps {
  correlations: CorrelationData[];
  features: string[];
}

export const CorrelationHeatmap: React.FC<HeatmapProps> = ({ correlations, features }) => {
  const getCorr = (f1: string, f2: string): number => {
    if (f1 === f2) return 1.0;
    const match = correlations.find(
      (c) => (c.feature1 === f1 && c.feature2 === f2) || (c.feature1 === f2 && c.feature2 === f1)
    );
    return match ? match.correlation : 0.0;
  };

  const getColor = (val: number): string => {
    if (val === 1.0) return "bg-indigo-600/90 text-white font-bold";
    if (val > 0.5) return "bg-indigo-500/60 text-indigo-100 font-semibold";
    if (val > 0.2) return "bg-indigo-500/30 text-indigo-200";
    if (val < -0.5) return "bg-rose-500/60 text-rose-100 font-semibold";
    if (val < -0.2) return "bg-rose-500/30 text-rose-200";
    return "bg-slate-900/60 text-slate-400";
  };

  return (
    <div className="w-full overflow-x-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
      <h4 className="text-sm font-semibold text-white mb-3">Feature Correlation Matrix</h4>
      <table className="w-full text-xs text-center border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-slate-400 font-mono">Feature</th>
            {features.map((f) => (
              <th key={f} className="p-2 text-slate-300 font-mono max-w-[100px] truncate" title={f}>
                {f.replace(/\([^)]*\)/g, "")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((f1) => (
            <tr key={f1} className="border-t border-slate-900">
              <td className="p-2 text-left font-medium text-slate-300 font-mono max-w-[120px] truncate" title={f1}>
                {f1.replace(/\([^)]*\)/g, "")}
              </td>
              {features.map((f2) => {
                const val = getCorr(f1, f2);
                return (
                  <td key={f2} className="p-1">
                    <div
                      className={`p-2 rounded-lg ${getColor(
                        val
                      )} transition-colors text-center text-[11px] font-mono`}
                      title={`${f1} vs ${f2}: ${val}`}
                    >
                      {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
