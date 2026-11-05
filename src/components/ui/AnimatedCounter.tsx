"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAnimations } from "@/lib/animationContext";

interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration in ms, default 400ms
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 400,
  className,
  prefix = "",
  suffix = "",
}) => {
  const { isMotionActive } = useAnimations();
  const [displayValue, setDisplayValue] = useState<number>(() => (isMotionActive ? 0 : value));
  const previousValueRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMotionActive) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const startVal = previousValueRef.current;
    const endVal = value;
    const diff = endVal - startVal;

    if (diff === 0) {
      setDisplayValue(value);
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + diff * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        previousValueRef.current = endVal;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration, isMotionActive]);

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};
