"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  EDAOverviewResponse,
  ClusteringResult,
  ModelComparisonResponse,
  InsightsResponse,
} from "@/types";
import {
  getEDAAnalysis,
  loadDemoDataset,
  uploadCSV,
  runKMeans,
  runHierarchical,
  runDBSCAN,
  compareModels,
  getInsights,
} from "@/lib/api";

interface SegmentIQContextType {
  activeDatasetName: string;
  edaData: EDAOverviewResponse | null;
  currentAlgorithm: "kmeans" | "hierarchical" | "dbscan";
  setCurrentAlgorithm: (algo: "kmeans" | "hierarchical" | "dbscan") => void;
  kmeansK: number;
  setKmeansK: (k: number) => void;
  hierarchicalK: number;
  setHierarchicalK: (k: number) => void;
  hierarchicalLinkage: string;
  setHierarchicalLinkage: (l: string) => void;
  dbscanEps: number;
  setDbscanEps: (eps: number) => void;
  dbscanMinSamples: number;
  setDbscanMinSamples: (min: number) => void;
  clusteringResult: ClusteringResult | null;
  modelComparison: ModelComparisonResponse | null;
  insights: InsightsResponse | null;
  isLoading: boolean;
  loadingStep: string;
  error: string | null;
  setError: (err: string | null) => void;
  loadDemo: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  executeClustering: (algo?: "kmeans" | "hierarchical" | "dbscan") => Promise<void>;
  executeComparison: () => Promise<void>;
  executeInsights: () => Promise<void>;
}

const SegmentIQContext = createContext<SegmentIQContextType | undefined>(undefined);

export const SegmentIQProvider = ({ children }: { children: ReactNode }) => {
  const [activeDatasetName, setActiveDatasetName] = useState<string>("demo_customers.csv");
  const [edaData, setEdaData] = useState<EDAOverviewResponse | null>(null);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<"kmeans" | "hierarchical" | "dbscan">("kmeans");
  
  const [kmeansK, setKmeansK] = useState<number>(4);
  const [hierarchicalK, setHierarchicalK] = useState<number>(4);
  const [hierarchicalLinkage, setHierarchicalLinkage] = useState<string>("ward");
  const [dbscanEps, setDbscanEps] = useState<number>(0.6);
  const [dbscanMinSamples, setDbscanMinSamples] = useState<number>(5);

  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);
  const [modelComparison, setModelComparison] = useState<ModelComparisonResponse | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Initialize with demo dataset
  useEffect(() => {
    initDemo();
  }, []);

  const initDemo = async () => {
    setIsLoading(true);
    setLoadingStep("Preparing your customer data...");
    setError(null);
    try {
      await loadDemoDataset();
      setActiveDatasetName("demo_customers.csv");
      const eda = await getEDAAnalysis();
      setEdaData(eda);
      
      setLoadingStep("Finding customer patterns with K-Means...");
      const res = await runKMeans(4);
      setClusteringResult(res);

      setLoadingStep("Comparing clustering algorithms...");
      const comp = await compareModels();
      setModelComparison(comp);

      setLoadingStep("Generating executive insights...");
      const ins = await getInsights(res);
      setInsights(ins);
    } catch (err: any) {
      console.error("Failed to initialize dataset:", err);
      setError(err.message || "Failed to load initial dataset.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const loadDemo = async () => {
    await initDemo();
  };

  const uploadFile = async (file: File) => {
    setIsLoading(true);
    setLoadingStep("Uploading CSV...");
    setError(null);
    try {
      setLoadingStep("Validating data quality...");
      const res = await uploadCSV(file);
      setActiveDatasetName(res.filename);

      setLoadingStep("Cleaning & Preprocessing features...");
      const eda = await getEDAAnalysis();
      setEdaData(eda);

      setLoadingStep("Running initial K-Means clustering...");
      const clu = await runKMeans(4);
      setClusteringResult(clu);

      setLoadingStep("Evaluating algorithms...");
      const comp = await compareModels();
      setModelComparison(comp);

      setLoadingStep("Preparing business recommendations...");
      const ins = await getInsights(clu);
      setInsights(ins);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Unable to process uploaded dataset.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const executeClustering = async (algoTarget?: "kmeans" | "hierarchical" | "dbscan") => {
    const target = algoTarget || currentAlgorithm;
    setIsLoading(true);
    setLoadingStep(`Running ${target.toUpperCase()} clustering...`);
    setError(null);
    try {
      let res: ClusteringResult;
      if (target === "kmeans") {
        res = await runKMeans(kmeansK);
      } else if (target === "hierarchical") {
        res = await runHierarchical(hierarchicalK, hierarchicalLinkage);
      } else {
        res = await runDBSCAN(dbscanEps, dbscanMinSamples);
      }
      setClusteringResult(res);

      // Refresh insights with new clustering result
      const ins = await getInsights(res);
      setInsights(ins);
    } catch (err: any) {
      console.error("Clustering execution error:", err);
      setError(err.message || "Clustering execution failed.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const executeComparison = async () => {
    setIsLoading(true);
    setLoadingStep("Comparing algorithm performance metrics...");
    setError(null);
    try {
      const comp = await compareModels();
      setModelComparison(comp);
    } catch (err: any) {
      console.error("Model comparison error:", err);
      setError(err.message || "Model comparison failed.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const executeInsights = async () => {
    if (!clusteringResult) return;
    setIsLoading(true);
    setLoadingStep("Generating customer profiles & marketing insights...");
    setError(null);
    try {
      const ins = await getInsights(clusteringResult);
      setInsights(ins);
    } catch (err: any) {
      console.error("Insights error:", err);
      setError(err.message || "Failed to generate business insights.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <SegmentIQContext.Provider
      value={{
        activeDatasetName,
        edaData,
        currentAlgorithm,
        setCurrentAlgorithm,
        kmeansK,
        setKmeansK,
        hierarchicalK,
        setHierarchicalK,
        hierarchicalLinkage,
        setHierarchicalLinkage,
        dbscanEps,
        setDbscanEps,
        dbscanMinSamples,
        setDbscanMinSamples,
        clusteringResult,
        modelComparison,
        insights,
        isLoading,
        loadingStep,
        error,
        setError,
        loadDemo,
        uploadFile,
        executeClustering,
        executeComparison,
        executeInsights,
      }}
    >
      {children}
    </SegmentIQContext.Provider>
  );
};

export const useSegmentIQ = () => {
  const context = useContext(SegmentIQContext);
  if (!context) {
    throw new Error("useSegmentIQ must be used within a SegmentIQProvider");
  }
  return context;
};
