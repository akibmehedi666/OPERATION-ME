"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
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
    green:
      "bg-gradient-to-r from-[#1f7a4d] to-[#14b8a6] dark:from-spy-green dark:to-spy-green dark:bg-spy-green",
    amber: "bg-spy-amber",
    red: "bg-spy-red",
  };

  return (
    <div className="w-full select-none">
      {(label || sublabel) && (
        <div className="flex justify-between items-center text-xs font-mono tracking-wider uppercase mb-1 text-spy-dim">
          <span className="font-medium text-spy-text">{label}</span>
          {sublabel && <span className="text-spy-green font-semibold">{sublabel}</span>}
        </div>
      )}

      <div
        className={cn(
          "relative w-full bg-spy-surface2 border border-spy-border overflow-hidden rounded-[2px]",
          heightStyles[size],
          className
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={cn("h-full", colorStyles[variant])}
        />
      </div>
    </div>
  );
};
