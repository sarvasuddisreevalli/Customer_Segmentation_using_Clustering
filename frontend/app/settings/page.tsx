"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Settings,
  Shield,
  Sliders,
  Database,
  Cpu,
  CheckCircle2,
  Server,
  Key,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { getAIStatus, getHealth } from "@/lib/api";

export default function SettingsPage() {
  const [theme, setTheme] = useState<string>("dark");
  const [defaultAlgo, setDefaultAlgo] = useState<string>("kmeans");
  const [defaultClusters, setDefaultClusters] = useState<number>(4);
  const [defaultScaling, setDefaultScaling] = useState<string>("StandardScaler");
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedMessage, setSavedMessage] = useState<boolean>(false);

  useEffect(() => {
    // Load local storage preferences
    const savedTheme = localStorage.getItem("segmentiq_theme") || "dark";
    const savedAlgo = localStorage.getItem("segmentiq_algo") || "kmeans";
    const savedK = localStorage.getItem("segmentiq_k") || "4";
    const savedScale = localStorage.getItem("segmentiq_scaling") || "StandardScaler";

    setTheme(savedTheme);
    setDefaultAlgo(savedAlgo);
    setDefaultClusters(parseInt(savedK, 10));
    setDefaultScaling(savedScale);

    // Load backend status
    Promise.allSettled([getHealth(), getAIStatus()]).then(([healthRes, aiRes]) => {
      if (healthRes.status === "fulfilled") setBackendHealth(healthRes.value);
      if (aiRes.status === "fulfilled") setAiStatus(aiRes.value);
      setLoading(false);
    });
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem("segmentiq_theme", theme);
    localStorage.setItem("segmentiq_algo", defaultAlgo);
    localStorage.setItem("segmentiq_k", String(defaultClusters));
    localStorage.setItem("segmentiq_scaling", defaultScaling);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Platform Settings & Diagnostics
            </h1>
            <Badge variant="indigo">Preferences</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Configure default clustering hyperparameters, telemetry, and view connected backend services.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSavePreferences}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        >
          {savedMessage ? "Saved!" : "Save Preferences"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ML Engine Defaults */}
        <Card>
          <CardHeader
            title="Clustering Engine Defaults"
            subtitle="Default parameters applied when opening Segmentation Studio"
          />
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Default Algorithm
              </label>
              <select
                value={defaultAlgo}
                onChange={(e) => setDefaultAlgo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="kmeans">K-Means (Partitioning)</option>
                <option value="hierarchical">Hierarchical (Agglomerative)</option>
                <option value="dbscan">DBSCAN (Density-Based)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Default Clusters (k)
              </label>
              <input
                type="number"
                min="2"
                max="15"
                value={defaultClusters}
                onChange={(e) => setDefaultClusters(parseInt(e.target.value, 10) || 4)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Default Normalization Method
              </label>
              <select
                value={defaultScaling}
                onChange={(e) => setDefaultScaling(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="StandardScaler">StandardScaler (Zero mean, unit variance)</option>
                <option value="MinMaxScaler">MinMaxScaler (Range [0, 1])</option>
                <option value="RobustScaler">RobustScaler (Median & IQR for outliers)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Backend & Environment Status */}
        <Card>
          <CardHeader
            title="Backend Service Health"
            subtitle="Live status of FastAPI and SQLite / PostgreSQL persistence"
          />
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">FastAPI ML Core</div>
                  <div className="text-xs text-slate-500">
                    Version: {backendHealth?.version || "1.0.0"}
                  </div>
                </div>
              </div>
              <Badge variant={backendHealth ? "success" : "danger"}>
                {backendHealth ? "Online" : "Disconnected"}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">AI Intelligence Mode</div>
                  <div className="text-xs text-slate-500">
                    Provider: {aiStatus?.configured_provider || "Deterministic Grounded Engine"}
                  </div>
                </div>
              </div>
              <Badge variant="indigo">
                {aiStatus?.has_external_key ? "Live LLM" : "Deterministic Fallback"}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Database Layer</div>
                  <div className="text-xs text-slate-500">SQLAlchemy 2.x ORM with SQLite/Postgres</div>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Zero-Hallucination Policy */}
        <Card className="md:col-span-2">
          <CardHeader
            title="Data Governance & AI Privacy Safeguards"
            subtitle="Architecture safeguards in accordance with enterprise AI standards"
          />
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                  <Shield className="w-4 h-4" />
                  No PII Transmission
                </div>
                <p className="text-xs text-slate-400">
                  Customer identifiers, emails, and raw rows are NEVER transmitted to external LLM APIs.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Grounded Evidence Only
                </div>
                <p className="text-xs text-slate-400">
                  All metrics, averages, and segment counts originate strictly from deterministic computation.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
                  <Sliders className="w-4 h-4" />
                  Hypothesis Framing
                </div>
                <p className="text-xs text-slate-400">
                  Marketing recommendations are framed as testable business hypotheses with defined KPIs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
