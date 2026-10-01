"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import {
  Sparkles,
  ArrowRight,
  Upload,
  BarChart3,
  Users,
  Target,
  Zap,
  Sliders,
  ShieldCheck,
  TrendingUp,
  LineChart,
  Layers,
  PieChart,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const { loadDemo } = useSegmentIQ();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Hero Content */}
              <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Machine Learning Powered Analytics Platform
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Understand Your Customers.{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                    Segment Smarter.
                  </span>{" "}
                  Grow Faster.
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                  SegmentIQ uses advanced clustering algorithms to transform customer behavior data into clear, actionable customer segments.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40"
                  >
                    Explore Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => loadDemo()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-slate-200 border border-slate-700/80 transition-all hover:bg-slate-800 hover:text-white"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Try Demo Dataset
                  </Link>
                </div>

                <div className="flex items-center gap-6 pt-4 text-xs font-medium text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero Database Needed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dynamic ML Pipelines
                  </span>
                </div>
              </div>

              {/* Right Hero Visual */}
              <div className="lg:col-span-6 w-full">
                <HeroVisual />
              </div>
            </div>
          </div>
        </section>

        {/* TRUSTED TECHNOLOGY STRIP */}
        <section className="border-y border-slate-800/80 bg-slate-950/60 py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
              Powered by Core Machine Learning Technologies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-sm font-semibold text-slate-300">
              <span className="flex items-center gap-2 text-indigo-400">
                <Layers className="w-4 h-4 text-indigo-400" /> K-Means Clustering
              </span>
              <span className="flex items-center gap-2 text-emerald-400">
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Hierarchical Clustering
              </span>
              <span className="flex items-center gap-2 text-cyan-400">
                <Zap className="w-4 h-4 text-cyan-400" /> DBSCAN Density Analysis
              </span>
              <span className="flex items-center gap-2 text-amber-400">
                <LineChart className="w-4 h-4 text-amber-400" /> PCA Dimensionality Reduction
              </span>
              <span className="flex items-center gap-2 text-purple-400">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> Scikit-Learn Engine
              </span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                Seamless 4-Step Process
              </h2>
              <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                How SegmentIQ Transforms Customer Data
              </h3>
              <p className="text-sm text-slate-400">
                From raw CSV uploads to dynamic executive marketing recommendations in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Upload Data",
                  desc: "Drag and drop your customer CSV containing metrics like Age, Income, Spending, and Purchase Frequency.",
                  icon: Upload,
                  color: "text-indigo-400",
                },
                {
                  step: "02",
                  title: "Analyze Customers",
                  desc: "Explore feature distributions, correlation heatmaps, missing value checks, and automated summary statistics.",
                  icon: BarChart3,
                  color: "text-cyan-400",
                },
                {
                  step: "03",
                  title: "Discover Segments",
                  desc: "Experiment with K-Means, Agglomerative, and DBSCAN algorithms to find natural behavioral customer clusters.",
                  icon: Sliders,
                  color: "text-emerald-400",
                },
                {
                  step: "04",
                  title: "Take Action",
                  desc: "Receive auto-generated segment profiles, executive insights, and targeted marketing strategy recommendations.",
                  icon: Target,
                  color: "text-amber-400",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="glass-card p-6 rounded-2xl relative border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-black font-mono text-slate-700">{item.step}</span>
                        <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${item.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES CARDS */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/80 border-t border-slate-900">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                Comprehensive Capabilities
              </h2>
              <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Built for Data-Driven Teams
              </h3>
              <p className="text-sm text-slate-400">
                A complete suite of clustering and customer intelligence tools built into one unified dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Automated Segmentation",
                  desc: "Automatically normalizes, scales, and profiles customer features without manual coding.",
                  icon: Sparkles,
                },
                {
                  title: "Multiple ML Algorithms",
                  desc: "Compare K-Means, Agglomerative Hierarchical Clustering, and DBSCAN side-by-side.",
                  icon: Layers,
                },
                {
                  title: "Advanced Analytics",
                  desc: "Elbow curves, Silhouette scores, Davies-Bouldin metrics, and 2D PCA spatial maps.",
                  icon: LineChart,
                },
                {
                  title: "Customer Profiling",
                  desc: "Dynamic persona naming engine translates raw cluster IDs into meaningful business labels.",
                  icon: Users,
                },
                {
                  title: "Business Insights",
                  desc: "Instant executive takeaways identifying your highest-value and at-risk customer groups.",
                  icon: TrendingUp,
                },
                {
                  title: "Marketing Recommendations",
                  desc: "Tailored campaigns, strategies, and growth goals mapped directly to each segment.",
                  icon: Target,
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="glass-panel p-6 rounded-2xl space-y-3">
                    <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-white">{feat.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ALGORITHM SECTION */}
        <section id="algorithms" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                Machine Learning Algorithms Explained
              </h2>
              <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Three Powerful Clustering Methods
              </h3>
              <p className="text-sm text-slate-400">
                Understand how each algorithm partitions customer behavior for maximum strategic impact.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* K-Means */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold w-fit">
                  Centroid-Based
                </div>
                <h4 className="text-xl font-bold text-white">K-Means Clustering</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Partitions customers into $K$ distinct spherical clusters by minimizing the sum of squared distances to cluster centroids. Best for well-separated continuous features.
                </p>
                <div className="pt-2 text-xs font-medium text-slate-300 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between"><span>Evaluation:</span> <strong className="text-indigo-400">Elbow & Silhouette</strong></div>
                  <div className="flex justify-between"><span>Best For:</span> <strong className="text-slate-200">Balanced, Spherical Clusters</strong></div>
                </div>
              </div>

              {/* Hierarchical */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold w-fit">
                  Tree-Based Hierarchy
                </div>
                <h4 className="text-xl font-bold text-white">Hierarchical Clustering</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Builds a nested tree of customer relationships (dendrogram) using bottom-up Agglomerative linkage. Ideal for exploring multi-level customer sub-segments.
                </p>
                <div className="pt-2 text-xs font-medium text-slate-300 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between"><span>Evaluation:</span> <strong className="text-emerald-400">Dendrogram & Linkage</strong></div>
                  <div className="flex justify-between"><span>Best For:</span> <strong className="text-slate-200">Nested Sub-groups</strong></div>
                </div>
              </div>

              {/* DBSCAN */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold w-fit">
                  Density-Based Outliers
                </div>
                <h4 className="text-xl font-bold text-white">DBSCAN</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Groups densely connected points based on distance ($\epsilon$) and minimum neighbors. Automatically detects arbitrary cluster shapes and labels irregular outliers as noise.
                </p>
                <div className="pt-2 text-xs font-medium text-slate-300 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between"><span>Evaluation:</span> <strong className="text-cyan-400">Eps & Min Samples</strong></div>
                  <div className="flex justify-between"><span>Best For:</span> <strong className="text-slate-200">Noise & Arbitrary Shapes</strong></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BUSINESS VALUE */}
        <section id="value" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/80 border-t border-slate-900">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                  Strategic Business ROI
                </h2>
                <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Why Customer Segmentation Matters for Growth
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Treating every customer identically drains marketing budgets. SegmentIQ gives your team precision focus to maximize engagement, retention, and average order value.
                </p>

                <div className="space-y-4">
                  {[
                    { title: "Targeted Marketing Campaigns", desc: "Craft bespoke messaging for high-value VIPs vs budget shoppers." },
                    { title: "Proactive Churn Reduction", desc: "Identify low-engagement customers before they lapse completely." },
                    { title: "Personalized Product Offers", desc: "Deliver tailored recommendations aligned with purchase frequency." },
                    { title: "Optimized Ad Spend & ROAS", desc: "Direct advertising dollars toward high-converting customer segments." },
                  ].map((val) => (
                    <div key={val.title} className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{val.title}</h4>
                        <p className="text-xs text-slate-400">{val.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Executive ROI Snapshot</span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300">Live Analytics</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-2xl font-bold text-emerald-400">+28%</div>
                      <div className="text-xs text-slate-400 mt-1">Campaign Conversion Rate</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-2xl font-bold text-indigo-400">3.4x</div>
                      <div className="text-xs text-slate-400 mt-1">Customer Lifetime Value (CLV)</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-2xl font-bold text-cyan-400">-35%</div>
                      <div className="text-xs text-slate-400 mt-1">Customer Churn Rate</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-2xl font-bold text-amber-400">100%</div>
                      <div className="text-xs text-slate-400 mt-1">Automated Segmentation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-900 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-slate-950 pointer-events-none" />
          <div className="mx-auto max-w-4xl relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Start Segmenting Your Customers Today
            </h2>
            <p className="text-base text-slate-300 max-w-xl mx-auto">
              Upload your customer CSV or explore with our built-in demo dataset to uncover actionable customer intelligence instantly.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:scale-105"
              >
                Launch Dashboard Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
