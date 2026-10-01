"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./Sidebar";
import { cn } from "@/lib/utils";

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 h-14 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <PieChart className="h-4 w-4" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">
          SEGMENT<span className="text-indigo-400">IQ</span>
        </span>
      </Link>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-300 hover:text-white rounded-lg border border-slate-800"
        aria-label="Toggle Dashboard Navigation Drawer"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-14 z-50 bg-slate-950/95 backdrop-blur-xl p-4 overflow-y-auto flex flex-col justify-between border-t border-slate-800">
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Navigation Menu
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-300 hover:bg-slate-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-800">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-sm font-medium text-slate-300 border border-slate-800"
            >
              Exit to Landing Page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
