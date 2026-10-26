import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 text-slate-100 shadow-sm",
        hoverable && "transition-all duration-200 hover:border-slate-700 hover:shadow-md hover:bg-slate-900/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ children, className, title, subtitle, action, ...props }: CardHeaderProps) {
  if (title || subtitle || action) {
    return (
      <div className={clsx("flex items-start justify-between pb-4 border-b border-slate-800/80 mb-4 gap-4", className)} {...props}>
        <div>
          {title && <h3 className="font-semibold text-base leading-none tracking-tight text-white">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
        {children}
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col space-y-1.5 pb-4 border-b border-slate-800/80 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx("font-semibold text-lg leading-none tracking-tight text-white", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx("text-sm text-slate-400 mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("pt-0", className)} {...props}>
      {children}
    </div>
  );
}
