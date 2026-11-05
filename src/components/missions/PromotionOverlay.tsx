"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import { soundFX } from "@/lib/sound";

interface PromotionOverlayProps {
  isOpen: boolean;
  newRank: string;
  onClose: () => void;
}

export const PromotionOverlay: React.FC<PromotionOverlayProps> = ({
  isOpen,
  newRank,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundFX.playTargetAcquired();

      // Celebratory confetti burst for promotion
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#1f7a4d", "#b7791f", "#14b8a6", "#ffffff"],
        });
      } catch {
        // Safe catch
      }

      const timer = setTimeout(() => {
        onClose();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm cursor-pointer select-none"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm p-6 sm:p-7 clean-card text-center border-2 border-spy-green shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 text-spy-muted hover:text-spy-text p-1 rounded-[3px]"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Stamp Label */}
          <div className="mb-4">
            <span className="rubber-stamp rubber-stamp-green text-xs tracking-widest font-black px-3 py-1">
              ★ PROMOTION ★
            </span>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 18 }}
            className="w-16 h-16 rounded-full bg-spy-green/15 border-2 border-spy-green mx-auto flex items-center justify-center text-spy-green mb-3.5 shadow-sm"
          >
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </motion.div>

          <div className="text-xs font-mono text-spy-dim uppercase tracking-wider mb-1">
            SECURITY CLEARANCE ADVANCED
          </div>

          <h2 className="text-xl sm:text-2xl font-mono font-bold text-spy-text tracking-wide mb-2">
            {newRank.toUpperCase()}
          </h2>

          <p className="text-xs text-spy-muted font-sans max-w-xs mx-auto mb-4">
            Command has recognized your tactical effectiveness. Higher priority operations unlocked.
          </p>

          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-spy-amber bg-spy-amberMuted border border-spy-border px-3 py-1.5 rounded-[3px] w-fit mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-spy-amber" />
            <span>OPERATIVE LEVEL {newRank === "Director" ? "5" : newRank === "Elite" ? "3" : "2"}</span>
          </div>

          {/* 2.5s progress countdown line */}
          <div className="w-full bg-spy-surface2 h-1 rounded-full overflow-hidden mt-5">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="h-full bg-spy-green"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
