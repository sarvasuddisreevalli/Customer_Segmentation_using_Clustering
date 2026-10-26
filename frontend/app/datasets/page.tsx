"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Database,
  Trash2,
  Eye,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  ArrowRight,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  listDatasets,
  uploadDatasetCSV,
  loadDemoDataset,
  getDatasetPreview,
  deleteDataset,
} from "@/lib/api";
import { DatasetItem, DatasetPreviewResponse } from "@/types";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDatasetList = async () => {
    setIsLoading(true);
    try {
      const res = await listDatasets(1, 20, search || undefined);
      setDatasets(res.datasets);
      if (res.datasets.length > 0 && !selectedDatasetId) {
        handleSelectDataset(res.datasets[0].id);
      }
    } catch (err) {
      console.error("Error loading datasets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetList();
  }, [search]);

  const handleSelectDataset = async (id: string) => {
    setSelectedDatasetId(id);
    setIsPreviewLoading(true);
    try {
      const p = await getDatasetPreview(id);
      setPreview(p);
    } catch (err) {
      console.error("Error loading preview:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadError("Only CSV files (.csv) are supported.");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const created = await uploadDatasetCSV(file);
      await loadDatasetList();
      handleSelectDataset(created.id);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload dataset.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDemo = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const demo = await loadDemoDataset();
      await loadDatasetList();
      handleSelectDataset(demo.id);
    } catch (err: any) {
      setUploadError(err.message || "Failed to load demo dataset.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDataset(deleteConfirmId);
      setDeleteConfirmId(null);
      if (selectedDatasetId === deleteConfirmId) {
        setSelectedDatasetId(null);
        setPreview(null);
      }
      await loadDatasetList();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Dataset Management</span>
              <Badge variant="indigo">Safe Storage</Badge>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Upload customer data, validate numeric columns, preview sample distributions, and configure feature inputs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadDemo}
              isLoading={isUploading}
            >
              Load Mall Customers Demo
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UploadCloud className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-900/20 hover:bg-slate-900/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">
            Drag and drop customer CSV file here, or click to browse
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Accepts comma-delimited CSV up to 25MB. Headers and numeric columns automatically detected.
          </p>
        </div>

        {/* Main Grid: Dataset List (Left) & Preview / Summary (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dataset List */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Uploaded Datasets</CardTitle>
                <span className="text-xs text-slate-500">{datasets.length} files</span>
              </div>
              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search datasets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : datasets.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No datasets uploaded yet.</p>
              ) : (
                datasets.map((ds) => {
                  const isSelected = selectedDatasetId === ds.id;
                  return (
                    <div
                      key={ds.id}
                      onClick={() => handleSelectDataset(ds.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-600/10 border-indigo-500/40 text-white"
                          : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 text-slate-300"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-xs truncate flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{ds.original_filename}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>{ds.row_count.toLocaleString()} rows</span>
                          <span>•</span>
                          <span>{ds.column_count} cols</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(ds.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors shrink-0"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Dataset Preview & Quality Inspector */}
          <div className="lg:col-span-2 space-y-6">
            {isPreviewLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : !preview ? (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <Database className="w-10 h-10 text-slate-600 mb-3" />
                <h4 className="text-sm font-semibold text-white">Select a Dataset</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Choose an uploaded dataset on the left to inspect sample records and statistics.
                </p>
              </Card>
            ) : (
              <>
                {/* Summary Metadata Card */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span>{preview.filename}</span>
                          <Badge variant="success">Validated</Badge>
                        </CardTitle>
                        <CardDescription>
                          {preview.total_rows.toLocaleString()} rows • {preview.total_columns} columns
                        </CardDescription>
                      </div>

                      <Link href={`/studio?dataset_id=${preview.dataset_id}`}>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                          Proceed to Studio
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Numeric Features</span>
                        <span className="font-semibold text-white mt-0.5 block">
                          {preview.column_types?.numeric?.length || 0} columns
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Categorical</span>
                        <span className="font-semibold text-white mt-0.5 block">
                          {preview.column_types?.categorical?.length || 0} columns
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Missing Values</span>
                        <span className="font-semibold text-white mt-0.5 block">
                          {Object.values(preview.missing_counts || {}).reduce((a, b) => a + b, 0)} cells
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Status</span>
                        <span className="font-semibold text-emerald-400 mt-0.5 block">
                          Ready for ML
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sample Records Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sample Records (First 10 Rows)</CardTitle>
                    <CardDescription>Direct dataset preview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                          <tr>
                            {preview.columns.map((c) => (
                              <th key={c} className="py-2.5 px-3 whitespace-nowrap">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {preview.head.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              {preview.columns.map((c) => (
                                <td key={c} className="py-2.5 px-3 whitespace-nowrap">
                                  {row[c] !== null && row[c] !== undefined ? String(row[c]) : "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Numeric Feature Summary Table */}
                {preview.numeric_stats && preview.numeric_stats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Numeric Features Summary</CardTitle>
                      <CardDescription>Calculated statistical metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-3">Column</th>
                              <th className="py-2.5 px-3">Mean</th>
                              <th className="py-2.5 px-3">Median</th>
                              <th className="py-2.5 px-3">Std Dev</th>
                              <th className="py-2.5 px-3">Min</th>
                              <th className="py-2.5 px-3">Max</th>
                              <th className="py-2.5 px-3">Outliers</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {preview.numeric_stats.map((stat) => (
                              <tr key={stat.column} className="hover:bg-slate-900/40">
                                <td className="py-2.5 px-3 font-medium text-white">{stat.column}</td>
                                <td className="py-2.5 px-3">{stat.mean.toFixed(2)}</td>
                                <td className="py-2.5 px-3">{stat.median.toFixed(2)}</td>
                                <td className="py-2.5 px-3">{stat.std.toFixed(2)}</td>
                                <td className="py-2.5 px-3">{stat.min}</td>
                                <td className="py-2.5 px-3">{stat.max}</td>
                                <td className="py-2.5 px-3">
                                  {stat.n_outliers > 0 ? (
                                    <span className="text-amber-400">
                                      {stat.n_outliers} ({stat.pct_outliers}%)
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">0</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteConfirmId !== null}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Dataset"
          description="Are you sure you want to delete this dataset? All associated clustering runs, segment profiles, and exported CSVs will also be permanently removed."
        >
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
