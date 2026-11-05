"use client";

import React, { useState } from "react";
import { 
  Shield, 
  Flame, 
  Volume2, 
  VolumeX, 
  Plus, 
  LogOut, 
  Terminal,
  Award
} from "lucide-react";
import { getRankFromXp } from "@/lib/rank";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { soundFX } from "@/lib/sound";

interface AgentHeaderProps {
  agentName?: string;
  totalXp: number;
  streak: number;
  onQuickAdd: () => void;
  onLogout: () => void;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({
  agentName = "Agent Akib",
  totalXp,
  streak,
  onQuickAdd,
  onLogout,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundFX.isEnabled());
  const rankInfo = getRankFromXp(totalXp);

  const toggleSound = () => {
    const newState = soundFX.toggleSound();
    setSoundEnabled(newState);
    if (newState) soundFX.playBlip();
  };

  return (
    <header className="tactical-card bg-spy-surface border-b border-spy-border p-4 sm:p-5 font-mono text-spy-text mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Agent Profile & Callout */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 bg-black/80 border-2 border-spy-green flex items-center justify-center text-spy-green shadow-spy-green">
              <Shield className="w-6 h-6 text-spy-green" />
            </div>
            {/* Pulsing online status pip */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-spy-green rounded-full border-2 border-black animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-spy-green rounded-full border-2 border-black" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wider flex items-center gap-1.5">
                <span>OPERATION: ME</span>
                <span className="text-spy-green">{"//"}</span>
                <span className="text-spy-green text-glow-green">{agentName}</span>
              </h1>
              <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 text-slate-400 font-bold uppercase">
                SINGLE-OPERATIVE CELL
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-spy-dim mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-spy-green" />
                CLEARANCE:{" "}
                <span className="text-white font-bold" style={{ color: rankInfo.badgeColor }}>
                  {rankInfo.clearanceLevel}
                </span>
              </span>

              <span className="text-slate-600">|</span>

              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                RANK: {rankInfo.rank.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Streak, XP Progress, Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          {/* Daily Streak Indicator */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-black/60 border border-orange-500/30">
            <div className="p-1.5 bg-orange-950/60 border border-orange-500/50">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400">
                DAILY STREAK
              </div>
              <div className="text-sm font-black text-orange-400 tracking-wider">
                {streak} {streak === 1 ? "DAY" : "DAYS"} ACTIVE
              </div>
            </div>
          </div>

          {/* XP & Rank Clearance Meter */}
          <div className="w-full sm:w-48 lg:w-56">
            <ProgressBar
              value={rankInfo.progress}
              label={`XP: ${totalXp}`}
              sublabel={rankInfo.xpToNext > 0 ? `${rankInfo.xpToNext} TO NEXT TIER` : "MAX CLEARANCE"}
              variant="green"
              size="sm"
            />
          </div>

          {/* Action buttons: Sound toggle, Quick Add, Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 border transition-colors ${
                soundEnabled
                  ? "bg-spy-green/10 text-spy-green border-spy-green/40 hover:bg-spy-green/20"
                  : "bg-black/60 text-slate-500 border-slate-800 hover:text-slate-400"
              }`}
              title={soundEnabled ? "Tactical Audio: ACTIVE" : "Tactical Audio: MUTED"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-spy-green" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Quick-Add Button (Always visible) */}
            <Button
              variant="primary"
              size="sm"
              onClick={onQuickAdd}
              className="shadow-spy-green"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">NEW TARGET</span>
            </Button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-spy-red hover:bg-spy-red/10 border border-slate-800 hover:border-spy-red/40 transition-colors"
              title="Terminate Secure Session (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

