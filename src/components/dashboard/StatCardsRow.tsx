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
      {/* 1. Today completion stat (Green) */}
      <div className="clean-card p-3.5 sm:p-4 flex items-center justify-between bg-[#eef6f0] border-[#cde5d4] dark:bg-spy-surface dark:border-spy-border">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#14663a] dark:text-spy-muted">
            Today
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-[#1f2421] dark:text-spy-text mt-0.5">
            {completedTodayCount}/{totalTodayCount || missions.filter((m) => m.status === "active").length || 1} done
          </div>
        </div>
        <div className="p-2 bg-[#dcf3e4] border border-[#b9e7c8] text-[#14663a] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green rounded-[4px]">
          <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. Streak stat (Amber) */}
      <div className="clean-card p-3.5 sm:p-4 flex items-center justify-between bg-[#fdf6ea] border-[#f6e2be] dark:bg-spy-surface dark:border-spy-border">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#9a5b00] dark:text-spy-muted">
            Streak
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-[#9a5b00] dark:text-spy-amber mt-0.5">
            {streak} {streak === 1 ? "day" : "days"}
          </div>
        </div>
        <div className="p-2 bg-[#fbefd5] border border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber rounded-[4px]">
          <Flame className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Overdue stat (Red: tint only when > 0) */}
      <div
        className={`clean-card p-3.5 sm:p-4 flex items-center justify-between transition-colors ${
          overdueCount > 0
            ? "border-l-[3px] border-l-[#b42318] bg-[#fbeae8] border-[#f5c6c2] dark:border-l-spy-red dark:bg-spy-danger-surface dark:border-spy-border"
            : "bg-[#fffdf8] border-spy-border dark:bg-spy-surface dark:border-spy-border"
        }`}
      >
        <div>
          <div
            className={`text-xs font-mono uppercase tracking-wider ${
              overdueCount > 0 ? "text-[#b42318] dark:text-spy-muted" : "text-spy-muted"
            }`}
          >
            Overdue
          </div>
          <div
            className={`text-base sm:text-lg font-mono font-bold mt-0.5 ${
              overdueCount > 0 ? "text-[#b42318] dark:text-spy-red" : "text-spy-text"
            }`}
          >
            {overdueCount} {overdueCount === 1 ? "mission" : "missions"}
          </div>
        </div>
        <div
          className={`p-2 rounded-[4px] border ${
            overdueCount > 0
              ? "bg-[#fce8e0] border-[#f8cfc0] text-[#b42318] dark:bg-spy-danger-surface dark:border-spy-red/30 dark:text-spy-red"
              : "bg-[#f7f4ed] border-[#ddd6c8] text-spy-muted dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-muted"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

