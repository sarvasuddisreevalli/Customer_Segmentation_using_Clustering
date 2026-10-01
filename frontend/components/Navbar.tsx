"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PieChart, LayoutDashboard, Sparkles, Menu, X, ArrowRight } from "lucide-react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loadDemo } = useSegmentIQ();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <PieChart className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              SEGMENT<span className="text-indigo-400">IQ</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Customer Analytics</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#features" className="transition-colors hover:text-white">Features</Link>
          <Link href="#how-it-works" className="transition-colors hover:text-white">How It Works</Link>
          <Link href="#algorithms" className="transition-colors hover:text-white">Algorithms</Link>
          <Link href="#value" className="transition-colors hover:text-white">Business Value</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/dashboard"
            onClick={() => loadDemo()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700/80 transition-all hover:bg-slate-700/80 hover:text-white"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Try Demo
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:opacity-95 hover:shadow-indigo-500/40"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-300 md:hidden hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Features</Link>
            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">How It Works</Link>
            <Link href="#algorithms" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Algorithms</Link>
            <Link href="#value" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Business Value</Link>
          </nav>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/dashboard"
              onClick={() => { setMobileMenuOpen(false); loadDemo(); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-slate-200 border border-slate-700"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Try Demo Dataset
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25"
            >
              <LayoutDashboard className="h-4 w-4" />
              Explore Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
