"use client";

import React, { useState } from "react";
import { 
  Plus, 
  LogOut, 
  Flame, 
  Settings, 
  Volume2, 
  VolumeX, 
  X 
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

export function AgentHeader({
  agentName = "Agent Akib",
  totalXp,
  streak,
  onQuickAdd,
  onLogout,
}: AgentHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundFX.isEnabled());
  const rankInfo = getRankFromXp(totalXp);

  const toggleSound = () => {
    const newState = soundFX.toggleSound();
    setSoundEnabled(newState);
  };

  return (
    <div className="clean-card p-4 sm:p-5 mb-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Agent name & Rank */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[4px] bg-[#141d18] border border-spy-border flex items-center justify-center font-mono font-bold text-spy-green">
            AK
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-mono font-bold text-white tracking-wide">
              {agentName}
            </h1>
            <div className="text-xs text-slate-400 font-mono">
              RANK: <span className="text-slate-200">{rankInfo.rank.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Right: XP Progress Bar + Streak + New Mission Button + Settings + Logout */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
          {/* XP Bar */}
          <div className="w-40 sm:w-48">
            <ProgressBar
              value={rankInfo.progress}
              label={`${totalXp} XP`}
              sublabel={rankInfo.xpToNext > 0 ? `${rankInfo.xpToNext} to next` : "MAX"}
              size="sm"
            />
          </div>

          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-950/20 border border-amber-800/30 px-2.5 py-1 rounded-[3px]">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{streak} {streak === 1 ? "day" : "days"}</span>
          </div>

          {/* Actions: ONE New Mission button only + Settings + Logout */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onQuickAdd}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Mission</span>
            </Button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white border border-spy-border hover:border-spy-borderLight rounded-[3px] transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-spy-red border border-spy-border hover:border-spy-borderLight rounded-[3px] transition-colors"
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
          <div className="bg-[#111714] border border-spy-border p-5 rounded-[6px] max-w-sm w-full font-mono text-xs">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-spy-border">
              <span className="font-bold text-slate-200">SETTINGS</span>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-slate-300">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-spy-green" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span>Tactical Sound FX</span>
              </div>
              <button
                onClick={toggleSound}
                className={`px-3 py-1 border rounded-[3px] transition-colors ${
                  soundEnabled
                    ? "bg-spy-green/10 text-spy-green border-spy-green/40"
                    : "bg-slate-900 text-slate-400 border-slate-700"
                }`}
              >
                {soundEnabled ? "ENABLED" : "MUTED"}
              </button>
            </div>

            <div className="pt-4 mt-2 border-t border-spy-border flex justify-end">
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
