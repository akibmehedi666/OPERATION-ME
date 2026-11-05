"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type BadgeVariant =
  | "active"
  | "locked"
  | "completed"
  | "failing"
  | "urgent"
  | "high"
  | "medium"
  | "low"
  | "category"
  | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dotColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  dotColor,
  className,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    active: "bg-spy-green/10 text-spy-green border-spy-green/30",
    locked: "bg-slate-900/60 text-slate-400 border-slate-800",
    completed: "bg-slate-900/40 text-slate-500 border-slate-800 line-through",
    failing: "bg-red-950/20 text-spy-red border-spy-red/40",
    urgent: "bg-red-950/20 text-red-400 border-red-800/40",
    high: "bg-amber-950/20 text-amber-400 border-amber-800/40",
    medium: "bg-slate-900/60 text-slate-300 border-slate-800",
    low: "bg-slate-900/40 text-slate-400 border-slate-800",
    category: "bg-[#141d18] text-slate-300 border-[#23332a]",
    neutral: "bg-[#141d18] text-slate-300 border-[#23332a]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono uppercase tracking-wider border rounded-[3px]",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dotColor && (
        <span
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {children}
    </span>
  );
};
