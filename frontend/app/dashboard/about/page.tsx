"use client";

import React from "react";
import { Info, Cpu, Layers, Shield, Sparkles, Server, Code, Rocket } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          About SegmentIQ Engine & Methodology
          <Info className="w-6 h-6 text-indigo-400" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Technical documentation on machine learning algorithms, evaluation metrics, and future platform roadmap.
        </p>
      </div>

      {/* Conceptual Background */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            What is Customer Segmentation?
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Customer segmentation is the process of partitioning a company&apos;s customer base into distinct sub-groups based on shared purchasing behaviors, demographics, spending levels, and engagement recency.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Layers className="w-4 h-4" />
            Why Unsupervised Clustering?
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Unsupervised clustering algorithms discover hidden, natural behavioral patterns in customer datasets without requiring pre-labeled training data. This eliminates human bias in marketing persona creation.
          </p>
        </div>
      </div>

      {/* Machine Learning Pipeline Breakdown */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Core Algorithms & Evaluation Metrics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-indigo-300">
              Algorithms Implemented:
            </h4>
            <ul className="space-y-2">
              <li className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <strong className="text-white block">1. K-Means Clustering</strong>
                Minimizes within-cluster sum-of-squares (inertia) to form $K$ spherical clusters around centroids.
              </li>
              <li className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <strong className="text-white block">2. Agglomerative Hierarchical Clustering</strong>
                Builds nested cluster trees using Ward linkage variance minimization.
              </li>
              <li className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <strong className="text-white block">3. DBSCAN (Density-Based Spatial Clustering)</strong>
                Groups core points within radius $\epsilon$ and labels isolated points as noise (-1).
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-cyan-300">
              Evaluation Metrics:
            </h4>
            <ul className="space-y-2">
              <li className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <strong className="text-white block">Silhouette Score ($S \in [-1, 1]$)</strong>
                Measures how similar an object is to its own cluster compared to other clusters.
              </li>
              <li className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <strong className="text-white block">Davies-Bouldin Index</strong>
                Evaluates cluster separation and compactness. Lower values indicate better separation.
              </li>
              <li className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <strong className="text-white block">Calinski-Harabasz Score</strong>
                Ratio of sum of between-clusters dispersion and within-cluster dispersion.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-cyan-400" />
          Production Technology Stack
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 font-mono">Frontend</div>
            <div className="font-bold text-white mt-1">Next.js 15, React 19, TypeScript</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 font-mono">Styling & UI</div>
            <div className="font-bold text-white mt-1">Tailwind CSS, Framer Motion</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 font-mono">Backend API</div>
            <div className="font-bold text-white mt-1">FastAPI, Python 3.13</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 font-mono">ML & Data</div>
            <div className="font-bold text-white mt-1">Scikit-Learn, Pandas, NumPy</div>
          </div>
        </div>
      </div>

      {/* Future Roadmap */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Rocket className="w-5 h-5 text-indigo-400" />
          Future Platform Architecture Roadmap
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <strong className="text-indigo-400 block mb-1">PostgreSQL & Supabase Storage</strong>
            Persistent multi-tenant customer database and historical segmentation snapshots.
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <strong className="text-emerald-400 block mb-1">Customer Lifetime Value (CLV)</strong>
            Predictive machine learning models forecasting 12-month customer monetary value.
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <strong className="text-cyan-400 block mb-1">Customer Churn Prediction</strong>
            Classification models identifying accounts at imminent risk of lapsing.
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <strong className="text-amber-400 block mb-1">AI-Generated Marketing Campaigns</strong>
            LLM integration for auto-generating personalized email and ad copy per segment.
          </div>
        </div>
      </div>
    </div>
  );
}
