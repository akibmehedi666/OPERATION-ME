"use client";

import React from "react";
import { CheckCircle2, Flame, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Mission } from "@/types/database";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface StatCardsRowProps {
  missions: Mission[];
  streak: number;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({ missions, streak }) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Find missions that belong to today (scheduled today, deadline today, or completed today)
  // Strictly count missions only (not tuition or classes)
  const todayMissions = missions.filter((m) => {
    if (m.completed_at && m.completed_at.slice(0, 10) === todayStr) {
      return true;
    }
    if (m.auto_generated_date === todayStr) {
      return true;
    }
    if (m.scheduled_start && m.scheduled_start.slice(0, 10) === todayStr) {
      return true;
    }
    const dueTime = m.deadline || m.scheduled_end;
    if (dueTime) {
      const d = new Date(dueTime);
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      if (isToday) return true;
    }
    return false;
  });

  const completedTodayCount = todayMissions.filter((m) => m.status === "completed").length;
  const totalTodayCount = todayMissions.length;

  // Overdue count (non-completed missions with past deadline or end time)
  const overdueCount = missions.filter((m) => {
    if (m.status === "completed") return false;
    const dueTime = m.deadline || m.scheduled_end;
    if (!dueTime) return false;
    return new Date(dueTime) < now;
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
            <AnimatedCounter value={completedTodayCount} />/
            <AnimatedCounter value={totalTodayCount} /> done
          </div>
        </div>
        <div className="p-2 bg-[#dcf3e4] border border-[#b9e7c8] text-[#14663a] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green rounded-[4px]">
          <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. Streak stat (Amber, pulses on milestone 3, 7, 14, 30 days) */}
      <div className="clean-card p-3.5 sm:p-4 flex items-center justify-between bg-[#fdf6ea] border-[#f6e2be] dark:bg-spy-surface dark:border-spy-border">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#9a5b00] dark:text-spy-muted flex items-center gap-1.5">
            <span>Streak</span>
            {[3, 7, 14, 30].includes(streak) && (
              <span className="text-[10px] font-mono font-bold bg-[#fdeadb] text-[#a8500f] border border-[#facfb7] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber/30 px-1 py-0.2 rounded-[2px]">
                Milestone!
              </span>
            )}
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-[#9a5b00] dark:text-spy-amber mt-0.5">
            <AnimatedCounter value={streak} /> {streak === 1 ? "day" : "days"}
          </div>
        </div>
        <motion.div
          animate={
            [3, 7, 14, 30].includes(streak)
              ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }
              : {}
          }
          transition={{
            type: "tween",
            scale: { type: "tween", duration: 0.45 },
            rotate: { type: "tween", duration: 0.45 },
            repeat: [3, 7, 14, 30].includes(streak) ? 2 : 0,
          }}
          className="p-2 bg-[#fbefd5] border border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber rounded-[4px]"
        >
          <Flame className="w-4 h-4" />
        </motion.div>
      </div>

      {/* 3. Overdue stat (Red: tint only when > 0, gentle pulse every 4s) */}
      <div
        className={`clean-card p-3.5 sm:p-4 flex items-center justify-between transition-colors ${
          overdueCount > 0
            ? "border-l-[3px] border-l-[#b42318] bg-[#fbeae8] border-[#f5c6c2] dark:border-l-spy-red dark:bg-spy-danger-surface dark:border-spy-border overdue-pulse"
            : "bg-[#fffdf8] border-spy-border dark:bg-spy-surface dark:border-spy-border"
        }`}
      >
        <div>
          <div
            className={`text-xs font-mono uppercase tracking-wider ${
              overdueCount > 0 ? "text-[#b42318] dark:text-spy-muted font-bold" : "text-spy-muted"
            }`}
          >
            Overdue
          </div>
          <div
            className={`text-base sm:text-lg font-mono font-bold mt-0.5 ${
              overdueCount > 0 ? "text-[#b42318] dark:text-spy-red" : "text-spy-text"
            }`}
          >
            <AnimatedCounter value={overdueCount} /> {overdueCount === 1 ? "mission" : "missions"}
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

