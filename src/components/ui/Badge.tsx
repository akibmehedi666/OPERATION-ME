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
    active: "bg-spy-greenMuted text-spy-green border-spy-green/30",
    locked: "bg-spy-surface2 text-spy-muted border-spy-border",
    completed: "bg-spy-surface2 text-spy-dim border-spy-border line-through",
    failing: "bg-spy-redMuted text-spy-red border-spy-red/40",
    urgent: "bg-spy-redMuted text-spy-red border-spy-red/40",
    high: "bg-spy-amberMuted text-spy-amber border-spy-amber/40",
    medium: "bg-spy-surface2 text-spy-text border-spy-border",
    low: "bg-spy-surface2 text-spy-muted border-spy-border",
    category: "bg-spy-chipBg text-spy-chipText border-spy-chipBorder",
    neutral: "bg-spy-chipBg text-spy-chipText border-spy-chipBorder",
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
          className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {children}
    </span>
  );
};
