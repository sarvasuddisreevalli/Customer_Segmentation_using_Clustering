import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount * 1000);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export const CLUSTER_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
];

export function getClusterColor(clusterId: number): string {
  if (clusterId === -1) return "#94a3b8"; // Slate for noise
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
}
