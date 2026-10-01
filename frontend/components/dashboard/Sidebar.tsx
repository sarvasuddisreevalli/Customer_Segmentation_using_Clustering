"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  SlidersHorizontal,
  BarChart3,
  Sparkles,
  GitCompare,
  Users,
  Search,
  Lightbulb,
  History,
  FileText,
  Settings,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Dataset Manager", href: "/dashboard/upload", icon: Database },
  { label: "Data Preprocessing", href: "/dashboard/preprocessing", icon: SlidersHorizontal },
  { label: "Exploratory EDA", href: "/dashboard/analysis", icon: BarChart3 },
  { label: "Clustering Studio", href: "/dashboard/clustering", icon: Sparkles },
  { label: "Model Evaluation", href: "/dashboard/comparison", icon: GitCompare },
  { label: "Customer Segments", href: "/dashboard/segments", icon: Users },
  { label: "Customer Explorer", href: "/dashboard/explorer", icon: Search },
  { label: "Business Insights", href: "/dashboard/insights", icon: Lightbulb },
  { label: "Analysis History", href: "/dashboard/history", icon: History },
  { label: "Reports / Export", href: "/dashboard/export", icon: FileText },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/60 bg-[#0B0F19] shrink-0 h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-5 border-b border-slate-800/60 justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
            CS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white leading-tight">
              Customer Segmentation
            </span>
            <span className="text-[9px] font-semibold tracking-wider text-emerald-400 uppercase">
              EMERALD SAAS ENGINE
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group",
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Session Metadata */}
      <div className="p-3.5 border-t border-slate-800/60 bg-[#0A0E1A] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-slate-400">Analytics Session</span>
          <span className="text-[9px] text-emerald-400 font-mono">ML Engine: scikit-learn</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer transition-colors px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-medium">Copilot</span>
        </div>
      </div>
    </aside>
  );
};
