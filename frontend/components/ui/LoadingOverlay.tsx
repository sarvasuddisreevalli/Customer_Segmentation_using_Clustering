"use client";

import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md px-4"
        >
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center max-w-sm w-full border border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
            <div className="relative mb-6">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-50 blur-lg animate-pulse" />
              <div className="relative p-4 bg-slate-900 rounded-full border border-indigo-500/40 text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              SegmentIQ Engine
            </h4>
            <p className="text-sm text-slate-300 animate-pulse">
              {message || "Processing customer data..."}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
