"use client";

import React from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Header } from "@/components/dashboard/Header";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { useSegmentIQ } from "@/hooks/useSegmentIQ";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, loadingStep } = useSegmentIQ();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans antialiased">
      <LoadingOverlay isLoading={isLoading} message={loadingStep} />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
