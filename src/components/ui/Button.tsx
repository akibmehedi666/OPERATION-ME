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
      "relative inline-flex items-center justify-center font-mono font-medium tracking-wider uppercase transition-colors duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none rounded-[4px]";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-xs sm:text-sm gap-2",
      lg: "px-5 py-2.5 text-sm gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-spy-green text-spy-contrast border border-spy-green hover:bg-spy-greenHover shadow-button-glow font-bold",
      danger:
        "bg-transparent text-spy-red border border-spy-red hover:bg-spy-redMuted",
      amber:
        "bg-transparent text-spy-amber border border-spy-amber hover:bg-spy-amberMuted",
      stealth:
        "bg-spy-surface2 text-spy-muted border border-spy-border hover:border-spy-borderLight hover:text-spy-text",
      outline:
        "bg-transparent text-spy-green border border-spy-green hover:bg-spy-greenMuted",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
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
