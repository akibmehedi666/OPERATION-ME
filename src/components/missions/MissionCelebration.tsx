"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, ArrowRight, Sparkles, Flame, FileText } from "lucide-react";
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
          particleCount: 40,
          spread: 60,
          origin: { y: 0.65 },
          colors: ["#1f7a4d", "#b7791f", "#ffffff"],
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md p-6 bg-spy-surface border border-spy-border rounded-[6px] shadow-2xl text-spy-text"
        >
          {/* Top Stamp Slam Animation */}
          <div className="text-center mb-5 flex flex-col items-center gap-2">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 450, damping: 20 }}
              className="w-10 h-10 rounded-full bg-spy-green/15 border-2 border-spy-green flex items-center justify-center text-spy-green"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </motion.div>
            <motion.div
              initial={{ scale: 2.2, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="inline-block"
            >
              <span className="rubber-stamp rubber-stamp-green text-sm sm:text-base px-3 py-1 tracking-widest font-black">
                ★ MISSION ACCOMPLISHED ★
              </span>
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-base sm:text-lg font-medium text-spy-text mb-1 leading-snug text-center">
            {completedMission.title}
          </h2>
          <div className="text-xs font-mono text-spy-muted mb-4 text-center">
            [{completedMission.codename}]
          </div>

          {/* Debrief Note if present */}
          {(completedMission.completion_note || completedMission.time_spent_minutes) && (
            <div className="bg-spy-surface2 border border-spy-border p-3 rounded-[4px] mb-4 text-xs font-sans flex items-start gap-2">
              <FileText className="w-4 h-4 text-spy-green shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[10px] text-spy-dim uppercase tracking-wider block">
                  Debrief Recorded
                </span>
                <span className="text-spy-text">
                  {completedMission.time_spent_minutes && (
                    <span className="font-semibold text-spy-green font-mono mr-1">
                      {completedMission.time_spent_minutes} min &middot;
                    </span>
                  )}
                  {completedMission.completion_note}
                </span>
              </div>
            </div>
          )}

          {/* XP & Streak Stat Box */}
          <div className="grid grid-cols-2 gap-3 bg-spy-surface2 border border-spy-border p-3 rounded-[4px] mb-5 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-spy-amber shrink-0" />
              <div>
                <div className="text-spy-muted text-[11px]">XP Awarded</div>
                <div className="font-mono font-bold text-spy-amber">+{completedMission.xp} XP</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-spy-amber shrink-0" />
              <div>
                <div className="text-spy-muted text-[11px]">Daily Streak</div>
                <div className="font-mono font-bold text-spy-amber">Active</div>
              </div>
            </div>
          </div>

          {/* Next Mission Section */}
          {nextMission ? (
            <div className="bg-spy-surface2 border border-spy-border p-3.5 rounded-[4px] mb-5 text-left">
              <div className="text-[11px] font-mono text-spy-green uppercase tracking-wider mb-1 font-bold">
                Next Target Acquired
              </div>
              <div className="text-sm font-medium text-spy-text line-clamp-2">
                {nextMission.title}
              </div>
              <div className="text-xs font-mono text-spy-muted mt-1">
                [{nextMission.codename}] &middot; Priority: {nextMission.priority}
              </div>
            </div>
          ) : (
            <p className="text-xs text-spy-muted font-mono mb-5 text-center">
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
