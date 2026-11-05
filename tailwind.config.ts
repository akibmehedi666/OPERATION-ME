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
        mono: [
          "var(--font-jetbrains)",
          "var(--font-share-tech)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        tech: [
          "var(--font-share-tech)",
          "var(--font-jetbrains)",
          "monospace",
        ],
      },
      colors: {
        spy: {
          bg: "#06080c",
          surface: "#0c1117",
          card: "#0f1620",
          cardHover: "#141d2a",
          border: "#1e293b",
          borderGlow: "#00ff6640",
          green: "#00ff66",
          greenMuted: "rgba(0, 255, 102, 0.12)",
          amber: "#ffb700",
          amberMuted: "rgba(255, 183, 0, 0.12)",
          red: "#ff2a44",
          redMuted: "rgba(255, 42, 68, 0.15)",
          cyan: "#00f0ff",
          muted: "#64748b",
          text: "#e2e8f0",
          dim: "#94a3b8",
        },
      },
      boxShadow: {
        "spy-green": "0 0 15px rgba(0, 255, 102, 0.25), inset 0 0 15px rgba(0, 255, 102, 0.05)",
        "spy-amber": "0 0 15px rgba(255, 183, 0, 0.25), inset 0 0 15px rgba(255, 183, 0, 0.05)",
        "spy-red": "0 0 15px rgba(255, 42, 68, 0.35), inset 0 0 15px rgba(255, 42, 68, 0.08)",
        "hud-card": "0 4px 20px -2px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(30, 41, 59, 0.8)",
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
        "glitch": "glitch 0.4s ease-in-out",
        "radar": "radar 4s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
