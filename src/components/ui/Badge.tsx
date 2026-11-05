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
  | "tuition"
  | "class"
  | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "active",
  pulse = false,
  className,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    active: "bg-spy-green/10 text-spy-green border-spy-green/40 shadow-[0_0_8px_rgba(0,255,102,0.15)]",
    locked: "bg-slate-800/40 text-slate-400 border-slate-700/60",
    completed: "bg-emerald-950/40 text-emerald-400 border-emerald-500/40 line-through decoration-emerald-500/60",
    failing: "bg-spy-red/20 text-spy-red border-spy-red animate-pulse text-glow-red shadow-spy-red",
    urgent: "bg-red-950/50 text-red-400 border-red-500 font-bold",
    high: "bg-amber-950/40 text-amber-400 border-amber-500/60",
    medium: "bg-sky-950/40 text-sky-400 border-sky-500/50",
    low: "bg-slate-900/60 text-slate-400 border-slate-700/40",
    tuition: "bg-yellow-950/40 text-yellow-400 border-yellow-500/50",
    class: "bg-cyan-950/40 text-cyan-400 border-cyan-500/50",
    outline: "bg-transparent text-spy-dim border-spy-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider border rounded-none font-semibold",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full animate-ping inline-block",
            variant === "failing" || variant === "urgent"
              ? "bg-spy-red"
              : variant === "active"
              ? "bg-spy-green"
              : "bg-spy-amber"
          )}
        />
      )}
      {children}
    </span>
  );
};

