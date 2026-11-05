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
  variant?: "green" | "amber" | "red";
  size?: "sm" | "md";
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  sublabel,
  variant = "green",
  size = "sm",
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightStyles = {
    sm: "h-1.5",
    md: "h-2",
  };

  const colorStyles = {
    green: "bg-spy-green",
    amber: "bg-spy-amber",
    red: "bg-spy-red",
  };

  return (
    <div className="w-full select-none">
      {(label || sublabel) && (
        <div className="flex justify-between items-center text-xs font-mono tracking-wider uppercase mb-1 text-spy-dim">
          <span className="font-medium text-slate-300">{label}</span>
          {sublabel && <span className="text-spy-green">{sublabel}</span>}
        </div>
      )}

      <div
        className={cn(
          "relative w-full bg-[#141d18] border border-spy-border overflow-hidden rounded-[2px]",
          heightStyles[size],
          className
        )}
      >
        <div
          className={cn("h-full transition-all duration-300 ease-out", colorStyles[variant])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
