"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Users, Target, ShieldCheck } from "lucide-react";

interface NodePoint {
  id: number;
  x: number;
  y: number;
  cluster: number;
  income: number;
  spending: number;
  name: string;
}

const SAMPLE_POINTS: NodePoint[] = [
  // High-Value Champions (Indigo)
  { id: 1, x: 75, y: 80, cluster: 0, income: 95, spending: 85, name: "High-Value Champions" },
  { id: 2, x: 82, y: 72, cluster: 0, income: 105, spending: 78, name: "High-Value Champions" },
  { id: 3, x: 68, y: 88, cluster: 0, income: 88, spending: 92, name: "High-Value Champions" },
  { id: 4, x: 88, y: 85, cluster: 0, income: 115, spending: 89, name: "High-Value Champions" },

  // Budget-Conscious Savers (Emerald)
  { id: 5, x: 25, y: 30, cluster: 1, income: 42, spending: 35, name: "Budget Savers" },
  { id: 6, x: 32, y: 22, cluster: 1, income: 48, spending: 28, name: "Budget Savers" },
  { id: 7, x: 18, y: 38, cluster: 1, income: 35, spending: 40, name: "Budget Savers" },
  { id: 8, x: 38, y: 25, cluster: 1, income: 52, spending: 30, name: "Budget Savers" },

  // Young Trendsetters (Cyan)
  { id: 9, x: 30, y: 82, cluster: 2, income: 38, spending: 88, name: "Young Trendsetters" },
  { id: 10, x: 22, y: 75, cluster: 2, income: 30, spending: 82, name: "Young Trendsetters" },
  { id: 11, x: 36, y: 89, cluster: 2, income: 45, spending: 94, name: "Young Trendsetters" },

  // High-Earner Savers (Amber)
  { id: 12, x: 80, y: 22, cluster: 3, income: 110, spending: 24, name: "High-Earner Savers" },
  { id: 13, x: 72, y: 28, cluster: 3, income: 98, spending: 30, name: "High-Earner Savers" },
  { id: 14, x: 85, y: 18, cluster: 3, income: 120, spending: 20, name: "High-Earner Savers" },
];

const CLUSTER_BG_COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-cyan-500", "bg-amber-500"];
const CLUSTER_GLOW = [
  "shadow-indigo-500/50 border-indigo-400",
  "shadow-emerald-500/50 border-emerald-400",
  "shadow-cyan-500/50 border-cyan-400",
  "shadow-amber-500/50 border-amber-400",
];

export const HeroVisual: React.FC = () => {
  const [hoveredPoint, setHoveredPoint] = useState<NodePoint | null>(SAMPLE_POINTS[0]);

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto rounded-2xl glass-panel p-6 overflow-hidden border border-slate-800/90 shadow-2xl">
      {/* Subtle grid lines background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      {/* Floating Header Card */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wide">Live Cluster Mapping</h4>
            <p className="text-[10px] text-slate-400">Standardized PCA & Spatial Distribution</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            Silhouette: 0.68 (Optimal)
          </span>
        </div>
      </div>

      {/* Interactive Cluster Canvas Area */}
      <div className="relative h-[220px] sm:h-[260px] w-full rounded-xl bg-slate-950/60 border border-slate-800/60 p-4 overflow-hidden">
        {/* Canvas Axes Labels */}
        <span className="absolute bottom-2 right-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Annual Income →
        </span>
        <span className="absolute top-4 left-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest -rotate-90 origin-top-left">
          Spending Score →
        </span>

        {/* Cluster hulls background blobs */}
        <div className="absolute top-[10%] right-[10%] w-28 h-28 rounded-full bg-indigo-600/10 blur-xl border border-indigo-500/20 animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-28 h-28 rounded-full bg-emerald-600/10 blur-xl border border-emerald-500/20 animate-pulse" />
        <div className="absolute top-[10%] left-[15%] w-24 h-24 rounded-full bg-cyan-600/10 blur-xl border border-cyan-500/20 animate-pulse" />

        {/* Floating Cluster Nodes */}
        {SAMPLE_POINTS.map((pt) => {
          const isSelected = hoveredPoint?.id === pt.id;
          return (
            <motion.div
              key={pt.id}
              className={`absolute cursor-pointer rounded-full border ${CLUSTER_GLOW[pt.cluster]} ${
                CLUSTER_BG_COLORS[pt.cluster]
              } transition-transform hover:scale-150 z-20`}
              style={{ left: `${pt.x}%`, top: `${100 - pt.y}%` }}
              animate={{
                y: [0, (pt.id % 2 === 0 ? -4 : 4), 0],
              }}
              transition={{
                duration: 3 + (pt.id % 3),
                repeat: Infinity,
                ease: "easeInOut",
              }}
              onMouseEnter={() => setHoveredPoint(pt)}
            >
              <div
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-lg ${
                  isSelected ? "ring-4 ring-white/40 scale-125" : ""
                }`}
              />
            </motion.div>
          );
        })}

        {/* Floating Tooltip Card */}
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 z-30 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-xl max-w-[200px]"
          >
            <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              {hoveredPoint.name}
            </div>
            <div className="text-xs text-slate-200 font-medium flex justify-between">
              <span>Income:</span>
              <span className="text-white font-mono">${hoveredPoint.income}k</span>
            </div>
            <div className="text-xs text-slate-200 font-medium flex justify-between">
              <span>Spending:</span>
              <span className="text-white font-mono">{hoveredPoint.spending}/100</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom KPI Bar */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Customers</div>
            <div className="text-xs font-bold text-white">350 Segmented</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Clusters</div>
            <div className="text-xs font-bold text-white">4 Distinct Groups</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Best Model</div>
            <div className="text-xs font-bold text-white">K-Means (k=4)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
