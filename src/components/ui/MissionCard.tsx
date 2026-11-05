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
import { formatDueText } from "@/lib/formatters";
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
  const isCompleted = mission.status === "completed";

  // Use 12-hour unified due text
  const dueInfo = formatDueText(mission.deadline);

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
        return "border-l-[3px] border-l-slate-700";
    }
  };

  // If this is the Hero Active Mission card
  if (isHero) {
    return (
      <div className="active-mission-card p-5 sm:p-6 transition-all duration-200">
        {/* Header line: Category + Due Time */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-spy-green animate-pulse" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-spy-green">
              Active Mission
            </span>
            {category && (
              <span className="text-xs text-slate-300 bg-[#16201b] border border-[#23332a] px-2 py-0.5 rounded-[3px]">
                {category.name}
              </span>
            )}
          </div>

          {dueInfo.text && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                dueInfo.isOverdue ? "text-spy-red" : "text-slate-400"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{dueInfo.text}</span>
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

  // Standard Mission Card (aligned grid)
  return (
    <div
      className={`group clean-card transition-all duration-150 ${getBorderLeftClass()} ${
        isCompleted ? "opacity-50" : ""
      }`}
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Main Info: Title + Category + Due Time */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Category (Neutral gray chip) */}
              {category && (
                <span className="text-[11px] text-slate-300 bg-[#16201b] border border-[#23332a] px-1.5 py-0.5 rounded-[2px] inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {category.name}
                </span>
              )}

              {/* Due time in 12-hour format */}
              {dueInfo.text && (
                <span
                  className={`text-xs inline-flex items-center gap-1 ${
                    dueInfo.isOverdue ? "text-spy-red font-semibold" : "text-slate-400 font-mono"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {dueInfo.text}
                </span>
              )}
            </div>

            {/* Title (Clean Sans-Serif, minimum 14px) */}
            <h3
              className={`text-sm sm:text-base font-medium text-slate-100 leading-snug truncate ${
                isCompleted ? "line-through text-slate-500" : ""
              }`}
            >
              {mission.title}
            </h3>
          </div>

          {/* Action Button: Accomplish (Single visible button) */}
          <div className="flex items-center gap-2 shrink-0">
            {!isCompleted && onComplete && (
              <Button
                variant="outline"
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

        {/* Revealed details on expand */}
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
