import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        spy: {
          bg: "var(--bg-page)",
          surface: "var(--bg-surface)",
          surface2: "var(--bg-surface-2)",
          card: "var(--bg-surface)",
          cardHover: "var(--bg-surface-hover)",
          border: "var(--border-color)",
          borderLight: "var(--border-light)",
          green: "var(--primary)",
          greenHover: "var(--primary-hover)",
          greenMuted: "var(--primary-muted)",
          amber: "var(--warning)",
          amberMuted: "var(--warning-muted)",
          red: "var(--danger)",
          redMuted: "var(--danger-muted)",
          dim: "var(--text-dim)",
          muted: "var(--text-muted)",
          text: "var(--text-main)",
          contrast: "var(--primary-contrast)",
          chipBg: "var(--chip-bg)",
          chipBorder: "var(--chip-border)",
          chipText: "var(--chip-text)",
        },
      },
      boxShadow: {
        "active-mission": "var(--hero-shadow)",
        "button-glow": "var(--button-shadow)",
        card: "var(--card-shadow)",
      },
    },
  },
  plugins: [],
};
export default config;
