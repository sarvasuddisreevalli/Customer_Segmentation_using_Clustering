"use client";

import React, { useState } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { Search, Filter, User, DollarSign, ShoppingBag, ArrowUpDown } from "lucide-react";

export default function CustomerExplorerPage() {
  const { clusteringResult } = useSegmentIQ();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>("all");

  const points = clusteringResult?.points || [
    { customer_id: "CUST-1001", age: 25, income: 45, spending_score: 60, purchase_frequency: 12, cluster_id: 0, segment_name: "Conservative Senior Buyers" },
    { customer_id: "CUST-1002", age: 34, income: 70, spending_score: 85, purchase_frequency: 24, cluster_id: 1, segment_name: "High-Value Loyal Champions" },
    { customer_id: "CUST-1003", age: 52, income: 30, spending_score: 20, purchase_frequency: 5, cluster_id: 2, segment_name: "Carefree Spenders" },
    { customer_id: "CUST-1004", age: 29, income: 88, spending_score: 92, purchase_frequency: 30, cluster_id: 3, segment_name: "High-Income Potential Savers" },
  ];

  const uniqueClusters = Array.from(new Set(points.map((p) => p.cluster_id)));

  const filteredPoints = points.filter((p) => {
    const matchesSearch =
      p.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.segment_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCluster =
      selectedClusterFilter === "all" || String(p.cluster_id) === selectedClusterFilter;
    return matchesSearch && matchesCluster;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Customer Explorer</h1>
        <p className="text-xs text-slate-400 mt-1">
          Search, filter, and inspect individual customer records & cluster assignments
        </p>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Customer ID or Segment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0D1424] border border-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500 w-64"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Cluster:</span>
              <select
                value={selectedClusterFilter}
                onChange={(e) => setSelectedClusterFilter(e.target.value)}
                className="bg-[#0D1424] border border-slate-800 text-xs text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Clusters ({points.length})</option>
                {uniqueClusters.map((cid) => (
                  <option key={cid} value={String(cid)}>
                    Cluster {cid}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-white">{filteredPoints.length}</strong> of {points.length} customers
          </span>
        </div>

        {/* Customer Records Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1424] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="px-4 py-3">CUSTOMER ID</th>
                <th className="px-4 py-3">AGE</th>
                <th className="px-4 py-3">INCOME ($K)</th>
                <th className="px-4 py-3">SPENDING SCORE</th>
                <th className="px-4 py-3">PURCHASE FREQ</th>
                <th className="px-4 py-3">CLUSTER</th>
                <th className="px-4 py-3">ASSIGNED SEGMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredPoints.length > 0 ? (
                filteredPoints.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-cyan-400">
                      {row.customer_id}
                    </td>
                    <td className="px-4 py-2.5">{row.age} yrs</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-400">${row.income}k</td>
                    <td className="px-4 py-2.5 font-mono text-purple-400">
                      {row.spending_score} / 100
                    </td>
                    <td className="px-4 py-2.5">{row.purchase_frequency} orders/yr</td>
                    <td className="px-4 py-2.5 font-mono font-semibold">
                      Cluster {row.cluster_id}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                        {row.segment_name}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No customers match the active search and cluster filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
