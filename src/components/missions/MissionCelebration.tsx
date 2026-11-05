"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, ArrowRight, Sparkles, Flame } from "lucide-react";
import { Mission } from "@/types/database";
import { soundFX } from "@/lib/sound";
import { Button } from "@/components/ui/Button";

interface MissionCelebrationProps {
  completedMission: Mission | null;
  nextMission: Mission | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MissionCelebration: React.FC<MissionCelebrationProps> = ({
  completedMission,
  nextMission,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && completedMission) {
      soundFX.playMissionAccomplished();

      // Gentle celebratory confetti
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.65 },
          colors: ["#00ff66", "#f59e0b", "#ffffff"],
        });
      } catch {
        // Safe catch
      }

      if (nextMission) {
        const timer = setTimeout(() => {
          soundFX.playTargetAcquired();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, completedMission, nextMission]);

  if (!isOpen || !completedMission) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md p-6 bg-[#111714] border border-spy-border rounded-[6px] shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-spy-green mb-4 pb-2 border-b border-spy-border">
            <Check className="w-4 h-4 text-spy-green stroke-[2.5]" />
            <span>Mission Accomplished</span>
          </div>

          {/* Title */}
          <h2 className="text-base sm:text-lg font-medium text-white mb-1 leading-snug">
            {completedMission.title}
          </h2>
          <div className="text-xs font-mono text-slate-400 mb-5">
            [{completedMission.codename}]
          </div>

          {/* XP & Streak Stat Box */}
          <div className="grid grid-cols-2 gap-3 bg-[#141d18] border border-spy-border p-3 rounded-[4px] mb-5 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[11px]">XP Awarded</div>
                <div className="font-mono font-bold text-amber-400">+{completedMission.xp} XP</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <div className="text-slate-400 text-[11px]">Daily Streak</div>
                <div className="font-mono font-bold text-amber-400">Active</div>
              </div>
            </div>
          </div>

          {/* Next Mission Section */}
          {nextMission ? (
            <div className="bg-[#141d18] border border-spy-border p-3.5 rounded-[4px] mb-5 text-left">
              <div className="text-[11px] font-mono text-spy-green uppercase tracking-wider mb-1">
                Next Target Acquired
              </div>
              <div className="text-sm font-medium text-slate-200 line-clamp-2">
                {nextMission.title}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                [{nextMission.codename}] &middot; Priority: {nextMission.priority}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-mono mb-5">
              All primary objectives cleared.
            </p>
          )}

          {/* Dismiss button */}
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
