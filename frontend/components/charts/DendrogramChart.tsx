"use client";

import React from "react";

interface DendrogramData {
  icoord: number[][];
  dcoord: number[][];
  ivl?: string[];
}

interface DendrogramProps {
  data: DendrogramData;
}

export const DendrogramChart: React.FC<DendrogramProps> = ({ data }) => {
  const { icoord, dcoord } = data;

  if (!icoord || !dcoord || icoord.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 italic">
        Dendrogram linkage matrix data unavailable for current dataset.
      </div>
    );
  }

  // Calculate bounding box bounds for SVG scaling
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  icoord.forEach((branch) => {
    branch.forEach((x) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    });
  });

  dcoord.forEach((branch) => {
    branch.forEach((y) => {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  });

  // Margins & Dimensions
  const width = 650;
  const height = 240;
  const padding = 30;

  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX || 1)) * (width - 2 * padding);
  const scaleY = (y: number) => height - padding - ((y - minY) / (maxY - minY || 1)) * (height - 2 * padding);

  return (
    <div className="w-full flex flex-col gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Hierarchical Cluster Tree (Dendrogram)</h4>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Ward Linkage Matrix
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Sub-group merges illustrating customer similarity hierarchies based on Euclidean distance.
      </p>

      <div className="w-full overflow-x-auto mt-2 flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[700px] h-[240px] text-indigo-400 select-none"
        >
          {/* Grid background lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />

          {/* Dendrogram Branch Paths */}
          {icoord.map((xs, idx) => {
            const ys = dcoord[idx];
            const p1 = `${scaleX(xs[0])},${scaleY(ys[0])}`;
            const p2 = `${scaleX(xs[1])},${scaleY(ys[1])}`;
            const p3 = `${scaleX(xs[2])},${scaleY(ys[2])}`;
            const p4 = `${scaleX(xs[3])},${scaleY(ys[3])}`;
            const pathData = `M ${p1} L ${p2} L ${p3} L ${p4}`;

            return (
              <path
                key={`branch-${idx}`}
                d={pathData}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
