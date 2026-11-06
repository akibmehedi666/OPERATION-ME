"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Laptop,
  Download,
  Database,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { getRankFromXp } from "@/lib/rank";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { soundFX } from "@/lib/sound";
import { ThemePreference, ActiveTheme } from "@/lib/theme";
import { useAnimations } from "@/lib/animationContext";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LogoIcon } from "@/components/ui/LogoIcon";
import { RecurringRule, Category, NotificationSettings } from "@/types/database";
import { AutoMissionsSettings } from "@/components/settings/AutoMissionsSettings";
import { RemindersSettings } from "@/components/settings/RemindersSettings";
import { triggerDataExportDownload } from "@/lib/dataBackup";

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
  recurringRules?: RecurringRule[];
  categories?: Category[];
  notificationSettings?: NotificationSettings;
  isSupabaseConnected?: boolean;
  onToggleRecurringRule?: (ruleId: string, isActive: boolean) => void;
  onUpdateRecurringRule?: (rule: RecurringRule) => void;
  onAddRecurringRule?: (rule: Omit<RecurringRule, "id">) => void;
  onDeleteRecurringRule?: (ruleId: string) => void;
  onRunAutoMissionsGenerator?: () => { createdCount: number; message: string };
  onUpdateNotificationSettings?: (settings: NotificationSettings) => void;
  onResetAllProgress?: () => Promise<unknown>;
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
  recurringRules = [],
  categories = [],
  notificationSettings = {
    class_reminder: true,
    tuition_reminder: true,
    morning_digest: true,
    morning_digest_time: "08:00",
    streak_reminder: true,
    exam_reminder: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "23:00",
    quiet_hours_end: "07:00",
  },
  isSupabaseConnected = false,
  onToggleRecurringRule,
  onUpdateRecurringRule,
  onAddRecurringRule,
  onDeleteRecurringRule,
  onRunAutoMissionsGenerator,
  onUpdateNotificationSettings,
  onResetAllProgress,
}: AgentHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "auto_missions" | "reminders" | "data">("general");
  const [soundEnabled, setSoundEnabled] = useState(soundFX.isEnabled());
  const [exportStatus, setExportStatus] = useState<string>("");
  const [resetConfirmation, setResetConfirmation] = useState<string>("");
  const [resetStatus, setResetStatus] = useState<string>("");
  const [resetError, setResetError] = useState<string>("");
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const { animationsEnabled, setAnimationsEnabled, systemReducedMotion } = useAnimations();

  const handleExportData = () => {
    const res = triggerDataExportDownload();
    if (res.success) {
      soundFX.playTargetAcquired();
      setExportStatus(`✓ Exported ${res.itemCount} records to ${res.filename}`);
      setTimeout(() => setExportStatus(""), 6000);
    } else {
      soundFX.playWarning();
      setExportStatus("Failed to export data");
    }
  };
  const rankInfo = getRankFromXp(totalXp);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSettingsOpen]);

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
            {/* Wordmark Branding */}
            <div className="flex items-center gap-1.5 font-mono font-bold text-xs tracking-wider uppercase text-[#14663a] dark:text-spy-green mb-1 select-none">
              <LogoIcon className="w-3.5 h-3.5 shrink-0 text-[#14663a] dark:text-spy-green" />
              <span className="hidden sm:inline">OPERATION: ME</span>
              <span className="sm:hidden">OP: ME</span>
            </div>

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
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[11px] text-spy-muted font-mono uppercase">Rank:</span>
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[3px] border ${getRankBadgeClass(
                  rankInfo.rank
                )}`}
              >
                {rankInfo.rank}
              </span>
              {!isSupabaseConnected ? (
                <span
                  className="text-[10px] font-mono text-spy-amber bg-spy-amberMuted border border-spy-amber/30 px-2 py-0.5 rounded-[3px] inline-flex items-center gap-1"
                  title="Supabase env vars not detected. Data stored locally in browser."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-spy-amber" />
                  <span>Local mode: data stays on this device</span>
                </span>
              ) : (
                <span
                  className="text-[10px] font-mono text-spy-green bg-spy-green/10 border border-spy-green/30 px-2 py-0.5 rounded-[3px] inline-flex items-center gap-1"
                  title="Connected to Supabase Cloud"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-spy-green" />
                  <span>Cloud Active</span>
                </span>
              )}
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

      {/* Settings Modal (Rendered in Portal to avoid ancestor transform clipping) */}
      {isSettingsOpen && mounted && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSettingsOpen(false);
            }
          }}
        >
          <div
            className="bg-spy-surface border border-spy-border p-5 rounded-[6px] max-w-md w-full font-mono text-xs shadow-2xl max-h-[90vh] overflow-y-auto relative"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-spy-border">
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

            {/* Navigation Tabs inside Settings */}
            <div className="flex items-center gap-1 mb-4 border-b border-spy-border pb-1 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setSettingsTab("general")}
                className={`px-3 py-1 rounded-[3px] transition-colors ${
                  settingsTab === "general"
                    ? "bg-spy-green/15 text-spy-green font-bold border border-spy-green/40"
                    : "text-spy-muted hover:text-spy-text"
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("auto_missions")}
                className={`px-3 py-1 rounded-[3px] transition-colors ${
                  settingsTab === "auto_missions"
                    ? "bg-spy-green/15 text-spy-green font-bold border border-spy-green/40"
                    : "text-spy-muted hover:text-spy-text"
                }`}
              >
                Auto-Missions
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("reminders")}
                className={`px-3 py-1 rounded-[3px] transition-colors ${
                  settingsTab === "reminders"
                    ? "bg-spy-green/15 text-spy-green font-bold border border-spy-green/40"
                    : "text-spy-muted hover:text-spy-text"
                }`}
              >
                Reminders
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("data")}
                className={`px-3 py-1 rounded-[3px] transition-colors ${
                  settingsTab === "data"
                    ? "bg-spy-green/15 text-spy-green font-bold border border-spy-green/40"
                    : "text-spy-muted hover:text-spy-text"
                }`}
              >
                Data
              </button>
            </div>

            {settingsTab === "general" && (
              <>
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

                {/* Storage Engine & Data Backup */}
                <div className="py-3 border-b border-spy-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-spy-text font-semibold flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-spy-green" />
                      <span>Storage Engine</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] border ${
                        isSupabaseConnected
                          ? "bg-spy-green/15 text-spy-green border-spy-green/40 font-bold"
                          : "bg-spy-amberMuted text-spy-amber border-spy-amber/40"
                      }`}
                    >
                      {isSupabaseConnected ? "Supabase Cloud" : "Local Mode (Device Only)"}
                    </span>
                  </div>
                  <p className="text-[10px] text-spy-dim font-sans leading-relaxed">
                    {isSupabaseConnected
                      ? "Connected to isolated Supabase PostgreSQL database with Row Level Security."
                      : "Local storage mode active. All missions, courses, and logs stay on this device."}
                  </p>

                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full py-2 bg-spy-surface2 hover:bg-spy-surface border border-spy-border hover:border-spy-green text-spy-text hover:text-spy-green rounded-[3px] transition-colors flex items-center justify-center gap-2 font-mono text-xs"
                    title="Export full JSON backup of missions, courses, projects, reviews and settings"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export all data (JSON)</span>
                  </button>
                  {exportStatus && (
                    <div className="text-[10px] text-spy-green font-mono text-center">
                      {exportStatus}
                    </div>
                  )}
                </div>
              </>
            )}

            {settingsTab === "auto_missions" && onToggleRecurringRule && onUpdateRecurringRule && onAddRecurringRule && onRunAutoMissionsGenerator && (
              <AutoMissionsSettings
                rules={recurringRules}
                categories={categories}
                onToggleRule={onToggleRecurringRule}
                onUpdateRule={onUpdateRecurringRule}
                onAddRule={onAddRecurringRule}
                onDeleteRule={onDeleteRecurringRule}
                onRunGenerator={onRunAutoMissionsGenerator}
              />
            )}

            {settingsTab === "reminders" && onUpdateNotificationSettings && (
              <RemindersSettings
                settings={notificationSettings}
                onUpdateSettings={onUpdateNotificationSettings}
              />
            )}

            {settingsTab === "data" && (
              <div className="space-y-4 py-2 font-mono text-xs">
                {/* 1. Storage Status */}
                <div className="p-3 bg-spy-surface2 border border-spy-border rounded-[4px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-spy-text font-bold">Active Storage:</span>
                    <span
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] uppercase font-bold border ${
                        isSupabaseConnected
                          ? "bg-spy-green/15 text-spy-green border-spy-green/40"
                          : "bg-spy-amberMuted text-spy-amber border-spy-amber/40"
                      }`}
                    >
                      {isSupabaseConnected ? "Supabase Cloud" : "Local Mode (Device Only)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-spy-dim font-sans leading-relaxed">
                    {isSupabaseConnected
                      ? "Connected to cloud database with user-isolated Row Level Security."
                      : "Local storage mode active: all operations stay on this device."}
                  </p>
                </div>

                {/* 2. Export All Data */}
                <div className="p-3 bg-spy-surface2 border border-spy-border rounded-[4px] space-y-2">
                  <div className="font-bold text-spy-text">Data Export & Backup</div>
                  <p className="text-[11px] text-spy-dim font-sans leading-relaxed">
                    Download a full JSON offline backup before performing any resets.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full py-2 bg-spy-surface hover:bg-spy-surface2 border border-spy-border hover:border-spy-green text-spy-text hover:text-spy-green rounded-[3px] transition-colors flex items-center justify-center gap-2 font-mono text-xs"
                    title="Export JSON backup"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export all data (JSON)</span>
                  </button>
                  {exportStatus && (
                    <div className="text-[10px] text-spy-green font-mono text-center">
                      {exportStatus}
                    </div>
                  )}
                </div>

                {/* 3. Reset All Progress */}
                <div className="p-3 bg-spy-danger-surface border border-spy-red/40 rounded-[4px] space-y-3">
                  <div className="flex items-center gap-2 text-spy-red font-bold">
                    <AlertTriangle className="w-4 h-4 text-spy-red shrink-0" />
                    <span>Reset All Progress</span>
                  </div>
                  <p className="text-[11px] text-spy-red font-sans leading-relaxed">
                    Deletes all demo missions, completion history, XP (resets to 0), streak (resets to 0), Codeforces logs & handle, lecture logs, papers, side projects, and notes.
                  </p>
                  <p className="text-[11px] text-spy-muted font-sans">
                    <strong>Preserved:</strong> Timetable routine, course catalog, weekly time-blocks, academic calendar, auto-mission rules, and theme preferences.
                  </p>

                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="text-[11px] text-spy-amber hover:underline flex items-center gap-1 font-mono"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export all data first before resetting</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-spy-red/20">
                    <label className="block text-[11px] text-spy-text font-sans">
                      To confirm, type <span className="font-mono font-bold text-spy-red">&quot;RESET&quot;</span>:
                    </label>
                    <input
                      type="text"
                      value={resetConfirmation}
                      onChange={(e) => setResetConfirmation(e.target.value)}
                      placeholder="RESET"
                      className="w-full bg-spy-surface border border-spy-red/40 rounded-[3px] px-2.5 py-1.5 text-xs font-mono text-spy-text focus:outline-none focus:border-spy-red"
                    />
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    disabled={resetConfirmation.trim() !== "RESET" || isResetting}
                    onClick={async () => {
                      if (resetConfirmation.trim() !== "RESET") return;
                      setIsResetting(true);
                      setResetStatus("");
                      setResetError("");
                      try {
                        if (onResetAllProgress) {
                          const res = await onResetAllProgress();
                          if (res && typeof res === "object" && "success" in res && !res.success) {
                            const errMessage =
                              "error" in res && typeof res.error === "string"
                                ? res.error
                                : "Reset operation failed on cloud tables";
                            setResetError(errMessage);
                            soundFX.playWarning();
                          } else {
                            setResetStatus("Progress reset complete. Routine & structure preserved!");
                            soundFX.playMissionAccomplished();
                          }
                        }
                      } catch (err: unknown) {
                        const errMessage = err instanceof Error ? err.message : "Reset operation encountered an error";
                        setResetError(errMessage);
                        soundFX.playWarning();
                      } finally {
                        setResetConfirmation("");
                        setIsResetting(false);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isResetting ? "Resetting..." : "Reset all progress"}</span>
                  </Button>

                  {resetStatus && (
                    <div className="text-[10px] text-spy-green font-mono text-center mt-2 p-1.5 bg-spy-green/10 border border-spy-green/30 rounded-[3px]">
                      {resetStatus}
                    </div>
                  )}

                  {resetError && (
                    <div role="alert" className="text-[10px] text-spy-red font-mono text-center mt-2 p-2 bg-spy-redMuted border border-spy-red/40 rounded-[3px] leading-relaxed">
                      ⚠️ {resetError}
                    </div>
                  )}
                </div>
              </div>
            )}

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
        </div>,
        document.body
      )}
    </div>
  );
}
