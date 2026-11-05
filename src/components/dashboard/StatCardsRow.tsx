"use client";

import React from "react";
import { CheckCircle2, Flame, AlertCircle } from "lucide-react";
import { Mission } from "@/types/database";

interface StatCardsRowProps {
  missions: Mission[];
  streak: number;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({ missions, streak }) => {
  const now = new Date();

  // Find missions that were due today or completed today
  const todayMissions = missions.filter((m) => {
    if (!m.deadline && m.status !== "completed") return false;
    if (m.deadline) {
      const d = new Date(m.deadline);
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      if (isToday) return true;
    }
    if (m.completed_at) {
      const cd = new Date(m.completed_at);
      const isCompletedToday =
        cd.getDate() === now.getDate() &&
        cd.getMonth() === now.getMonth() &&
        cd.getFullYear() === now.getFullYear();
      if (isCompletedToday) return true;
    }
    return false;
  });

  const completedTodayCount = todayMissions.filter((m) => m.status === "completed").length;
  const totalTodayCount = Math.max(todayMissions.length, completedTodayCount);

  // Overdue count (non-completed missions with past deadline)
  const overdueCount = missions.filter((m) => {
    if (m.status === "completed") return false;
    if (!m.deadline) return false;
    return new Date(m.deadline) < now;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {/* 1. Today completion stat */}
      <div className="clean-card p-3.5 sm:p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
            Today
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-spy-text mt-0.5">
            {completedTodayCount}/{totalTodayCount || missions.filter((m) => m.status === "active").length || 1} done
          </div>
        </div>
        <div className="p-2 bg-spy-surface2 border border-spy-border rounded-[4px] text-spy-green">
          <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. Streak stat */}
      <div className="clean-card p-3.5 sm:p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
            Streak
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-spy-amber mt-0.5">
            {streak} {streak === 1 ? "day" : "days"}
          </div>
        </div>
        <div className="p-2 bg-spy-surface2 border border-spy-border rounded-[4px] text-spy-amber">
          <Flame className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Overdue stat (red if > 0) */}
      <div
        className={`clean-card p-3.5 sm:p-4 flex items-center justify-between transition-colors ${
          overdueCount > 0 ? "border-l-[3px] border-l-spy-red bg-spy-danger-surface" : ""
        }`}
      >
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
            Overdue
          </div>
          <div
            className={`text-base sm:text-lg font-mono font-bold mt-0.5 ${
              overdueCount > 0 ? "text-spy-red" : "text-spy-text"
            }`}
          >
            {overdueCount} {overdueCount === 1 ? "mission" : "missions"}
          </div>
        </div>
        <div
          className={`p-2 rounded-[4px] border ${
            overdueCount > 0
              ? "bg-spy-danger-surface border-spy-red/30 text-spy-red"
              : "bg-spy-surface2 border-spy-border text-spy-muted"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

