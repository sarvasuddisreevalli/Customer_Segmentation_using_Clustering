"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Database,
  Sliders,
  BarChart3,
  Users,
  Brain,
  Lightbulb,
  MessageSquare,
  FileText,
  Settings,
  Menu,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  Activity,
  UploadCloud,
} from "lucide-react";
import { getHealth, listDatasets, listClusteringRuns } from "@/lib/api";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Segmentation Studio", href: "/studio", icon: Sliders },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Customer Explorer", href: "/explorer", icon: Users },
  { name: "AI Insights", href: "/ai-insights", icon: Brain },
  { name: "Recommendations", href: "/recommendations", icon: Lightbulb },
  { name: "Ask SegmentIQ", href: "/ask-segmentiq", icon: MessageSquare },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [activeDatasetName, setActiveDatasetName] = useState<string>("Mall_Customers.csv");

  useEffect(() => {
    // Check backend health on mount
    getHealth()
      .then((res) => setApiOnline(res.status === "online"))
      .catch(() => setApiOnline(false));

    // Check latest active dataset
    listDatasets(1, 1)
      .then((res) => {
        if (res.datasets.length > 0) {
          setActiveDatasetName(res.datasets[0].original_filename);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-xl shrink-0 z-30">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-none">
              Segment<span className="text-indigo-400">IQ</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase block mt-1">
              Customer Analytics
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Platform
          </div>
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                )}
              >
                <Icon
                  className={clsx(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}

          <div className="px-3 pt-5 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            AI & Intelligence
          </div>
          {NAV_ITEMS.slice(5, 8).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                )}
              >
                <Icon
                  className={clsx(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}

          <div className="px-3 pt-5 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            System
          </div>
          {NAV_ITEMS.slice(8).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                )}
              >
                <Icon
                  className={clsx(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* System Health Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Backend API</span>
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  "w-2 h-2 rounded-full",
                  apiOnline === true
                    ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                    : apiOnline === false
                    ? "bg-rose-500"
                    : "bg-amber-500 animate-pulse"
                )}
              />
              <span className="font-medium text-slate-300">
                {apiOnline === true ? "Online" : apiOnline === false ? "Offline" : "Connecting"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 hidden sm:inline">Platform</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
              <span className="font-medium text-slate-200">
                {NAV_ITEMS.find((n) => n.href === pathname)?.name || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[140px]">{activeDatasetName}</span>
            </div>

            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Segmentation Studio</span>
              <span className="sm:hidden">Studio</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
