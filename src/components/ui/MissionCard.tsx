"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Clock, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  Crosshair,
  FileText,
  Target
} from "lucide-react";
import { Mission, Category } from "@/types/database";
import { formatDueText } from "@/lib/formatters";
import { getCategoryTheme } from "@/lib/categoryTheme";
import { useAnimations } from "@/lib/animationContext";
import { Button } from "./Button";

interface MissionCardProps {
  mission: Mission;
  category?: Category;
  isHero?: boolean;
  onComplete?: (mission: Mission) => void;
  onEdit?: (mission: Mission) => void;
  onDelete?: (mission: Mission) => void;
  onSetActive?: (mission: Mission) => void;
  onEditNote?: (mission: Mission) => void;
  isAccomplishing?: boolean;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  category,
  isHero = false,
  onComplete,
  onEdit,
  onDelete,
  onSetActive,
  onEditNote,
  isAccomplishing = false,
}) => {
  const { isMotionActive } = useAnimations();
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = mission.status === "completed";
  const catTheme = getCategoryTheme(category?.name || category?.codename);

  // Typewriter and scan-line sweep for new mission assigned
  const [displayedTitle, setDisplayedTitle] = useState(mission.title);
  const [showSweep, setShowSweep] = useState(false);
  const prevIdRef = useRef(mission.id);

  useEffect(() => {
    if (!isHero) {
      setDisplayedTitle(mission.title);
      return;
    }

    if (prevIdRef.current !== mission.id) {
      prevIdRef.current = mission.id;
      if (isMotionActive) {
        setShowSweep(true);
        const sweepTimer = setTimeout(() => setShowSweep(false), 750);

        const targetText = mission.title;
        let charIdx = 0;
        const stepTime = Math.max(12, Math.floor(600 / Math.max(targetText.length, 1)));
        setDisplayedTitle("");

        const interval = setInterval(() => {
          charIdx++;
          setDisplayedTitle(targetText.slice(0, charIdx));
          if (charIdx >= targetText.length) {
            clearInterval(interval);
          }
        }, stepTime);

        return () => {
          clearTimeout(sweepTimer);
          clearInterval(interval);
        };
      } else {
        setDisplayedTitle(mission.title);
      }
    } else {
      setDisplayedTitle(mission.title);
    }
  }, [mission.id, mission.title, isHero, isMotionActive]);

  // Use 12-hour unified due text (uses deadline or scheduled end time if no deadline)
  const dueInfo = formatDueText(mission.deadline || mission.scheduled_end);

  // Priority left border styling (small colored left border)
  const getBorderLeftClass = () => {
    if (dueInfo.isOverdue && !isCompleted) return "border-l-[3px] border-l-spy-red";
    switch (mission.priority) {
      case "urgent":
        return "border-l-[3px] border-l-spy-red";
      case "high":
        return "border-l-[3px] border-l-spy-amber";
      case "medium":
        return "border-l-[3px] border-l-spy-green";
      case "low":
      default:
        return "border-l-[3px] border-l-spy-borderLight";
    }
  };

  // If this is the Hero Active Mission card
  if (isHero) {
    return (
      <div className={`active-mission-card p-5 sm:p-6 transition-all duration-200 relative ${isAccomplishing ? "border-spy-green" : ""}`}>
        {/* Brief green scan-line sweep across the card on assignment */}
        {showSweep && <div className="scanline-sweep" />}

        {/* Floating +XP text during accomplishment */}
        {isAccomplishing && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: -32 }}
            transition={{ type: "tween", duration: 0.45, ease: "easeOut" }}
            className="absolute top-3 right-6 font-mono font-bold text-xs text-spy-amber bg-spy-amberMuted border border-spy-amber/40 px-2.5 py-0.5 rounded-[3px] pointer-events-none z-40 shadow-sm"
          >
            +{mission.xp || 50} XP
          </motion.div>
        )}

        {/* Accomplished thump overlay */}
        {isAccomplishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-[1px] rounded-[6px]"
          >
            <div className="stamp-thump-shake">
              <motion.div
                initial={{ scale: 1.6, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-spy-surface border-2 border-spy-green flex items-center justify-center text-spy-green shadow-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                    <motion.path
                      d="M5 13l4 4L19 7"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </svg>
                </div>
                <span className="rubber-stamp rubber-stamp-green text-xs sm:text-sm tracking-widest font-black shadow-xl">
                  ★ MISSION ACCOMPLISHED ★
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Header line: Rubber Stamp + Category + Due Time */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="rubber-stamp rubber-stamp-green text-[10px] inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-spy-green animate-pulse dark:inline-block hidden" />
              <span>ACTIVE MISSION</span>
            </span>
            {category && (
              <span className={`text-xs px-2.5 py-0.5 rounded-[3px] border font-medium ${catTheme.chipClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${catTheme.dotClass}`} />
                {category.name}
              </span>
            )}
          </div>

          {dueInfo.text && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                dueInfo.isOverdue ? "text-spy-red font-semibold" : "text-spy-muted"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{dueInfo.text}</span>
            </div>
          )}
        </div>

        {/* Title (with typewriter effect on new assignment) */}
        <h2 className="text-lg sm:text-xl font-medium text-spy-text mb-3 leading-snug min-h-[1.75rem]">
          {displayedTitle}
        </h2>

        {/* Notes (visible on hero) */}
        {mission.notes && (
          <p className="text-sm text-spy-text leading-relaxed bg-spy-surface2 border border-spy-border p-3.5 rounded-[4px] mb-5">
            {mission.notes}
          </p>
        )}

        {/* Footer: Accomplish button + Details toggle */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-spy-border">
          <div className="flex items-center gap-3 text-xs text-spy-muted font-mono">
            <span>[{mission.codename}]</span>
            <span className="text-spy-dim">+{mission.xp} XP</span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(mission)}
                className="p-2 text-spy-muted hover:text-spy-text border border-transparent hover:border-spy-border rounded-[3px] transition-colors"
                title="Edit Mission"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {onComplete && (
              <Button
                variant="primary"
                size="md"
                onClick={() => onComplete(mission)}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Accomplish</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard Mission Card (aligned grid with layout animations)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={
        isAccomplishing
          ? { opacity: 0, scale: 0.95, height: 0, overflow: "hidden", marginBottom: 0 }
          : { opacity: 1, y: 0, height: "auto" }
      }
      transition={{ duration: isAccomplishing ? 0.35 : 0.25 }}
      className={`group clean-card relative transition-all duration-150 ${getBorderLeftClass()} ${
        dueInfo.isOverdue && !isCompleted ? "bg-spy-redMuted" : ""
      } ${isCompleted ? "opacity-60" : ""} ${isAccomplishing ? "border-spy-green bg-spy-green/10" : ""}`}
    >
      {/* Floating +XP on accomplish */}
      {isAccomplishing && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -26 }}
          transition={{ type: "tween", duration: 0.45, ease: "easeOut" }}
          className="absolute -top-3 right-4 font-mono font-bold text-xs text-spy-amber bg-spy-amberMuted border border-spy-amber/40 px-2 py-0.5 rounded-[3px] pointer-events-none z-40 shadow-sm"
        >
          +{mission.xp || 50} XP
        </motion.div>
      )}

      {/* Thumping Accomplished Stamp Overlay */}
      {isAccomplishing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-[6px]"
        >
          <div className="stamp-thump-shake">
            <motion.div
              initial={{ scale: 1.6, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: -2, opacity: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 20 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-spy-surface border border-spy-green flex items-center justify-center text-spy-green shadow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <motion.path
                    d="M5 13l4 4L19 7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </svg>
              </div>
              <span className="rubber-stamp rubber-stamp-green text-[10px] tracking-widest font-black shadow-md">
                ★ MISSION ACCOMPLISHED ★
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}

      <div className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Category Icon Tile */}
          <div
            className={`p-2 rounded-[4px] border shrink-0 ${catTheme.iconTileClass}`}
            title={category?.name || "Target"}
          >
            <Target className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>

          {/* Main Info: Title + Category + Due Time */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Category (Soft tint bg + darker text of same hue) */}
              {category && (
                <span className={`text-[11px] px-2 py-0.5 rounded-[3px] border inline-flex items-center gap-1.5 font-medium ${catTheme.chipClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${catTheme.dotClass}`} />
                  {category.name}
                </span>
              )}

              {/* Rubber Stamp for Overdue or regular Due time in 12-hour format */}
              {dueInfo.isOverdue && !isCompleted ? (
                <span className="rubber-stamp rubber-stamp-red text-[10px] overdue-pulse">
                  OVERDUE {dueInfo.text.replace("Overdue ", "")}
                </span>
              ) : dueInfo.text ? (
                <span className="text-xs inline-flex items-center gap-1 text-spy-muted font-mono">
                  <Clock className="w-3 h-3 text-spy-dim" />
                  {dueInfo.text}
                </span>
              ) : null}
            </div>

            {/* Title (Clean Sans-Serif, minimum 14px) */}
            <h3
              className={`text-sm sm:text-base font-medium text-spy-text leading-snug truncate ${
                isCompleted ? "line-through text-spy-dim" : ""
              }`}
            >
              {mission.title}
            </h3>
          </div>

          {/* Action Button: Accomplish (Single visible button) */}
          <div className="flex items-center gap-2 shrink-0">
            {!isCompleted && onComplete && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onComplete(mission)}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Accomplish</span>
              </Button>
            )}

            {/* Details expand toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-spy-muted hover:text-spy-text transition-colors"
              title={isExpanded ? "Hide details" : "Show details"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Revealed details on expand */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="pt-3 mt-3 border-t border-spy-border text-xs text-spy-muted space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-spy-muted">[{mission.codename}]</span>
                <span className="text-spy-muted">+{mission.xp} XP</span>
              </div>

              {mission.notes && (
                <div className="p-2.5 bg-spy-surface2 border border-spy-border rounded-[3px] text-spy-text font-sans">
                  {mission.notes}
                </div>
              )}

              {/* Debrief Record for completed missions */}
              {isCompleted && (
                <div className="p-2.5 bg-spy-surface2 border border-spy-border rounded-[3px] flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-spy-green shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-mono text-spy-dim uppercase tracking-wider">
                        Debrief Record
                      </div>
                      <div className="text-xs text-spy-text mt-0.5">
                        {mission.time_spent_minutes && (
                          <span className="font-semibold text-spy-green font-mono mr-1.5">
                            {mission.time_spent_minutes} min &middot;
                          </span>
                        )}
                        <span>{mission.completion_note || "No debrief note recorded."}</span>
                      </div>
                    </div>
                  </div>

                  {onEditNote && (
                    <button
                      onClick={() => onEditNote(mission)}
                      className="p-1 text-spy-muted hover:text-spy-green shrink-0"
                      title="Edit Debrief Record"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                {onSetActive && mission.status !== "active" && !isCompleted && (
                  <button
                    onClick={() => onSetActive(mission)}
                    className="px-2.5 py-1 text-xs font-mono text-spy-green hover:underline flex items-center gap-1"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Set as Active
                  </button>
                )}

                {onEdit && (
                  <button
                    onClick={() => onEdit(mission)}
                    className="p-1.5 text-spy-muted hover:text-spy-text"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(mission)}
                    className="p-1.5 text-spy-muted hover:text-spy-red"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
