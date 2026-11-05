"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface StampLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  variant?: "danger" | "amber" | "green" | "dim";
  rotate?: number;
  size?: "sm" | "md" | "lg";
}

export const StampLabel: React.FC<StampLabelProps> = ({
  text,
  variant = "danger",
  rotate = -6,
  size = "md",
  className,
  ...props
}) => {
  const variantStyles = {
    danger: "text-spy-red border-spy-red bg-spy-red/5 text-glow-red shadow-[0_0_12px_rgba(255,42,68,0.25)]",
    amber: "text-spy-amber border-spy-amber bg-spy-amber/5 text-glow-amber shadow-[0_0_12px_rgba(255,183,0,0.2)]",
    green: "text-spy-green border-spy-green bg-spy-green/5 text-glow-green shadow-[0_0_12px_rgba(0,255,102,0.2)]",
    dim: "text-slate-500 border-slate-600 bg-slate-900/40",
  };

  const sizeStyles = {
    sm: "text-[10px] sm:text-xs px-2 py-0.5 border-[1.5px] tracking-widest",
    md: "text-xs sm:text-sm px-3 py-1 border-2 tracking-[0.2em]",
    lg: "text-base sm:text-xl px-4 py-1.5 border-[3px] tracking-[0.25em] font-black",
  };

  return (
    <div
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn(
        "classified-stamp inline-block font-mono font-black uppercase select-none transition-transform",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        <span>★</span>
        <span>{text}</span>
        <span>★</span>
      </span>
    </div>
  );
};

