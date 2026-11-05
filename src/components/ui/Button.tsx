"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "danger" | "amber" | "stealth" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  soundCue?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-mono font-bold tracking-wider uppercase transition-all duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2.5 text-xs sm:text-sm gap-2",
      lg: "px-6 py-3 text-sm sm:text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-spy-green text-black border border-spy-green hover:bg-[#00e65c] hover:shadow-spy-green active:scale-[0.98]",
      danger:
        "bg-spy-red/10 text-spy-red border border-spy-red hover:bg-spy-red hover:text-black hover:shadow-spy-red active:scale-[0.98]",
      amber:
        "bg-spy-amber/15 text-spy-amber border border-spy-amber hover:bg-spy-amber hover:text-black hover:shadow-spy-amber active:scale-[0.98]",
      stealth:
        "bg-spy-surface text-spy-dim border border-spy-border hover:border-spy-green/60 hover:text-spy-green hover:bg-spy-card active:scale-[0.98]",
      outline:
        "bg-transparent text-spy-green border border-spy-green/70 hover:bg-spy-green/10 hover:shadow-spy-green active:scale-[0.98]",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {/* Subtle corner notches for spy aesthetic */}
        <span className="absolute top-0 left-0 w-1 h-1 bg-current opacity-70 pointer-events-none" />
        <span className="absolute bottom-0 right-0 w-1 h-1 bg-current opacity-70 pointer-events-none" />

        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>TRANSMITTING...</span>
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

