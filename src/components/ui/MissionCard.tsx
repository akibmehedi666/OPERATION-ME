"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Crosshair, 
  Edit3, 
  Trash2, 
  Sparkles,
  Radio,
  FileText
} from "lucide-react";
import { Mission, Category } from "@/types/database";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { StampLabel } from "./StampLabel";

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
  // Check if overdue
  const now = new Date();
  const deadlineDate = mission.deadline ? new Date(mission.deadline) : null;
  const isOverdue = deadlineDate ? deadlineDate < now && mission.status !== "completed" : false;
  const isCompleted = mission.status === "completed";
  const isActive = mission.status === "active";

  // Format deadline and relative time
  const formatDeadline = (date: Date) => {
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const overdueHours = Math.abs(diffHours);
      if (overdueHours < 24) return `OVERDUE BY ${overdueHours}h`;
      return `OVERDUE BY ${Math.abs(diffDays)}d`;
    }

    if (diffHours < 24) return `T-MINUS ${diffHours}h`;
    return `T-MINUS ${diffDays}d (${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`;
  };

  const priorityVariant =
    mission.priority === "urgent"
      ? "urgent"
      : mission.priority === "high"
      ? "high"
      : mission.priority === "medium"
      ? "medium"
      : "low";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative group font-mono border transition-all duration-200 overflow-hidden ${
        isOverdue
          ? "tactical-card-red bg-red-950/20 border-spy-red/60 shadow-spy-red"
          : isHero
          ? "tactical-card bg-spy-surface border-spy-green/50 shadow-spy-green"
          : isCompleted
          ? "bg-spy-bg/60 border-spy-border/50 opacity-60"
          : "tactical-card bg-spy-surface border-spy-border hover:border-spy-green/40 hover:shadow-hud-card"
      } ${isHero ? "p-5 sm:p-7" : "p-4 sm:p-5"}`}
    >
      {/* Visual scanline flicker highlight on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-spy-green/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

      {/* Header bar: Codename, Status, Priority */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-black tracking-widest text-spy-green flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-spy-green" />
            [{mission.codename || `TARGET-${mission.id.slice(0, 4)}`}]
          </span>

          {category && (
            <span
              className="text-[10px] sm:text-xs px-2 py-0.5 border uppercase tracking-wider font-semibold"
              style={{
                color: category.color || "#00ff66",
                borderColor: `${category.color}40` || "#00ff6640",
                backgroundColor: `${category.color}15` || "#00ff6615",
              }}
            >
              {category.name}
            </span>
          )}

          <Badge variant={priorityVariant}>
            {mission.priority === "urgent" ? "OMEGA" : mission.priority}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {isOverdue ? (
            <StampLabel text="FAILING" variant="danger" size="sm" rotate={-3} />
          ) : isCompleted ? (
            <Badge variant="completed">ACCOMPLISHED</Badge>
          ) : isActive ? (
            <Badge variant="active" pulse>
              ACTIVE DIRECTIVE
            </Badge>
          ) : (
            <Badge variant="locked">QUEUED</Badge>
          )}

          {/* XP Reward Indicator */}
          <span className="flex items-center gap-1 text-[11px] font-bold text-spy-amber bg-spy-amber/10 border border-spy-amber/30 px-2 py-0.5">
            <Sparkles className="w-3 h-3 text-spy-amber" />
            +{mission.xp} XP
          </span>
        </div>
      </div>

      {/* Mission Title */}
      <h3
        className={`font-mono font-bold tracking-tight text-spy-text mb-2 ${
          isHero ? "text-lg sm:text-2xl text-glow-green" : "text-base sm:text-lg"
        } ${isCompleted ? "line-through text-slate-500" : ""}`}
      >
        {mission.title}
      </h3>

      {/* Mission Notes / Tactical Intel */}
      {mission.notes && (
        <div className="mb-4 text-xs sm:text-sm text-spy-dim bg-black/40 border-l-2 border-spy-green/60 p-2.5 rounded-none flex items-start gap-2">
          <FileText className="w-4 h-4 text-spy-green shrink-0 mt-0.5" />
          <p className="line-clamp-3 whitespace-pre-wrap">{mission.notes}</p>
        </div>
      )}

      {/* Footer info: Deadline & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-spy-border/50">
        <div className="flex items-center gap-2 text-xs">
          {deadlineDate ? (
            <div
              className={`flex items-center gap-1.5 font-bold ${
                isOverdue
                  ? "text-spy-red text-glow-red animate-pulse"
                  : "text-spy-dim"
              }`}
            >
              {isOverdue ? (
                <AlertTriangle className="w-4 h-4 text-spy-red shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-spy-green shrink-0" />
              )}
              <span>{formatDeadline(deadlineDate)}</span>
            </div>
          ) : (
            <span className="text-slate-600 text-[11px]">NO DEADLINE SET</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {!isCompleted && onComplete && (
            <Button
              variant={isHero ? "primary" : "outline"}
              size={isHero ? "md" : "sm"}
              onClick={() => onComplete(mission)}
              className="group/btn"
            >
              <CheckCircle2 className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              <span>ACCOMPLISH</span>
            </Button>
          )}

          {!isActive && !isCompleted && onSetActive && (
            <Button
              variant="stealth"
              size="sm"
              onClick={() => onSetActive(mission)}
              title="Promote to Active Mission"
            >
              <Crosshair className="w-3.5 h-3.5 text-spy-green" />
              <span className="hidden sm:inline">SET ACTIVE</span>
            </Button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(mission)}
              className="p-1.5 text-slate-400 hover:text-spy-amber hover:bg-spy-amber/10 border border-transparent hover:border-spy-amber/30 transition-colors"
              title="Edit Mission Directives"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(mission)}
              className="p-1.5 text-slate-500 hover:text-spy-red hover:bg-spy-red/10 border border-transparent hover:border-spy-red/30 transition-colors"
              title="Abort / Discard Mission"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

