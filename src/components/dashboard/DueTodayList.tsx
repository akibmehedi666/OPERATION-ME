"use client";

import React from "react";
import { Clock, Check } from "lucide-react";
import { Mission, Category } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface DueTodayListProps {
  missions: Mission[];
  categories: Category[];
  activeMissionId?: string | null;
  onComplete: (mission: Mission) => void;
}

export const DueTodayList: React.FC<DueTodayListProps> = ({
  missions,
  categories,
  activeMissionId,
  onComplete,
}) => {
  const now = new Date();

  // Filter missions due today, excluding completed and strictly excluding the active mission
  const remainingDueToday = missions.filter((m) => {
    if (m.id === activeMissionId) return false;
    if (m.status === "completed") return false;
    if (!m.deadline) return false;

    const d = new Date(m.deadline);
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    const isOverdue = d < now;

    return isToday || isOverdue;
  });

  const formatDue = (deadlineStr: string) => {
    const d = new Date(deadlineStr);
    const diffMs = d.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
      return {
        text: `Overdue ${Math.abs(diffHours)}h`,
        isOverdue: true,
      };
    }
    if (diffHours === 0) return { text: "Due soon", isOverdue: false };
    if (diffHours < 24) return { text: `Due in ${diffHours}h`, isOverdue: false };
    return { text: "Due today", isOverdue: false };
  };

  return (
    <div className="clean-card p-5">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-spy-border">
        <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300">
          Remaining Due Today ({remainingDueToday.length})
        </h3>
      </div>

      {remainingDueToday.length === 0 ? (
        <p className="text-xs text-slate-500 py-3 font-sans">
          No other directives due today.
        </p>
      ) : (
        <div className="space-y-2">
          {remainingDueToday.map((mission) => {
            const category = categories.find((c) => c.id === mission.category_id);
            const dueInfo = mission.deadline ? formatDue(mission.deadline) : null;

            return (
              <div
                key={mission.id}
                className={`p-3 rounded-[4px] bg-[#141d18] border transition-colors flex items-center justify-between gap-3 ${
                  dueInfo?.isOverdue
                    ? "border-l-[3px] border-l-spy-red border-spy-border"
                    : "border-l-[3px] border-l-spy-amber border-spy-border"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">
                    {mission.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {category && (
                      <span className="text-[11px] bg-[#16201b] border border-[#23332a] px-1.5 py-0.5 rounded-[2px] text-slate-300">
                        {category.name}
                      </span>
                    )}
                    {dueInfo && (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          dueInfo.isOverdue ? "text-spy-red font-medium" : "text-slate-400"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {dueInfo.text}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onComplete(mission)}
                  className="shrink-0"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Accomplish</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
