"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { 
  ThemePreference, 
  ActiveTheme, 
  getStoredThemePreference, 
  saveThemePreference, 
  resolveTheme, 
  applyThemeClass 
} from "./theme";

interface ThemeContextType {
  defaultTheme: ThemePreference;
  activeTheme: ActiveTheme;
  setDefaultTheme: (pref: ThemePreference) => void;
  toggleActiveTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  defaultTheme: "dark",
  activeTheme: "dark",
  setDefaultTheme: () => {},
  toggleActiveTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Single source of truth for the saved preference
  const [defaultTheme, setDefaultThemeState] = useState<ThemePreference>("dark");
  
  // 2. Active theme currently rendered
  const [activeTheme, setActiveThemeState] = useState<ActiveTheme>("dark");

  // Load preference once on mount
  useEffect(() => {
    const stored = getStoredThemePreference();
    const resolved = resolveTheme(stored);
    setDefaultThemeState(stored);
    setActiveThemeState(resolved);
    applyThemeClass(resolved);
  }, []);

  // Watch system preference ONLY when defaultTheme is "system"
  useEffect(() => {
    if (defaultTheme !== "system") return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const next: ActiveTheme = e.matches ? "dark" : "light";
      setActiveThemeState(next);
      applyThemeClass(next);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [defaultTheme]);

  // User selects Light / Dark / System in Settings
  const setDefaultTheme = useCallback((pref: ThemePreference) => {
    setDefaultThemeState(pref);
    saveThemePreference(pref);
    const resolved = resolveTheme(pref);
    setActiveThemeState(resolved);
    applyThemeClass(resolved);
  }, []);

  // User clicks Sun/Moon toggle in AgentHeader
  const toggleActiveTheme = useCallback(() => {
    setActiveThemeState((prev) => {
      const next: ActiveTheme = prev === "dark" ? "light" : "dark";
      applyThemeClass(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      defaultTheme,
      activeTheme,
      setDefaultTheme,
      toggleActiveTheme,
    }),
    [defaultTheme, activeTheme, setDefaultTheme, toggleActiveTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

