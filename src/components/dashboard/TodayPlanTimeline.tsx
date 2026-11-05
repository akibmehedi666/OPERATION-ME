"use client";

import React from "react";
import { BookOpen, GraduationCap, Target, Check, Clock } from "lucide-react";
import { Mission, Category, ClassScheduleItem, DayOfWeek } from "@/types/database";
import { formatTime12, formatTimeRange12 } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";

const DAY_KEYS: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface TodayPlanTimelineProps {
  schedule: ClassScheduleItem[];
  missions: Mission[];
  categories: Category[];
  activeMissionId?: string | null;
  onCompleteMission: (mission: Mission) => void;
}

interface TimelineItem {
  id: string;
  type: "class" | "tuition" | "mission";
  sortTime: string; // "HH:MM" for sorting
  timeDisplay: string;
  title: string;
  room?: string | null;
  categoryName?: string;
  priority?: "urgent" | "high" | "medium" | "low";
  isOverdue?: boolean;
  isCompleted?: boolean;
  missionObj?: Mission;
}

export const TodayPlanTimeline: React.FC<TodayPlanTimelineProps> = ({
  schedule,
  missions,
  categories,
  activeMissionId,
  onCompleteMission,
}) => {
  const now = new Date();
  const currentDayKey = DAY_KEYS[now.getDay()];

  // 1. Gather today's schedule (classes & tuition)
  const todayScheduleItems: TimelineItem[] = schedule
    .filter((s) => s.day_of_week === currentDayKey)
    .map((s) => ({
      id: s.id,
      type: s.type,
      sortTime: s.start_time,
      timeDisplay: formatTimeRange12(s.start_time, s.end_time),
      title: s.course_name,
      room: s.room,
      categoryName: s.type === "tuition" ? "Tuition" : "Class",
    }));

  // 2. Gather today's missions (excluding active mission to adhere to single appearance rule)
  const todayMissions: TimelineItem[] = missions
    .filter((m) => {
      if (m.id === activeMissionId) return false;
      if (!m.deadline) return false;

      const d = new Date(m.deadline);
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      // Include if due today or overdue
      const isOverdue = d < now && m.status !== "completed";
      return isToday || isOverdue;
    })
    .map((m) => {
      const d = new Date(m.deadline!);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const isOverdue = d < now && m.status !== "completed";
      const cat = categories.find((c) => c.id === m.category_id);

      return {
        id: m.id,
        type: "mission",
        sortTime: `${hh}:${mm}`,
        timeDisplay: formatTime12(d),
        title: m.title,
        categoryName: cat?.name || "Mission",
        priority: m.priority,
        isOverdue,
        isCompleted: m.status === "completed",
        missionObj: m,
      };
    });

  // 3. Merge and sort chronologically by time
  const mergedItems = [...todayScheduleItems, ...todayMissions].sort((a, b) =>
    a.sortTime.localeCompare(b.sortTime)
  );

  // Helper for left border styling
  const getBorderLeftClass = (item: TimelineItem) => {
    if (item.type === "mission") {
      if (item.isOverdue) return "border-l-[3px] border-l-spy-red";
      if (item.priority === "urgent") return "border-l-[3px] border-l-spy-red";
      if (item.priority === "high") return "border-l-[3px] border-l-spy-amber";
      if (item.priority === "medium") return "border-l-[3px] border-l-spy-green";
      return "border-l-[3px] border-l-slate-700";
    }
    if (item.type === "tuition") {
      return "border-l-[3px] border-l-amber-500/80";
    }
    // Academic Class
    return "border-l-[3px] border-l-slate-600";
  };

  return (
    <div className="clean-card p-5">
      {/* Section Header: small uppercase label + count, with divider */}
      <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
        <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300">
          TODAY&apos;S PLAN ({mergedItems.length})
        </h3>
        <span className="text-[11px] font-mono text-slate-500">
          Chronological Timeline
        </span>
      </div>

      {mergedItems.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500 font-sans">
          No scheduled classes, tuition, or missions due for the rest of today.
        </div>
      ) : (
        <div className="space-y-2.5">
          {mergedItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`p-3.5 rounded-[4px] bg-[#141d18] border border-spy-border transition-colors flex items-center justify-between gap-3 ${getBorderLeftClass(
                item
              )} ${item.isCompleted ? "opacity-50" : ""}`}
            >
              {/* Left Details: Icon + Time + Title + Category Chip */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Type Icon */}
                <div
                  className={`p-2 rounded-[4px] shrink-0 border ${
                    item.type === "mission"
                      ? "bg-[#0e1411] border-spy-border text-spy-green"
                      : item.type === "tuition"
                      ? "bg-[#0e1411] border-amber-900/30 text-amber-400"
                      : "bg-[#0e1411] border-spy-border text-slate-300"
                  }`}
                  title={item.type.toUpperCase()}
                >
                  {item.type === "mission" ? (
                    <Target className="w-3.5 h-3.5 stroke-[2.2]" />
                  ) : item.type === "tuition" ? (
                    <GraduationCap className="w-3.5 h-3.5" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {/* Time in 12h format */}
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.timeDisplay}
                    </span>

                    {/* Category Chip */}
                    {item.categoryName && (
                      <span className="text-[11px] bg-[#16201b] border border-[#23332a] px-1.5 py-0.5 rounded-[2px] text-slate-300">
                        {item.categoryName}
                      </span>
                    )}

                    {/* Overdue alert */}
                    {item.isOverdue && (
                      <span className="text-[11px] font-mono text-spy-red font-semibold">
                        Overdue
                      </span>
                    )}

                    {item.room && (
                      <span className="text-[11px] font-mono text-slate-500">
                        Room {item.room}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div
                    className={`text-sm font-medium text-slate-100 truncate ${
                      item.isCompleted ? "line-through text-slate-500" : ""
                    }`}
                  >
                    {item.title}
                  </div>
                </div>
              </div>

              {/* Right Action Button (Missions get Accomplish button) */}
              <div className="shrink-0">
                {item.type === "mission" && item.missionObj && !item.isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCompleteMission(item.missionObj!)}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden sm:inline">Accomplish</span>
                  </Button>
                )}

                {item.type === "mission" && item.isCompleted && (
                  <span className="text-xs font-mono text-slate-500">Done</span>
                )}

                {item.type !== "mission" && (
                  <span className="text-xs font-mono text-slate-500 uppercase">
                    {item.type}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
