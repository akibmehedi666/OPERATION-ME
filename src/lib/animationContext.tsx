"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { MotionConfig } from "framer-motion";

interface AnimationContextType {
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  systemReducedMotion: boolean;
  isMotionActive: boolean;
}

const AnimationContext = createContext<AnimationContextType>({
  animationsEnabled: true,
  setAnimationsEnabled: () => {},
  systemReducedMotion: false,
  isMotionActive: true,
});

export const useAnimations = () => useContext(AnimationContext);

export const AnimationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(true);
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("op_me_animations_enabled");
      if (stored !== null) {
        setAnimationsEnabledState(stored === "true");
      }
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setSystemReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setSystemReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  const setAnimationsEnabled = useCallback((enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_animations_enabled", String(enabled));
    }
  }, []);

  const isMotionActive = animationsEnabled && !systemReducedMotion;

  const contextValue = useMemo(
    () => ({
      animationsEnabled,
      setAnimationsEnabled,
      systemReducedMotion,
      isMotionActive,
    }),
    [animationsEnabled, setAnimationsEnabled, systemReducedMotion, isMotionActive]
  );

  return (
    <AnimationContext.Provider value={contextValue}>
      <MotionConfig reducedMotion={isMotionActive ? "never" : "always"}>
        {children}
      </MotionConfig>
    </AnimationContext.Provider>
  );
};

