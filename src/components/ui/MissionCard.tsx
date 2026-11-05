"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Clock, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  Crosshair
} from "lucide-react";
import { Mission, Category } from "@/types/database";
import { Button } from "./Button";

interface MissionCardProps {
  mission: Mission;
  category?: Category;
  isHero?: boolean;
  onComplete?: (mission: Mission) => void;
  onEdit?: (mission: Mission) => void;
  onDelete?: (mission: Mission) => void;
  onSetActive?: (mission: Mission) => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  category,
  isHero = false,
  onComplete,
  onEdit,
  onDelete,
  onSetActive,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const now = new Date();
  const deadlineDate = mission.deadline ? new Date(mission.deadline) : null;
  const isOverdue = deadlineDate ? deadlineDate < now && mission.status !== "completed" : false;
  const isCompleted = mission.status === "completed";

  // Calculate clean due text
  const getDueText = () => {
    if (!deadlineDate) return null;
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const overdueHours = Math.abs(diffHours);
      if (overdueHours < 24) return `Overdue ${overdueHours}h`;
      return `Overdue ${Math.abs(diffDays)}d`;
    }

    if (diffHours === 0) return "Due within an hour";
    if (diffHours < 24) return `Due in ${diffHours}h`;
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays}d`;
  };

  const dueText = getDueText();

  // Priority left border styling (small colored left border)
  const getBorderLeftClass = () => {
    if (isOverdue) return "border-l-[3px] border-l-spy-red";
    switch (mission.priority) {
      case "urgent":
        return "border-l-[3px] border-l-spy-red";
      case "high":
        return "border-l-[3px] border-l-spy-amber";
      case "medium":
        return "border-l-[3px] border-l-spy-green";
      case "low":
      default:
        return "border-l-[3px] border-l-slate-700";
    }
  };

  // If this is the Hero Active Mission card
  if (isHero) {
    return (
      <div className="active-mission-card p-6 transition-all duration-200">
        {/* Header line: Category + Due Time */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-spy-green animate-pulse" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-spy-green">
              Active Mission
            </span>
            {category && (
              <span className="text-xs text-slate-400 bg-[#16201b] border border-[#23332a] px-2 py-0.5 rounded-[3px]">
                {category.name}
              </span>
            )}
          </div>

          {dueText && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                isOverdue ? "text-spy-red" : "text-slate-400"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{dueText}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-medium text-slate-100 mb-3 leading-snug">
          {mission.title}
        </h2>

        {/* Notes (visible on hero) */}
        {mission.notes && (
          <p className="text-sm text-slate-300 leading-relaxed bg-[#111714] border border-spy-border p-3.5 rounded-[4px] mb-5">
            {mission.notes}
          </p>
        )}

        {/* Footer: Accomplish button + Details toggle */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-spy-border">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>[{mission.codename}]</span>
            <span className="text-slate-500">+{mission.xp} XP</span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(mission)}
                className="p-2 text-slate-400 hover:text-white border border-transparent hover:border-spy-border rounded-[3px] transition-colors"
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

  // Standard Mission Card (Queue & Compact lists)
  return (
    <div
      className={`group clean-card transition-all duration-150 ${getBorderLeftClass()} ${
        isCompleted ? "opacity-50" : ""
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Info: Title + Category + Due Time */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              {/* Category (Neutral gray badge) */}
              {category && (
                <span className="text-xs text-slate-300 bg-[#16201b] border border-[#23332a] px-2 py-0.5 rounded-[3px] inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {category.name}
                </span>
              )}

              {/* Due time */}
              {dueText && (
                <span
                  className={`text-xs inline-flex items-center gap-1 ${
                    isOverdue ? "text-spy-red font-medium" : "text-slate-400"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {dueText}
                </span>
              )}
            </div>

            {/* Title (Clean Sans-Serif, minimum 14px, relaxed line height) */}
            <h3
              className={`text-sm sm:text-base font-medium text-slate-100 leading-snug ${
                isCompleted ? "line-through text-slate-500" : ""
              }`}
            >
              {mission.title}
            </h3>
          </div>

          {/* Action Button: Accomplish (Single visible button) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {!isCompleted && onComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onComplete(mission)}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Accomplish</span>
              </Button>
            )}

            {/* Details expand toggle (reveals codename, XP, notes, edit/delete) */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
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

        {/* Revealed details on hover (desktop) or expand (mobile/click) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 mt-3 border-t border-spy-border text-xs text-slate-400 space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">[{mission.codename}]</span>
                <span className="text-slate-400">+{mission.xp} XP</span>
              </div>

              {mission.notes && (
                <div className="bg-[#0e1411] p-3 rounded-[3px] text-slate-300 leading-relaxed font-sans text-xs">
                  {mission.notes}
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
                    className="p-1.5 text-slate-400 hover:text-white"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(mission)}
                    className="p-1.5 text-slate-400 hover:text-spy-red"
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
    </div>
  );
};
