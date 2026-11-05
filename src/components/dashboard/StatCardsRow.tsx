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
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Today
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white mt-0.5">
            {completedTodayCount}/{totalTodayCount || missions.filter((m) => m.status === "active").length || 1} done
          </div>
        </div>
        <div className="p-2 bg-[#141d18] border border-spy-border rounded-[4px] text-spy-green">
          <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. Streak stat */}
      <div className="clean-card p-3.5 sm:p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Streak
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-amber-400 mt-0.5">
            {streak} {streak === 1 ? "day" : "days"}
          </div>
        </div>
        <div className="p-2 bg-[#141d18] border border-spy-border rounded-[4px] text-amber-400">
          <Flame className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Overdue stat (red if > 0) */}
      <div
        className={`clean-card p-3.5 sm:p-4 flex items-center justify-between transition-colors ${
          overdueCount > 0 ? "border-l-[3px] border-l-spy-red bg-red-950/10" : ""
        }`}
      >
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Overdue
          </div>
          <div
            className={`text-base sm:text-lg font-mono font-bold mt-0.5 ${
              overdueCount > 0 ? "text-spy-red" : "text-slate-300"
            }`}
          >
            {overdueCount} {overdueCount === 1 ? "mission" : "missions"}
          </div>
        </div>
        <div
          className={`p-2 rounded-[4px] border ${
            overdueCount > 0
              ? "bg-red-950/30 border-red-800/40 text-spy-red"
              : "bg-[#141d18] border-spy-border text-slate-500"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
