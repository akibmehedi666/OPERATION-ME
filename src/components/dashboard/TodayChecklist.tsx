"use client";

import React from "react";
import { CheckSquare, Square, AlertTriangle, Sparkles, CheckCircle } from "lucide-react";
import { Mission, Category } from "@/types/database";

interface TodayChecklistProps {
  missions: Mission[];
  categories: Category[];
  onToggleComplete: (mission: Mission) => void;
}

export const TodayChecklist: React.FC<TodayChecklistProps> = ({
  missions,
  categories,
  onToggleComplete,
}) => {
  const now = new Date();

  // Find missions that are active or due today or overdue
  const todayMissions = missions.filter((m) => {
    if (m.status === "active") return true;
    const dueTime = m.deadline || m.scheduled_end;
    if (dueTime) {
      const d = new Date(dueTime);
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      const isPast = d < now;
      return isToday || isPast;
    }
    return false;
  });

  const completedCount = todayMissions.filter((m) => m.status === "completed").length;
  const totalCount = todayMissions.length;

  return (
    <div className="tactical-card bg-spy-surface border border-spy-border p-4 sm:p-5 font-mono text-spy-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-spy-green" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-spy-text">
            TODAY&apos;S MISSION CHECKLIST
          </h3>
        </div>
        <div className="text-xs text-spy-green font-bold bg-spy-green/10 border border-spy-green/30 px-2 py-0.5">
          {completedCount} / {totalCount} CLEARED
        </div>
      </div>

      {/* Checklist items */}
      {todayMissions.length === 0 ? (
        <div className="py-6 text-center text-xs text-spy-muted border border-dashed border-spy-border">
          ALL ACTIVE OBJECTIVES EXECUTED. NO IMMEDIATE THREATS PENDING.
        </div>
      ) : (
        <div className="space-y-2">
          {todayMissions.map((mission) => {
            const isCompleted = mission.status === "completed";
            const dueTime = mission.deadline || mission.scheduled_end;
            const deadlineDate = dueTime ? new Date(dueTime) : null;
            const isOverdue = deadlineDate ? deadlineDate < now && !isCompleted : false;
            const category = categories.find((c) => c.id === mission.category_id);

            return (
              <div
                key={mission.id}
                onClick={() => onToggleComplete(mission)}
                className={`p-2.5 border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                  isCompleted
                    ? "bg-spy-surface2 border-spy-border opacity-60"
                    : isOverdue
                    ? "bg-spy-danger-surface border-spy-red/50 hover:border-spy-red"
                    : "bg-spy-surface border-spy-border hover:border-spy-green/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    className="text-spy-muted group-hover:text-spy-green transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-spy-green" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <div className="min-w-0 truncate">
                    <div
                      className={`text-xs font-bold truncate ${
                        isCompleted ? "line-through text-spy-muted" : "text-spy-text"
                      }`}
                    >
                      {mission.title}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-spy-dim mt-0.5">
                      <span className="text-spy-green font-mono">[{mission.codename}]</span>
                      {category && (
                        <span style={{ color: category.color }}>● {category.name}</span>
                      )}
                      {isOverdue && (
                        <span className="text-spy-red font-bold flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3 text-spy-red" />
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="text-[10px] text-spy-amber font-mono font-bold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-spy-amber" />
                    +{mission.xp} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

