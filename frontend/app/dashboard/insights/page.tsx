"use client";

import React from "react";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";
import { Lightbulb, Target, TrendingUp, Users, ShieldAlert, Award, ArrowRight } from "lucide-react";
import { getClusterColor } from "@/lib/utils";
import Link from "next/link";

export default function InsightsPage() {
  const { insights } = useSegmentIQ();

  if (!insights) {
    return <div className="text-center text-slate-400 py-12">Generating business insights...</div>;
  }

  const {
    executive_summary,
    highest_value_segment,
    largest_segment,
    highest_spending_segment,
    most_frequent_segment,
    lowest_engagement_segment,
    all_profiles,
  } = insights;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Executive Business Insights & Strategy
            <Lightbulb className="w-6 h-6 text-amber-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Data-driven strategic recommendations, targeted marketing campaigns, and growth goals per segment.
          </p>
        </div>
        <Link
          href="/dashboard/export"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all w-fit"
        >
          Export Segmented CSV
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Executive Takeaway Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Executive Strategy Summary</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
          {executive_summary}
        </p>
      </div>

      {/* Key Executive Segment Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Highest Value */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Highest Value Driver</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <h4 className="text-lg font-bold text-white">{highest_value_segment.segment_name}</h4>
          <p className="text-xs text-slate-400">{highest_value_segment.description}</p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 font-semibold">
            Strategy: <span className="text-emerald-400">{highest_value_segment.marketing_recommendation.strategy}</span>
          </div>
        </div>

        {/* Largest Audience */}
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Largest Market Share</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><Users className="w-4 h-4" /></div>
          </div>
          <h4 className="text-lg font-bold text-white">{largest_segment.segment_name}</h4>
          <p className="text-xs text-slate-400">
            {largest_segment.customer_count} customers ({largest_segment.percentage}% of overall audience).
          </p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 font-semibold">
            Strategy: <span className="text-indigo-400">{largest_segment.marketing_recommendation.strategy}</span>
          </div>
        </div>

        {/* Lowest Engagement */}
        <div className="glass-card p-6 rounded-2xl border border-rose-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">At-Risk / Win-Back</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400"><ShieldAlert className="w-4 h-4" /></div>
          </div>
          <h4 className="text-lg font-bold text-white">{lowest_engagement_segment.segment_name}</h4>
          <p className="text-xs text-slate-400">{lowest_engagement_segment.description}</p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 font-semibold">
            Strategy: <span className="text-rose-400">{lowest_engagement_segment.marketing_recommendation.strategy}</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Marketing Strategy Cards Per Segment */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          Targeted Marketing Campaigns & Business Goals
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {all_profiles.map((profile) => {
            const color = getClusterColor(profile.cluster_id);
            const rec = profile.marketing_recommendation;

            return (
              <div
                key={profile.cluster_id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <h4 className="text-lg font-bold text-white">{profile.segment_name}</h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {profile.customer_count} customers ({profile.percentage}%)
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Recommended Strategy:
                    </span>
                    <p className="text-sm font-bold text-indigo-300">{rec.strategy}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Suggested Campaign:
                    </span>
                    <p className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      🎯 {rec.campaign}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Primary Business Goal:
                    </span>
                    <p className="text-xs text-emerald-300 font-medium">{rec.business_goal}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
