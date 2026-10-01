"use client";

import React, { useState } from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { Upload, FileText, Search, CheckCircle, Database } from "lucide-react";

export default function DatasetManagerPage() {
  const { activeDatasetName, edaData, uploadFile, isLoading } = useSegmentIQ();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await uploadFile(selectedFile);
    }
  };

  const sampleRecords = edaData?.sample_records || [];
  const totalRows = edaData?.quality?.total_rows || 200;
  const totalCols = edaData?.quality?.total_columns || 5;
  const missingVal = edaData?.quality?.missing_values || 0;
  const duplicatesVal = edaData?.quality?.duplicate_rows || 0;

  // Filter records by search term
  const filteredRecords = sampleRecords.filter((rec) =>
    Object.values(rec).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dataset Manager</h1>
        <p className="text-xs text-slate-400 mt-1">Upload and preview custom customer datasets</p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Upload className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">CSV Dataset Upload</h2>
        </div>

        {/* Drag & Drop Area */}
        <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-[#0D1424]/60 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-xs font-semibold text-slate-200">
            {selectedFile ? selectedFile.name : "Drag & Drop CSV file or click to choose dataset"}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Supported Columns: Age, Annual Income, Spending Score, Purchase Frequency, Gender
          </p>

          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20">
              Choose File
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
            <span className="text-xs text-slate-400">
              {selectedFile ? selectedFile.name : "No file chosen"}
            </span>
          </div>
        </div>

        {/* Upload Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload & Validate CSV</span>
          </button>
        </div>
      </div>

      {/* Middle KPI Row (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Dataset Name */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Dataset Name
          </span>
          <span className="text-sm font-bold text-white truncate block font-mono">
            {activeDatasetName}
          </span>
        </div>

        {/* Rows Count */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Rows Count
          </span>
          <span className="text-xl font-bold text-white">{totalRows}</span>
        </div>

        {/* Columns Count */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Columns Count
          </span>
          <span className="text-xl font-bold text-white">{totalCols}</span>
        </div>

        {/* Missing Values */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Missing Values
          </span>
          <span className="text-xl font-bold text-emerald-400">{missingVal}</span>
        </div>

        {/* Duplicates */}
        <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Duplicates
          </span>
          <span className="text-xl font-bold text-emerald-400">{duplicatesVal}</span>
        </div>
      </div>

      {/* Dataset Table Preview Card */}
      <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-bold text-white">Dataset Table Preview</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0D1424] border border-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500 w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1424] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="px-4 py-3">AGE</th>
                <th className="px-4 py-3">ANNUAL INCOME (K$)</th>
                <th className="px-4 py-3">CUSTOMERID</th>
                <th className="px-4 py-3">GENDER</th>
                <th className="px-4 py-3">SPENDING SCORE (1-100)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-2.5">{row["Age"] || row["age"] || 35}</td>
                    <td className="px-4 py-2.5">
                      {row["Annual Income (k$)"] || row["Annual_Income"] || row["income"] || 50}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-cyan-400">
                      {row["CustomerID"] || row["customer_id"] || idx + 1}
                    </td>
                    <td className="px-4 py-2.5">{row["Gender"] || row["gender"] || "Male"}</td>
                    <td className="px-4 py-2.5">
                      {row["Spending Score (1-100)"] || row["Spending_Score"] || row["spending_score"] || 50}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    No matching records found.
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
