"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowUpDown,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  listClusteringRuns,
  getRunCustomers,
  getExportCSVUrl,
} from "@/lib/api";
import {
  ClusteringRunItem,
  CustomerExplorerResponse,
} from "@/types";

export default function CustomerExplorerPage() {
  const [runs, setRuns] = useState<ClusteringRunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [clusterFilter, setClusterFilter] = useState<number | null>(null);
  const [search, setSearch] = useState<string>("");

  const [explorerData, setExplorerData] = useState<CustomerExplorerResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load runs
  useEffect(() => {
    listClusteringRuns(undefined, 1, 20).then((res) => {
      setRuns(res.runs);
      if (res.runs.length > 0 && !selectedRunId) {
        setSelectedRunId(res.runs[0].id);
      }
    });
  }, []);

  // Fetch customers
  const fetchCustomers = () => {
    if (!selectedRunId) return;
    setIsLoading(true);
    getRunCustomers(selectedRunId, page, pageSize, clusterFilter !== null ? clusterFilter : undefined, search || undefined)
      .then(setExplorerData)
      .catch((err) => console.error("Error fetching customers:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [selectedRunId, page, clusterFilter, search]);

  const totalPages = explorerData ? Math.ceil(explorerData.total_customers / pageSize) : 1;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Customer Explorer</span>
              <Badge variant="indigo">Individual Profiles</Badge>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse, filter, and inspect assigned customer segments with server-side pagination and CSV export.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedRunId && (
              <a
                href={getExportCSVUrl(selectedRunId)}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dataset with Clusters</span>
              </a>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Run Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 shrink-0">Active Run:</span>
              <select
                value={selectedRunId}
                onChange={(e) => {
                  setSelectedRunId(e.target.value);
                  setPage(1);
                  setClusterFilter(null);
                }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-56"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.dataset_name} ({r.algorithm.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Cluster Segment Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 shrink-0">Filter Segment:</span>
              <select
                value={clusterFilter === null ? "" : String(clusterFilter)}
                onChange={(e) => {
                  setClusterFilter(e.target.value === "" ? null : parseInt(e.target.value));
                  setPage(1);
                }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-44"
              >
                <option value="">All Segments</option>
                <option value="0">Cluster 0</option>
                <option value="1">Cluster 1</option>
                <option value="2">Cluster 2</option>
                <option value="3">Cluster 3</option>
                <option value="4">Cluster 4</option>
                <option value="-1">Noise / Outliers</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search attributes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Customer Records Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Customer Segment Assignments</CardTitle>
                <CardDescription>
                  Showing {explorerData ? explorerData.total_customers.toLocaleString() : 0} customer records
                </CardDescription>
              </div>
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !explorerData || explorerData.customers.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-500">
                No customer records match the selected filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Customer ID / Row</th>
                      <th className="py-2.5 px-3">Assigned Segment</th>
                      <th className="py-2.5 px-3">Cluster Label</th>
                      {explorerData.feature_names.map((feat) => (
                        <th key={feat} className="py-2.5 px-3 whitespace-nowrap">
                          {feat}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {explorerData.customers.map((cust) => (
                      <tr key={cust.row_id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-white">
                          {cust.row_id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          {cust.segment_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={cust.cluster >= 0 ? "indigo" : "warning"}>
                            {cust.cluster >= 0 ? `Cluster ${cust.cluster}` : "Noise"}
                          </Badge>
                        </td>
                        {explorerData.feature_names.map((feat) => (
                          <td key={feat} className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            {cust.attributes[feat] !== undefined ? String(cust.attributes[feat]) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-500">
                  Showing {Math.min((page - 1) * pageSize + 1, explorerData?.total_customers || 0)} -{" "}
                  {Math.min(page * pageSize, explorerData?.total_customers || 0)} of{" "}
                  {explorerData?.total_customers.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
