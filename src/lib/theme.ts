"use client";

export type ThemePreference = "dark" | "light" | "system";
export type ActiveTheme = "dark" | "light";

const THEME_PREF_KEY = "op_me_theme_preference";

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_PREF_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored as ThemePreference;
  }
  // Initial default for new setup: Dark
  return "dark";
}

export function resolveTheme(pref: ThemePreference): ActiveTheme {
  if (pref === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return isDark ? "dark" : "light";
    }
    return "dark";
  }
  return pref;
}

export function applyThemeClass(theme: ActiveTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const opposite = theme === "dark" ? "light" : "dark";
  if (!root.classList.contains(theme) || root.classList.contains(opposite)) {
    // Atomically set class without an intermediate empty state
    const cleanClasses = root.className
      .split(/\s+/)
      .filter((c) => c && c !== opposite && c !== theme);
    cleanClasses.push(theme);
    root.className = cleanClasses.join(" ");
  }
}

export function saveThemePreference(pref: ThemePreference) {
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_PREF_KEY, pref);
  }
  const resolved = resolveTheme(pref);
  applyThemeClass(resolved);
  return resolved;
}

