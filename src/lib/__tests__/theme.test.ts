import { describe, it, expect, beforeEach } from "vitest";
import {
  getStoredThemePreference,
  resolveTheme,
  applyThemeClass,
  saveThemePreference,
} from "../theme";
import { getCategoryTheme, CATEGORY_THEMES } from "../categoryTheme";

describe("theme - preference storage and resolution", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("defaults to 'dark' when no stored preference exists", () => {
    expect(getStoredThemePreference()).toBe("dark");
  });

  it("saves and retrieves 'light', 'dark', and 'system' preferences", () => {
    saveThemePreference("light");
    expect(getStoredThemePreference()).toBe("light");

    saveThemePreference("dark");
    expect(getStoredThemePreference()).toBe("dark");

    saveThemePreference("system");
    expect(getStoredThemePreference()).toBe("system");
  });

  it("resolves static preferences directly", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });

  it("applies and removes 'dark' class on document root without side effects", () => {
    applyThemeClass("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    applyThemeClass("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("saveThemePreference automatically resolves and applies theme class", () => {
    saveThemePreference("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    saveThemePreference("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("categoryTheme - tokens and styling maps", () => {
  it("provides soft tint background and dark text tokens for OS (blue)", () => {
    const os = getCategoryTheme("Operating Systems");
    expect(os.colorName).toBe("blue");
    expect(os.bgLight).toBe("#e4eefc");
    expect(os.textLight).toBe("#1d4f9f");
  });

  it("provides soft tint tokens for Economics (amber)", () => {
    const eco = getCategoryTheme("Economics");
    expect(eco.colorName).toBe("amber");
    expect(eco.bgLight).toBe("#fbefd5");
    expect(eco.textLight).toBe("#9a5b00");
  });

  it("provides soft tint tokens for Tuition (orange)", () => {
    const tuition = getCategoryTheme("Tuition");
    expect(tuition.colorName).toBe("orange");
    expect(tuition.bgLight).toBe("#fdeadb");
    expect(tuition.textLight).toBe("#a8500f");
  });

  it("matches all 11 core categories accurately", () => {
    const keys = ["os", "os-lab", "eco", "dip", "p&s", "fydp", "cp", "cyber", "projects", "research", "tuition"];
    keys.forEach((k) => {
      expect(CATEGORY_THEMES[k]).toBeDefined();
      expect(CATEGORY_THEMES[k].chipClass).toBeDefined();
      expect(CATEGORY_THEMES[k].filterChipActiveClass).toBeDefined();
    });
  });
});
