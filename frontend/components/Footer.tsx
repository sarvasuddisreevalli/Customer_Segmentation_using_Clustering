import React from "react";
import Link from "next/link";
import { PieChart, Github, Shield, Cpu, Activity } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <PieChart className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            SEGMENT<span className="text-indigo-400">IQ</span>
          </span>
          <span className="text-xs text-slate-500">| Turn customer data into actionable segments.</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> K-Means, Hierarchical & DBSCAN Engine
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Stateless Data Processing
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> FastAPI + Next.js 15
          </span>
        </div>

        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} SegmentIQ. Production SaaS Analytics Platform.
        </p>
      </div>
    </footer>
  );
};
