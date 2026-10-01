import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SegmentIQProvider } from "@/hooks/useSegmentIQ";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SegmentIQ | Intelligent Customer Segmentation & Analytics",
  description:
    "Production-grade Machine Learning analytics platform using clustering algorithms (K-Means, Hierarchical, DBSCAN) to turn customer behavioral data into actionable marketing segments.",
  keywords: ["Customer Segmentation", "Clustering", "K-Means", "Machine Learning", "FastAPI", "Next.js", "SaaS Analytics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SegmentIQProvider>{children}</SegmentIQProvider>
      </body>
    </html>
  );
}
