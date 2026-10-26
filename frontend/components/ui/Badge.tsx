import React from "react";
import clsx from "clsx";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "indigo"
  | "cyan"
  | "purple"
  | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950/70 text-emerald-300 border-emerald-800/80",
    warning: "bg-amber-950/70 text-amber-300 border-amber-800/80",
    danger: "bg-rose-950/70 text-rose-300 border-rose-800/80",
    info: "bg-blue-950/70 text-blue-300 border-blue-800/80",
    indigo: "bg-indigo-950/70 text-indigo-300 border-indigo-800/80",
    cyan: "bg-cyan-950/70 text-cyan-300 border-cyan-800/80",
    purple: "bg-purple-950/70 text-purple-300 border-purple-800/80",
    outline: "border-slate-700 text-slate-300 bg-transparent",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
