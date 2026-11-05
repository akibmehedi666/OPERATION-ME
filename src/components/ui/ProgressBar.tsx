"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  variant?: "green" | "amber" | "red" | "cyan";
  size?: "sm" | "md" | "lg";
  showSegments?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  sublabel,
  variant = "green",
  size = "md",
  showSegments = true,
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colorStyles = {
    green: "bg-spy-green shadow-[0_0_10px_rgba(0,255,102,0.5)]",
    amber: "bg-spy-amber shadow-[0_0_10px_rgba(255,183,0,0.5)]",
    red: "bg-spy-red shadow-[0_0_10px_rgba(255,42,68,0.5)]",
    cyan: "bg-spy-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]",
  };

  return (
    <div className={cn("w-full font-mono select-none", className)}>
      {(label || sublabel) && (
        <div className="flex justify-between items-center text-xs tracking-wider uppercase mb-1.5 text-spy-dim">
          <span className="font-semibold text-spy-text flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-spy-green inline-block" />
            {label}
          </span>
          {sublabel && <span className="text-spy-green font-mono">{sublabel}</span>}
        </div>
      )}

      <div className={cn("relative w-full bg-slate-900/90 border border-spy-border overflow-hidden p-[1px]", heightStyles[size])}>
        <div
          className={cn("h-full transition-all duration-500 ease-out", colorStyles[variant])}
          style={{ width: `${clampedValue}%` }}
        />

        {showSegments && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, #000, #000 4px, transparent 4px, transparent 8px)",
            }}
          />
        )}
      </div>
    </div>
  );
};

