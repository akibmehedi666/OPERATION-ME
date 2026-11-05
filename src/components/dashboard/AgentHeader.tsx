"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  LogOut, 
  Flame, 
  Settings, 
  Volume2, 
  VolumeX, 
  X,
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import { getRankFromXp } from "@/lib/rank";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { soundFX } from "@/lib/sound";
import { ThemePreference, ActiveTheme } from "@/lib/theme";
import { useAnimations } from "@/lib/animationContext";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface AgentHeaderProps {
  agentName?: string;
  totalXp: number;
  streak: number;
  currentTheme: ActiveTheme;
  defaultTheme: ThemePreference;
  onToggleTheme: () => void;
  onUpdateDefaultTheme: (pref: ThemePreference) => void;
  onQuickAdd: () => void;
  onLogout: () => void;
}

export function AgentHeader({
  agentName = "Agent Akib",
  totalXp,
  streak,
  currentTheme,
  defaultTheme,
  onToggleTheme,
  onUpdateDefaultTheme,
  onQuickAdd,
  onLogout,
}: AgentHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundFX.isEnabled());
  const { animationsEnabled, setAnimationsEnabled, systemReducedMotion } = useAnimations();
  const rankInfo = getRankFromXp(totalXp);

  // Subtle typewriter effect on Agent greeting on first login of the day (dark theme)
  const [greetingText, setGreetingText] = useState("");
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentTheme !== "dark") {
      setShowGreeting(false);
      return;
    }

    const todayStr = new Date().toDateString();
    const lastGreeting = localStorage.getItem("op_me_greeting_date");

    if (lastGreeting !== todayStr) {
      localStorage.setItem("op_me_greeting_date", todayStr);
      setShowGreeting(true);
      const full = "Welcome back, Agent Akib.";
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setGreetingText(full.slice(0, idx));
        if (idx >= full.length) {
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [currentTheme]);

  const toggleSound = () => {
    const newState = soundFX.toggleSound();
    setSoundEnabled(newState);
  };

  const getRankBadgeClass = (rankName: string) => {
    const r = rankName.toLowerCase();
    if (r.includes("director")) {
      return "bg-[#fbf3cc] text-[#8a6a00] border-[#f5e499] dark:bg-spy-surface2 dark:text-spy-green dark:border-spy-border";
    }
    if (r.includes("elite")) {
      return "bg-[#f0e6fa] text-[#6b2fa0] border-[#dfcbf5] dark:bg-spy-surface2 dark:text-spy-green dark:border-spy-border";
    }
    if (r.includes("agent")) {
      return "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-spy-surface2 dark:text-spy-green dark:border-spy-border";
    }
    return "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-surface2 dark:text-spy-green dark:border-spy-border";
  };

  return (
    <div className={`clean-card bg-gradient-to-r from-[#eef7f1] via-[#f7f5ed] to-[#faf8f2] border border-[#d8e8dc] shadow-[0_1px_3px_rgba(31,122,77,0.06)] dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-spy-surface dark:border-spy-border dark:shadow-none p-4 sm:p-5 mb-6 relative ${
      isSettingsOpen ? "z-50" : ""
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Agent name & Rank */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[4px] bg-[#dcf3e4] text-[#14663a] border border-[#b9e7c8] dark:bg-spy-surface2 dark:text-spy-green dark:border-spy-border flex items-center justify-center font-mono font-bold">
            AK
          </div>
          <div>
            {showGreeting && (
              <div className="text-[11px] font-mono text-spy-green flex items-center gap-1 mb-0.5 tracking-wide">
                <span>{greetingText}</span>
                {greetingText.length < 25 && (
                  <span className="inline-block w-1.5 h-3 bg-spy-green animate-pulse" />
                )}
              </div>
            )}
            <h1 className="text-base sm:text-lg font-mono font-bold text-spy-text tracking-wide">
              {agentName}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-spy-muted font-mono uppercase">Rank:</span>
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[3px] border ${getRankBadgeClass(
                  rankInfo.rank
                )}`}
              >
                {rankInfo.rank}
              </span>
            </div>
          </div>
        </div>

        {/* Right: XP Progress Bar + Streak + New Mission Button + Theme Toggle + Settings + Logout */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* XP Bar */}
          <div className="w-36 sm:w-44">
            <ProgressBar
              value={rankInfo.progress}
              label={
                <span>
                  <AnimatedCounter value={totalXp} /> XP
                </span>
              }
              sublabel={rankInfo.xpToNext > 0 ? `${rankInfo.xpToNext} to next` : "MAX"}
              size="sm"
            />
          </div>

          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-spy-amber bg-spy-amberMuted border border-spy-border px-2.5 py-1 rounded-[3px]">
            <Flame className="w-3.5 h-3.5 text-spy-amber" />
            <span>
              <AnimatedCounter value={streak} /> {streak === 1 ? "day" : "days"}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* ONE New Mission button only */}
            <Button
              variant="primary"
              size="sm"
              onClick={onQuickAdd}
              aria-label="New Mission"
              title="New Mission"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">New Mission</span>
            </Button>

            {/* Sun/Moon quick toggle button with rotate/morph animation */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-spy-muted hover:text-spy-text border border-spy-border hover:border-spy-borderLight rounded-[3px] transition-colors bg-spy-surface2 overflow-hidden"
              title={currentTheme === "dark" ? "Switch to Light Theme (Declassified Dossier)" : "Switch to Dark Theme (Tactical Stealth)"}
            >
              <motion.div
                key={currentTheme}
                initial={{ rotate: -90, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {currentTheme === "dark" ? (
                  <Sun className="w-4 h-4 text-spy-amber" />
                ) : (
                  <Moon className="w-4 h-4 text-spy-green" />
                )}
              </motion.div>
            </button>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-spy-muted hover:text-spy-text border border-spy-border hover:border-spy-borderLight rounded-[3px] transition-colors bg-spy-surface2"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 text-spy-muted hover:text-spy-red border border-spy-border hover:border-spy-borderLight rounded-[3px] transition-colors bg-spy-surface2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-spy-surface border border-spy-border p-5 rounded-[6px] max-w-sm w-full font-mono text-xs shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-spy-border">
              <span className="font-bold text-spy-text">SETTINGS</span>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-spy-muted hover:text-spy-text"
                aria-label="Close settings"
                title="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Default Theme Option */}
            <div className="py-2.5 border-b border-spy-border">
              <div className="text-spy-text font-semibold mb-2">Default Theme</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["dark", "light", "system"] as ThemePreference[]).map((mode) => {
                  const isSelected = defaultTheme === mode;
                  const icons = {
                    dark: <Moon className="w-3.5 h-3.5" />,
                    light: <Sun className="w-3.5 h-3.5" />,
                    system: <Laptop className="w-3.5 h-3.5" />,
                  };
                  return (
                    <button
                      key={mode}
                      onClick={() => onUpdateDefaultTheme(mode)}
                      className={`p-2 rounded-[3px] border flex flex-col items-center gap-1 uppercase tracking-wider text-[11px] transition-colors ${
                        isSelected
                          ? "bg-spy-greenMuted text-spy-green border-spy-green font-bold"
                          : "bg-spy-surface2 text-spy-muted border-spy-border hover:text-spy-text"
                      }`}
                    >
                      {icons[mode]}
                      <span>{mode}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-spy-dim mt-2 font-sans">
                Controls what theme loads by default on startup and across sessions.
              </p>
            </div>

            {/* Animations Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-spy-border">
              <div>
                <div className="text-spy-text font-semibold flex items-center gap-1.5">
                  <span>UI Animations</span>
                  {systemReducedMotion && (
                    <span className="text-[10px] text-spy-amber font-normal font-sans">(Reduced motion OS)</span>
                  )}
                </div>
                <div className="text-[10px] text-spy-dim font-sans mt-0.5">
                  Transitions, counters, layout & effects
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                className={`px-3 py-1 border rounded-[3px] font-mono font-bold text-xs transition-colors ${
                  animationsEnabled && !systemReducedMotion
                    ? "bg-spy-greenMuted text-spy-green border-spy-green"
                    : "bg-spy-surface2 text-spy-dim border-spy-border"
                }`}
              >
                {animationsEnabled && !systemReducedMotion ? "ON" : "OFF"}
              </button>
            </div>

            {/* Tactical Sound FX */}
            <div className="flex items-center justify-between py-3 border-b border-spy-border">
              <div className="flex items-center gap-2 text-spy-text">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-spy-green" />
                ) : (
                  <VolumeX className="w-4 h-4 text-spy-dim" />
                )}
                <span>Tactical Sound FX</span>
              </div>
              <button
                onClick={toggleSound}
                className={`px-3 py-1 border rounded-[3px] transition-colors ${
                  soundEnabled
                    ? "bg-spy-greenMuted text-spy-green border-spy-green"
                    : "bg-spy-surface2 text-spy-dim border-spy-border"
                }`}
              >
                {soundEnabled ? "ENABLED" : "MUTED"}
              </button>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                variant="stealth"
                size="sm"
                onClick={() => setIsSettingsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
