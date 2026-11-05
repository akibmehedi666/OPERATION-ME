"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Crosshair, Sparkles, ShieldCheck, Flame, ArrowRight } from "lucide-react";
import { Mission } from "@/types/database";
import { StampLabel } from "@/components/ui/StampLabel";
import { soundFX } from "@/lib/sound";

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

      // Launch green + gold tactical confetti
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00ff66", "#ffb700", "#00f0ff", "#ffffff"],
        });
      } catch {
        // Safe catch
      }

      // If next mission acquired, play radar sound after short delay
      if (nextMission) {
        const timer = setTimeout(() => {
          soundFX.playTargetAcquired();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, completedMission, nextMission]);

  if (!isOpen || !completedMission) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg p-6 sm:p-8 bg-spy-surface border-2 border-spy-green shadow-[0_0_50px_rgba(0,255,102,0.3)] tactical-card text-center font-mono"
        >
          {/* Top Classified Header */}
          <div className="flex items-center justify-between text-xs text-spy-dim mb-4 border-b border-spy-border/60 pb-2">
            <span className="flex items-center gap-1.5 text-spy-green font-bold">
              <ShieldCheck className="w-4 h-4 text-spy-green" />
              AGENCY DISPATCH // CLASSIFIED
            </span>
            <span className="text-[10px] bg-slate-900 px-2 py-0.5 border border-slate-700">
              STATUS: RECORDED
            </span>
          </div>

          {/* Massive Slammed Stamp */}
          <motion.div
            initial={{ scale: 3, opacity: 0, rotate: -25 }}
            animate={{ scale: 1, opacity: 1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="my-6"
          >
            <StampLabel
              text="MISSION ACCOMPLISHED"
              variant="green"
              size="lg"
              rotate={-5}
            />
          </motion.div>

          {/* Completed Mission Title */}
          <h2 className="text-lg sm:text-xl font-black text-spy-text tracking-wide mb-1">
            {completedMission.title}
          </h2>
          <p className="text-xs text-spy-green tracking-widest uppercase mb-4">
            [{completedMission.codename || "DIRECTIVE"}]
          </p>

          {/* XP & Rewards Bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 bg-black/50 border border-spy-border p-3 mb-6"
          >
            <div className="flex items-center justify-center gap-2 border-r border-spy-border/50">
              <Sparkles className="w-4 h-4 text-spy-amber animate-pulse" />
              <div className="text-left">
                <div className="text-[10px] text-spy-dim">XP AUTHORIZED</div>
                <div className="text-sm sm:text-base font-bold text-spy-amber">
                  +{completedMission.xp} XP
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
              <div className="text-left">
                <div className="text-[10px] text-spy-dim">DAILY STREAK</div>
                <div className="text-sm sm:text-base font-bold text-orange-400">
                  MAINTAINED
                </div>
              </div>
            </div>
          </motion.div>

          {/* Next Target Acquired Section */}
          {nextMission ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-spy-card border border-spy-amber/50 p-4 text-left relative overflow-hidden mb-6"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-spy-amber uppercase tracking-widest mb-1.5">
                <Crosshair className="w-4 h-4 animate-spin text-spy-amber" />
                <span>NEXT TARGET ACQUIRED</span>
                <span className="w-2 h-2 rounded-full bg-spy-amber animate-ping ml-auto" />
              </div>

              <div className="text-sm font-bold text-spy-text line-clamp-2">
                {nextMission.title}
              </div>

              <div className="flex items-center justify-between text-xs text-spy-dim mt-2 pt-2 border-t border-slate-800">
                <span className="text-spy-green">[{nextMission.codename}]</span>
                <span className="uppercase text-[11px] font-bold text-amber-400">
                  PRIORITY: {nextMission.priority}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="text-xs text-slate-500 py-3 mb-4">
              ALL DIRECTIVES EXECUTED. AWAITING FURTHER AGENCY ORDERS.
            </div>
          )}

          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-spy-green text-black font-bold text-xs uppercase tracking-widest hover:bg-[#00e65c] transition-colors flex items-center justify-center gap-2"
          >
            <span>CONFIRM ACKNOWLEDGMENT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

