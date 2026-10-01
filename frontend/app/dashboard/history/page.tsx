"use client";

import React from "react";
import { History, Clock, CheckCircle2, Sliders, Database, Sparkles } from "lucide-react";

export default function AnalysisHistoryPage() {
  const historyLogs = [
    {
      id: "RUN-9041",
      timestamp: "Today at 17:40",
      dataset: "Mall_Customers.csv",
      algorithm: "K-Means",
      k: 4,
      silhouette: 0.4061,
      status: "COMPLETED",
      features: "Age, Annual Income, Spending Score"
    },
    {
      id: "RUN-9040",
      timestamp: "Today at 17:35",
      dataset: "Mall_Customers.csv",
      algorithm: "Hierarchical",
      k: 4,
      silhouette: 0.3982,
      status: "COMPLETED",
      features: "Age, Annual Income, Spending Score"
    },
    {
      id: "RUN-9039",
      timestamp: "Today at 17:28",
      dataset: "Mall_Customers.csv",
      algorithm: "DBSCAN",
      k: 3,
      silhouette: 0.2850,
      status: "COMPLETED",
      features: "Annual Income, Spending Score"
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Analysis History</h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical log of previous model training sessions & clustering parameter runs
        </p>
      </div>

      {/* History Log Card */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Analytics Session History Logs</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total Logged Sessions: <strong className="text-white">{historyLogs.length}</strong>
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1424] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="px-4 py-3">RUN ID</th>
                <th className="px-4 py-3">TIMESTAMP</th>
                <th className="px-4 py-3">DATASET</th>
                <th className="px-4 py-3">ALGORITHM</th>
                <th className="px-4 py-3">PARAMETERS</th>
                <th className="px-4 py-3">SILHOUETTE SCORE</th>
                <th className="px-4 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {historyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-cyan-400">{log.id}</td>
                  <td className="px-4 py-3 text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">{log.dataset}</td>
                  <td className="px-4 py-3 font-bold text-white">{log.algorithm}</td>
                  <td className="px-4 py-3 text-slate-400">
                    K = {log.k} | Features: {log.features}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-mono font-bold">
                    {log.silhouette}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
