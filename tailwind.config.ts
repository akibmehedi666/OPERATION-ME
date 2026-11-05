import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
          bg: "#0b0f0d",
          surface: "#111714",
          card: "#131c17",
          cardHover: "#17231d",
          border: "#1d2822",
          borderLight: "#26362e",
          green: "#00ff66",
          greenMuted: "rgba(0, 255, 102, 0.08)",
          amber: "#f59e0b",
          amberMuted: "rgba(245, 158, 11, 0.08)",
          red: "#ef4444",
          redMuted: "rgba(239, 68, 68, 0.08)",
          dim: "#94a3b8",
          muted: "#64748b",
          text: "#e2e8f0",
        },
      },
      boxShadow: {
        "active-mission": "0 0 24px rgba(0, 255, 102, 0.12), 0 0 1px rgba(0, 255, 102, 0.5)",
        "button-glow": "0 0 14px rgba(0, 255, 102, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
