import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  icon,
  ...props
}: ButtonProps) {
  const effectiveLeftIcon = leftIcon || icon;
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow-indigo-500/20 active:bg-indigo-700 focus:ring-indigo-500",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 focus:ring-slate-500",
    outline:
      "border border-slate-700 hover:border-slate-600 bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white focus:ring-slate-500",
    ghost:
      "bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 focus:ring-slate-500",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-sm hover:shadow-rose-500/20 focus:ring-rose-500",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        effectiveLeftIcon && <span className="inline-flex shrink-0">{effectiveLeftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}
