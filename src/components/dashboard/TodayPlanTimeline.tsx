"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, GraduationCap, Target, Check, Clock } from "lucide-react";
import { Mission, Category, ClassScheduleItem, DayOfWeek, TimeBlock, AcademicEvent } from "@/types/database";
import { formatTime12, formatTimeRange12 } from "@/lib/formatters";
import { getCategoryTheme } from "@/lib/categoryTheme";
import { Button } from "@/components/ui/Button";
import { resolveDaySchedule } from "@/lib/scheduleResolver";

const DAY_KEYS: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface TodayPlanTimelineProps {
  schedule: ClassScheduleItem[];
  timeBlocks?: TimeBlock[];
  academicEvents?: AcademicEvent[];
  missions: Mission[];
  categories: Category[];
  activeMissionId?: string | null;
  accomplishingMissionId?: string | null;
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
  timeBlocks,
  academicEvents,
  missions,
  categories,
  activeMissionId,
  accomplishingMissionId,
  onCompleteMission,
}) => {
  const now = new Date();
  const currentDayKey = DAY_KEYS[now.getDay()];

  // 1. Gather today's schedule (classes & tuition)
  // If timeBlocks provided, resolve today's schedule honoring academic overrides & holidays
  let todayScheduleItems: TimelineItem[] = [];
  let dayBadge: string | undefined = undefined;

  if (timeBlocks && timeBlocks.length > 0) {
    const resolved = resolveDaySchedule(now, timeBlocks, academicEvents || [], missions);
    dayBadge = resolved.badge;
    todayScheduleItems = resolved.blocks
      .filter((b) => b.type === "class" || b.type === "tuition")
      .map((b) => ({
        id: b.id,
        type: b.type === "tuition" ? "tuition" : "class",
        sortTime: b.start_time,
        timeDisplay: formatTimeRange12(b.start_time, b.end_time),
        title: b.label,
        categoryName: b.type === "tuition" ? "Tuition" : "Class",
      }));
  } else {
    todayScheduleItems = schedule
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
  }

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
      return "border-l-[3px] border-l-spy-borderLight";
    }
    if (item.type === "tuition") {
      return "border-l-[3px] border-l-spy-amber";
    }
    // Academic Class
    return "border-l-[3px] border-l-spy-borderLight";
  };

  return (
    <div className="clean-card p-5">
      {/* Section Header: small uppercase label + count, with divider */}
      <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-spy-text">
            TODAY&apos;S PLAN ({mergedItems.length})
          </h3>
          {dayBadge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-spy-green/10 text-[#14663a] dark:text-spy-green border border-spy-green/30 font-bold">
              ★ {dayBadge}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-spy-muted">
          Chronological Timeline
        </span>
      </div>

      {mergedItems.length === 0 ? (
        <div className="text-center py-8 text-xs text-spy-dim font-sans">
          No scheduled classes, tuition, or missions due for the rest of today.
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {mergedItems.map((item) => {
              const catTheme =
                item.type === "tuition"
                  ? getCategoryTheme("tuition")
                  : item.type === "class"
                  ? getCategoryTheme(item.title)
                  : getCategoryTheme(item.categoryName || item.title);

              const isAccomplishing = item.type === "mission" && item.id === accomplishingMissionId;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={
                    isAccomplishing
                      ? { opacity: 0, scale: 0.95, height: 0, overflow: "hidden", marginBottom: 0 }
                      : { opacity: 1, y: 0, height: "auto" }
                  }
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  key={`${item.type}-${item.id}`}
                  className={`p-3.5 rounded-[4px] bg-spy-surface2 border border-spy-border transition-colors flex items-center justify-between gap-3 relative ${getBorderLeftClass(
                    item
                  )} ${item.isOverdue ? "bg-spy-redMuted" : ""} ${item.isCompleted ? "opacity-60" : ""} ${
                    isAccomplishing ? "border-spy-green bg-spy-green/10" : ""
                  }`}
                >
                {/* Left Details: Icon + Time + Title + Category Chip */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Type Icon taking Category/Course Color */}
                  <div
                    className={`p-2 rounded-[4px] shrink-0 border ${catTheme.iconTileClass}`}
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
                      <span className="text-xs font-mono text-spy-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-spy-dim" />
                        {item.timeDisplay}
                      </span>

                      {/* Category Chip */}
                      {item.categoryName && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-[3px] border font-medium inline-flex items-center gap-1.5 ${catTheme.chipClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${catTheme.dotClass}`} />
                          {item.categoryName}
                        </span>
                      )}

                      {/* Overdue alert */}
                      {item.isOverdue && (
                        <span className="rubber-stamp rubber-stamp-red text-[10px]">
                          Overdue
                        </span>
                      )}

                      {item.room && (
                        <span className="text-[11px] font-mono text-spy-dim">
                          Room {item.room}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div
                      className={`text-sm font-medium text-spy-text truncate ${
                        item.isCompleted ? "line-through text-spy-dim" : ""
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
                      variant="primary"
                      size="sm"
                      onClick={() => onCompleteMission(item.missionObj!)}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span className="hidden sm:inline">Accomplish</span>
                    </Button>
                  )}

                  {item.type === "mission" && item.isCompleted && (
                    <span className="text-xs font-mono text-spy-dim">Done</span>
                  )}

                  {item.type !== "mission" && (
                    <span className="text-xs font-mono text-spy-dim uppercase">
                      {item.type}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

