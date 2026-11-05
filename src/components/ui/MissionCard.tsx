"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Clock, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  Crosshair,
  FileText
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
  onEditNote?: (mission: Mission) => void;
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
        return "border-l-[3px] border-l-spy-borderLight";
    }
  };

  // If this is the Hero Active Mission card
  if (isHero) {
    return (
      <div className="active-mission-card p-5 sm:p-6 transition-all duration-200">
        {/* Header line: Rubber Stamp + Category + Due Time */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="rubber-stamp rubber-stamp-green text-[10px]">
              ACTIVE MISSION
            </span>
            {category && (
              <span className="text-xs bg-spy-chipBg text-spy-chipText border border-spy-chipBorder px-2 py-0.5 rounded-[3px] font-medium">
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

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-medium text-spy-text mb-3 leading-snug">
          {mission.title}
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

  // Standard Mission Card (aligned grid)
  return (
    <div
      className={`group clean-card transition-all duration-150 ${getBorderLeftClass()} ${
        dueInfo.isOverdue && !isCompleted ? "bg-spy-redMuted" : ""
      } ${isCompleted ? "opacity-60" : ""}`}
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Main Info: Title + Category + Due Time */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Category (Neutral tan chip in light, dark chip in dark) */}
              {category && (
                <span className="text-[11px] bg-spy-chipBg text-spy-chipText border border-spy-chipBorder px-1.5 py-0.5 rounded-[2px] inline-flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-spy-muted" />
                  {category.name}
                </span>
              )}

              {/* Rubber Stamp for Overdue or regular Due time in 12-hour format */}
              {dueInfo.isOverdue && !isCompleted ? (
                <span className="rubber-stamp rubber-stamp-red text-[10px]">
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
              className="pt-3 mt-3 border-t border-spy-border text-xs text-spy-muted space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-spy-muted">[{mission.codename}]</span>
                <span className="text-spy-muted">+{mission.xp} XP</span>
              </div>

              {mission.notes && (
                <div className="bg-spy-surface2 p-3 rounded-[3px] text-spy-text leading-relaxed font-sans text-xs border border-spy-border">
                  {mission.notes}
                </div>
              )}

              {/* Completion Note & Time Spent in Expanded View (for completed missions) */}
              {isCompleted && (
                <div className="bg-spy-surface2 p-2.5 rounded-[3px] border border-spy-border text-spy-text font-sans flex items-start justify-between gap-2">
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
                      title="Edit Debrief Note"
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
    </div>
  );
};
