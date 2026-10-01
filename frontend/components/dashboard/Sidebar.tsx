"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Sliders,
  GitCompare,
  Users,
  Lightbulb,
  Download,
  Info,
  PieChart,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Dataset Upload", href: "/dashboard/upload", icon: Upload },
  { label: "Dataset Analysis", href: "/dashboard/analysis", icon: BarChart3 },
  { label: "Clustering Lab", href: "/dashboard/clustering", icon: Sliders },
  { label: "Model Comparison", href: "/dashboard/comparison", icon: GitCompare },
  { label: "Customer Segments", href: "/dashboard/segments", icon: Users },
  { label: "Business Insights", href: "/dashboard/insights", icon: Lightbulb },
  { label: "Export Data", href: "/dashboard/export", icon: Download },
  { label: "About ML Engine", href: "/dashboard/about", icon: Info },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800/80 justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <PieChart className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
              SEGMENT<span className="text-indigo-400">IQ</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">SaaS Analytics</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Platform Workspace
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/5"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Back Link */}
      <div className="p-4 border-t border-slate-800/80">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Back to Main Site
        </Link>
      </div>
    </aside>
  );
};
