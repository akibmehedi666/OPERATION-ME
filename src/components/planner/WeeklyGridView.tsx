"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TimeBlock, 
  AcademicEvent, 
  Mission, 
  DayOfWeek,
  Category,
  ResolvedTimeBlock,
  TuitionException
} from "@/types/database";
import { 
  resolveDaySchedule, 
  getDaysOfWeek, 
  formatDateKey,
  getLocalTimeString
} from "@/lib/scheduleResolver";
import { formatTime12, formatShortTimeRange } from "@/lib/formatters";
import { 
  Check, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  Clock, 
  Lock, 
  Eye, 
  EyeOff, 
  Columns, 
  ListFilter,
  Undo2,
  Flag 
} from "lucide-react";
import { soundFX } from "@/lib/sound";
import { PlannerItemPanel, PlannerSelectedItem } from "@/components/planner/PlannerItemPanel";

interface WeeklyGridViewProps {
  weekStartDate: Date;
  timeBlocks: TimeBlock[];
  academicEvents: AcademicEvent[];
  missions: Mission[];
  categories?: Category[];
  onEditBlock: (block: TimeBlock, dateStr: string) => void;
  onAddBlock: (weekday: DayOfWeek, dateStr: string) => void;
  onAssignMissionToBlock: (block: TimeBlock, dateStr: string) => void;
  onConfirmAutoSchedule: (missionId: string) => void;
  onCompleteMission: (mission: Mission) => void;
  onOpenCourseHQ?: (courseId: string) => void;
  onEditMission?: (mission: Mission) => void;
  onEditTuition?: (slot: { day: DayOfWeek; startTime: string; endTime: string; targetDate?: string }) => void;
  onAddMissionAtSlot?: (dateStr: string, startTime: string, endTime: string) => void;
  onSaveRoutine?: (
    blockId: string,
    updates: Partial<TimeBlock>,
    scope: "today" | "every_week",
    dateStr: string
  ) => Promise<void> | void;
  onDeleteRoutine?: (
    blockId: string,
    scope: "today" | "every_week",
    dateStr: string
  ) => Promise<void> | void;
  onOpenAcademicCalendar?: () => void;
  onQuickMoveMission?: (mission: Mission, deltaMinutes: number) => void;
  tuitionExceptions?: TuitionException[];
  onUndoTuitionException?: (exceptionId: string) => Promise<void> | void;
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = (timeStr || "14:00").split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + minutes;
  const newH = Math.min(23, Math.max(0, Math.floor(total / 60)));
  const newM = Math.max(0, total % 60);
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

interface CalendarIntervalItem {
  startMin: number;
  endMin: number;
}

function layoutSubColumns<T extends CalendarIntervalItem>(
  rawItems: T[]
): Array<T & { colIndex: number; totalCols: number }> {
  if (rawItems.length === 0) return [];

  const items = rawItems.map((item) => ({
    ...item,
    startMin: item.startMin,
    endMin: Math.max(item.startMin + 15, item.endMin),
    colIndex: 0,
    totalCols: 1,
  }));

  items.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  const clusters: Array<typeof items> = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMin;
    } else if (item.startMin < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMin;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  for (const cluster of clusters) {
    const lanes: number[] = [];
    for (const item of cluster) {
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= item.startMin) {
          lanes[i] = item.endMin;
          item.colIndex = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        item.colIndex = lanes.length;
        lanes.push(item.endMin);
      }
    }
    const totalLanes = Math.max(1, lanes.length);
    for (const item of cluster) {
      item.totalCols = totalLanes;
    }
  }

  return items;
}

export const WeeklyGridView: React.FC<WeeklyGridViewProps> = ({
  weekStartDate,
  timeBlocks,
  academicEvents,
  missions,
  categories = [],
  onAddBlock,
  onAssignMissionToBlock,
  onCompleteMission,
  onOpenCourseHQ,
  onEditMission,
  onEditTuition,
  onAddMissionAtSlot,
  onSaveRoutine,
  onDeleteRoutine,
  onOpenAcademicCalendar,
  onQuickMoveMission,
  tuitionExceptions = [],
  onUndoTuitionException,
}) => {
  // View mode: 'week' or 'day' (default 'day' on mobile < 768px)
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [hideRoutineBlocks, setHideRoutineBlocks] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullDay, setIsFullDay] = useState<boolean>(false);

  // Selected item for unified panel
  const [selectedItem, setSelectedItem] = useState<PlannerSelectedItem | null>(null);

  // Tooltip
  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    title: string;
    time: string;
    category?: string;
    categoryColor?: string;
    status?: string;
    xp?: number;
    notes?: string | null;
  } | null>(null);

  // Auto-detect mobile on initial mount to default to 'day' view
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setViewMode("day");
      }
    }
  }, []);

  // Update current time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const days = useMemo(() => getDaysOfWeek(weekStartDate), [weekStartDate]);
  const todayKey = formatDateKey(currentTime);

  // Auto-select today
  useEffect(() => {
    const idx = days.findIndex((d) => formatDateKey(d) === todayKey);
    if (idx !== -1) {
      setSelectedDayIndex(idx);
    }
  }, [days, todayKey]);

  // Resolve schedule for each of the 7 days
  const resolvedDays = useMemo(() => {
    return days.map((dayDate) =>
      resolveDaySchedule(dayDate, timeBlocks, academicEvents, missions, tuitionExceptions)
    );
  }, [days, timeBlocks, academicEvents, missions, tuitionExceptions]);

  // Dynamic time range calculation
  const timeRange = useMemo(() => {
    const DEFAULT_START = 9;  // 9 AM
    const DEFAULT_END = 22;   // 10 PM
    const MIN_HOUR = 6;       // 6 AM
    const MAX_HOUR = 24;      // 12 AM

    const weekDateStrs = new Set(days.map((d) => formatDateKey(d)));
    let earliestMin = DEFAULT_START * 60;
    let latestMin = DEFAULT_END * 60;

    for (const day of resolvedDays) {
      for (const b of day.blocks) {
        if (!b.start_time || !b.end_time) continue;
        const [sh, sm] = b.start_time.split(":").map(Number);
        const [eh, em] = b.end_time.split(":").map(Number);
        const sMin = (sh || 0) * 60 + (sm || 0);
        const eMin = (eh || 0) * 60 + (em || 0);
        earliestMin = Math.min(earliestMin, sMin);
        latestMin = Math.max(latestMin, eMin);
      }
    }

    for (const m of missions) {
      if (m.scheduled_start) {
        const dateKey = formatDateKey(m.scheduled_start);
        if (weekDateStrs.has(dateKey)) {
          const ds = new Date(m.scheduled_start);
          const sMin = ds.getHours() * 60 + ds.getMinutes();
          let eMin = sMin + 45;
          if (m.scheduled_end) {
            const de = new Date(m.scheduled_end);
            eMin = Math.max(sMin + 15, de.getHours() * 60 + de.getMinutes());
          }
          earliestMin = Math.min(earliestMin, sMin);
          latestMin = Math.max(latestMin, eMin);
        }
      }
    }

    if (isFullDay) {
      return {
        startHour: MIN_HOUR,
        endHour: MAX_HOUR,
        outOfRangeCount: 0,
      };
    }

    const computedStart = Math.max(MIN_HOUR, Math.min(DEFAULT_START, Math.floor(earliestMin / 60)));
    const computedEnd = Math.min(MAX_HOUR, Math.max(DEFAULT_END, Math.ceil(latestMin / 60) + 1));

    let outBefore = 0;
    let outAfter = 0;
    if (earliestMin < computedStart * 60) outBefore++;
    if (latestMin > computedEnd * 60) outAfter++;

    return {
      startHour: computedStart,
      endHour: computedEnd,
      outOfRangeCount: outBefore + outAfter,
      outBefore,
      outAfter,
    };
  }, [isFullDay, resolvedDays, missions, days]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = timeRange.startHour; h <= timeRange.endHour; h++) {
      list.push(h);
    }
    return list;
  }, [timeRange.startHour, timeRange.endHour]);

  const totalGridMinutes = useMemo(() => {
    return Math.max(60, (timeRange.endHour - timeRange.startHour) * 60);
  }, [timeRange.startHour, timeRange.endHour]);

  const gridHeight = useMemo(() => {
    return Math.max(760, (timeRange.endHour - timeRange.startHour) * 58);
  }, [timeRange.startHour, timeRange.endHour]);

  const currentTotalMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentMinutesOffset = currentTotalMin - timeRange.startHour * 60;
  const isTimeInGrid = currentMinutesOffset >= 0 && currentMinutesOffset <= totalGridMinutes;
  const nowPercent = (currentMinutesOffset / totalGridMinutes) * 100;

  const getBlockStyles = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const startMin = (sh ?? timeRange.startHour) * 60 + (sm || 0);
    const endMin = (eh ?? (sh ? sh + 1 : timeRange.startHour + 1)) * 60 + (em || 0);

    const gridStartMin = timeRange.startHour * 60;
    const gridEndMin = timeRange.endHour * 60;

    const clampedStartMin = Math.max(gridStartMin, startMin);
    const clampedEndMin = Math.min(gridEndMin, Math.max(clampedStartMin + 15, endMin));

    const offsetMin = clampedStartMin - gridStartMin;
    const durationMin = clampedEndMin - clampedStartMin;

    const top = (offsetMin / totalGridMinutes) * 100;
    const height = (durationMin / totalGridMinutes) * 100;

    return {
      top: `${Math.max(0, Math.min(99.5, top))}%`,
      height: `${Math.max(2.5, Math.min(100 - top, height))}%`,
      durationMinutes: Math.max(15, endMin - startMin),
    };
  };

  const getCategoryInfo = (categoryId?: string | null) => {
    const cat = categories.find((c) => c.id === categoryId);
    return {
      name: cat?.name || "General",
      color: cat?.color || "#10b981",
    };
  };

  return (
    <div className="space-y-4 font-mono">
      {/* ================= TOP TOOLBAR ================= */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-spy-border flex-wrap">
        {/* Left: View Mode (Day vs Week) & Full Day */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day / Week Switcher */}
          <div className="flex items-center p-0.5 rounded-[4px] bg-spy-surface2 border border-spy-border">
            <button
              type="button"
              onClick={() => {
                soundFX.playBlip();
                setViewMode("week");
              }}
              className={`px-3 py-1 text-xs font-bold rounded-[3px] flex items-center gap-1.5 transition-colors ${
                viewMode === "week"
                  ? "bg-[#14663a] text-white dark:bg-spy-green dark:text-black shadow-xs"
                  : "text-spy-muted hover:text-spy-text"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playBlip();
                setViewMode("day");
              }}
              className={`px-3 py-1 text-xs font-bold rounded-[3px] flex items-center gap-1.5 transition-colors ${
                viewMode === "day"
                  ? "bg-[#14663a] text-white dark:bg-spy-green dark:text-black shadow-xs"
                  : "text-spy-muted hover:text-spy-text"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Day</span>
            </button>
          </div>

          {/* Hide Routine Blocks Toggle */}
          <button
            type="button"
            onClick={() => {
              soundFX.playBlip();
              setHideRoutineBlocks((prev) => !prev);
            }}
            className={`px-2.5 py-1 text-xs rounded-[4px] border transition-all flex items-center gap-1.5 ${
              hideRoutineBlocks
                ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/40 font-bold"
                : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
            }`}
            title="Hide routine blocks to show only fixed schedule and missions"
          >
            {hideRoutineBlocks ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Hide routine</span>
          </button>

          {/* Full Day 6AM-12AM Toggle */}
          <button
            type="button"
            onClick={() => setIsFullDay((prev) => !prev)}
            className={`px-2.5 py-1 text-xs rounded-[4px] border transition-all flex items-center gap-1.5 ${
              isFullDay
                ? "bg-[#14663a] text-white border-[#14663a] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green font-bold"
                : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Full Day (6 AM–12 AM)</span>
          </button>
        </div>

        {/* Right: Small Legend (Fixed, Routine, Mission) */}
        <div className="flex items-center gap-3 text-[11px] text-spy-dim flex-wrap">
          <span className="uppercase text-[10px] font-bold text-spy-muted">LAYERS:</span>
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[9.5px] font-bold">
              <Lock className="w-2.5 h-2.5" />
              <span>Fixed</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/40 border-dashed text-[9.5px] font-normal">
              <span>Routine Focus</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-spy-green/15 text-spy-green border border-spy-green/40 text-[9.5px] font-bold">
              <Check className="w-2.5 h-2.5" />
              <span>Mission</span>
            </span>
          </div>
        </div>
      </div>

      {/* ================= DAY SELECTOR TABS (for Day view & Mobile) ================= */}
      <div className={`flex items-center gap-1 overflow-x-auto pb-2 border-b border-spy-border ${viewMode === "day" ? "flex" : "flex md:hidden"}`}>
        {days.map((dayDate, idx) => {
          const isSelected = selectedDayIndex === idx;
          const dayKey = formatDateKey(dayDate);
          const isToday = dayKey === todayKey;
          const dayRes = resolvedDays[idx];

          return (
            <button
              key={dayKey}
              onClick={() => {
                soundFX.playBlip();
                setSelectedDayIndex(idx);
              }}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-mono shrink-0 transition-colors border flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#14663a] text-white border-[#14663a] dark:bg-spy-green dark:text-black font-bold shadow-xs"
                  : isToday
                  ? "bg-spy-surface2 border-spy-green/60 text-spy-text font-bold"
                  : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text"
              }`}
            >
              <span>{dayDate.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="text-[10px] opacity-80">{dayDate.getDate()}</span>
              {dayRes.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* ================= VIEW MODE 1: DAY TIMELINE VIEW ================= */}
      {viewMode === "day" && (() => {
        const curDay = resolvedDays[selectedDayIndex];
        const dayDate = days[selectedDayIndex];
        const curDateStr = curDay.dateStr;

        // Gather all day items: Fixed, Routine, and Missions
        interface DayTimelineItem {
          id: string;
          kind: "fixed" | "routine" | "mission";
          title: string;
          startMin: number;
          endMin: number;
          startStr: string;
          endStr: string;
          categoryName?: string;
          categoryColor?: string;
          isCompleted?: boolean;
          block?: TimeBlock | ResolvedTimeBlock;
          mission?: Mission;
          academicEvent?: AcademicEvent;
          hasConflict?: boolean;
          isDeadlineMarker?: boolean;
        }

        const timelineItems: DayTimelineItem[] = [];

        // 1. Time blocks
        for (const b of curDay.blocks) {
          if (b.isSkipped) continue;
          if (hideRoutineBlocks && (b.type !== "class" && b.type !== "tuition")) continue;

          const [sh, sm] = b.start_time.split(":").map(Number);
          const [eh, em] = b.end_time.split(":").map(Number);
          const isFixed = b.type === "class" || b.type === "tuition";

          timelineItems.push({
            id: b.id,
            kind: isFixed ? "fixed" : "routine",
            title: b.label,
            startMin: (sh || 0) * 60 + (sm || 0),
            endMin: (eh || 0) * 60 + (em || 0),
            startStr: b.start_time,
            endStr: b.end_time,
            block: b,
          });
        }

        // 2. Missions scheduled today
        const dayMissions = missions.filter((m) => {
          if (!m.scheduled_start) return false;
          return formatDateKey(m.scheduled_start) === curDateStr;
        });

        for (const m of dayMissions) {
          const ds = new Date(m.scheduled_start!);
          const sMin = ds.getHours() * 60 + ds.getMinutes();
          let eMin = sMin + 45;
          let endStr = addMinutes(getLocalTimeString(m.scheduled_start!) || "14:00", 45);

          if (m.scheduled_end) {
            const de = new Date(m.scheduled_end);
            eMin = Math.max(sMin + 15, de.getHours() * 60 + de.getMinutes());
            endStr = getLocalTimeString(m.scheduled_end) || endStr;
          }
          const catInfo = getCategoryInfo(m.category_id);
          const durationMin = eMin - sMin;
          const isDeadlineMarker = durationMin > 240;

          timelineItems.push({
            id: m.id,
            kind: "mission",
            title: m.title,
            startMin: isDeadlineMarker ? Math.max(0, eMin - 15) : sMin,
            endMin: eMin,
            startStr: getLocalTimeString(m.scheduled_start!) || "14:00",
            endStr,
            categoryName: catInfo.name,
            categoryColor: catInfo.color,
            isCompleted: m.status === "completed",
            mission: m,
            isDeadlineMarker,
          });
        }

        // Detect conflicts: fixed vs fixed, fixed vs mission, mission vs mission (skip deadline markers)
        for (let i = 0; i < timelineItems.length; i++) {
          for (let j = i + 1; j < timelineItems.length; j++) {
            const a = timelineItems[i];
            const b = timelineItems[j];
            if (a.isDeadlineMarker || b.isDeadlineMarker) continue;
            const overlaps = Math.max(a.startMin, b.startMin) < Math.min(a.endMin, b.endMin);
            if (overlaps) {
              const bothNotRoutine = a.kind !== "routine" && b.kind !== "routine";
              if (bothNotRoutine) {
                a.hasConflict = true;
                b.hasConflict = true;
              }
            }
          }
        }

        // Sort chronologically
        timelineItems.sort((a, b) => a.startMin - b.startMin);

        // Generate gaps between items: "Free 1h 20m"
        interface TimelineSlot {
          type: "item" | "gap";
          item?: DayTimelineItem;
          gapStart?: string;
          gapEnd?: string;
          gapMinutes?: number;
        }

        const slots: TimelineSlot[] = [];
        let cursorMin = Math.max(timeRange.startHour * 60, 9 * 60);

        for (const it of timelineItems) {
          if (it.startMin > cursorMin && it.startMin - cursorMin >= 15) {
            const gapMin = it.startMin - cursorMin;
            const gh = Math.floor(cursorMin / 60);
            const gm = cursorMin % 60;
            const startStr = `${String(gh).padStart(2, "0")}:${String(gm).padStart(2, "0")}`;
            slots.push({
              type: "gap",
              gapStart: startStr,
              gapEnd: it.startStr,
              gapMinutes: gapMin,
            });
          }
          slots.push({ type: "item", item: it });
          cursorMin = Math.max(cursorMin, it.endMin);
        }

        return (
          <div className="clean-card p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-spy-border">
              <div>
                <h3 className="text-base font-bold text-spy-text font-sans">
                  {dayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                </h3>
                {curDay.badge && (
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-blue-500/15 text-blue-500 border border-blue-500/30">
                    {curDay.badge}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onAddBlock(curDay.weekday, curDateStr)}
                className="px-3 py-1.5 rounded-[3px] border border-spy-border hover:border-spy-green text-spy-text hover:text-spy-green text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slot</span>
              </button>
            </div>

            <div className="space-y-3">
              {slots.length === 0 ? (
                <div className="py-12 text-center text-spy-muted text-xs font-sans">
                  No scheduled items or classes for this day. Click &ldquo;+ Add Slot&rdquo; or tap a time to create a directive.
                </div>
              ) : (
                slots.map((s, idx) => {
                  if (s.type === "gap" && s.gapStart && s.gapEnd) {
                    const hours = Math.floor((s.gapMinutes || 0) / 60);
                    const mins = (s.gapMinutes || 0) % 60;
                    const durationLabel = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;

                    return (
                      <div
                        key={`gap-${idx}`}
                        className="p-2.5 rounded-[4px] border border-dashed border-spy-border/60 bg-spy-surface2/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 text-spy-dim">
                          <Clock className="w-3.5 h-3.5 text-spy-muted" />
                          <span>
                            {formatTime12(s.gapStart)} – {formatTime12(s.gapEnd)}
                          </span>
                          <span className="font-semibold text-spy-muted">
                            Free {durationLabel}
                          </span>
                        </div>
                        {onAddMissionAtSlot && (
                          <button
                            type="button"
                            onClick={() => onAddMissionAtSlot(curDateStr, s.gapStart!, s.gapEnd!)}
                            className="px-2 py-1 rounded-[3px] bg-spy-green/15 hover:bg-spy-green text-spy-green hover:text-black font-bold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Schedule</span>
                          </button>
                        )}
                      </div>
                    );
                  }

                  const it = s.item!;
                  const isBlockCancelled = Boolean((it.block as ResolvedTimeBlock)?.isCancelled);

                  if (isBlockCancelled) {
                    return (
                      <div
                        key={it.id}
                        className="p-3 rounded-[4px] border border-dashed border-spy-border bg-spy-surface2/60 dark:bg-spy-surface2/40 opacity-75 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="shrink-0 text-left">
                            <div className="text-xs font-mono text-spy-dim line-through">
                              {formatTime12(it.startStr)}
                            </div>
                            <div className="text-[10px] text-spy-dim font-mono line-through">
                              {formatTime12(it.endStr)}
                            </div>
                          </div>
                          <div className="w-[2px] h-7 bg-current/20 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-xs text-spy-dim italic">
                              Tuition cancelled
                            </div>
                          </div>
                        </div>
                        {(it.block as ResolvedTimeBlock)?.tuitionException?.id && onUndoTuitionException && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUndoTuitionException((it.block as ResolvedTimeBlock).tuitionException!.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-spy-surface border border-spy-border hover:border-spy-green text-xs font-mono font-bold text-spy-text hover:text-spy-green transition-colors cursor-pointer shadow-xs"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>Undo</span>
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={it.id}
                      onClick={() => {
                        if (it.block?.type === "tuition" && onEditTuition) {
                          onEditTuition({
                            day: it.block.weekday,
                            startTime: it.block.start_time,
                            endTime: it.block.end_time,
                            targetDate: curDateStr,
                          });
                        } else if (it.kind === "routine" && it.block) {
                          setSelectedItem({
                            kind: "routine",
                            block: it.block,
                            dateStr: curDateStr,
                          });
                        } else if (it.kind === "fixed") {
                          setSelectedItem({
                            kind: "fixed",
                            block: it.block,
                            dateStr: curDateStr,
                          });
                        } else if (it.kind === "mission" && it.mission) {
                          if (onEditMission) onEditMission(it.mission);
                        }
                      }}
                      className={`p-3.5 rounded-[4px] border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs ${
                        it.hasConflict
                          ? "border-red-500 bg-red-500/10"
                          : it.kind === "fixed"
                          ? "bg-[#eef5fc] border-[#bfdbfe] text-[#1e40af] dark:bg-[#0c1929] dark:border-[#1d3557] dark:text-[#93c5fd]"
                          : it.kind === "routine"
                          ? "bg-purple-500/10 border-dashed border-purple-500/40 text-spy-text hover:border-purple-500"
                          : "bg-spy-surface2 border-spy-green text-spy-text hover:border-spy-green"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0 text-left">
                          {it.isDeadlineMarker ? (
                            <>
                              <div className="text-[10px] font-bold font-mono text-amber-500 uppercase">
                                DEADLINE
                              </div>
                              <div className="text-xs font-bold font-mono text-spy-text">
                                {formatTime12(it.endStr)}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-xs font-bold font-mono">
                                {formatTime12(it.startStr)}
                              </div>
                              <div className="text-[10px] text-spy-dim font-mono">
                                {formatTime12(it.endStr)}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="w-[2px] h-8 bg-current/20 shrink-0" />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            {it.kind === "fixed" && (
                              <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Fixed</span>
                              </span>
                            )}
                            {it.kind === "routine" && (
                              <span className="text-[9px] uppercase text-purple-600 dark:text-purple-300 font-semibold">
                                Routine Window
                              </span>
                            )}
                            {it.kind === "mission" && !it.isDeadlineMarker && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] border truncate"
                                style={{
                                  backgroundColor: `${it.categoryColor}15`,
                                  borderColor: `${it.categoryColor}40`,
                                  color: it.categoryColor,
                                }}
                              >
                                {it.categoryName}
                              </span>
                            )}
                            {it.kind === "mission" && it.isDeadlineMarker && (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1 rounded-[2px]">
                                <Flag className="w-2.5 h-2.5" />
                                <span>Deadline Marker</span>
                              </span>
                            )}
                            {it.hasConflict && (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-500/20 px-1 rounded-[2px]">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Conflict</span>
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs font-sans font-bold leading-tight truncate ${
                              it.isCompleted ? "line-through text-spy-muted" : "text-spy-text"
                            }`}
                          >
                            {it.title}
                          </div>
                        </div>
                      </div>

                      {it.kind === "mission" && it.mission && (
                        <div className="shrink-0">
                          {!it.isCompleted ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteMission(it.mission!);
                              }}
                              className="p-1.5 rounded-[3px] bg-spy-green/20 hover:bg-spy-green text-spy-green hover:text-black transition-colors"
                              title="Accomplish directive"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-spy-green" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ================= VIEW MODE 2: WEEKLY GRID VIEW ================= */}
      {viewMode === "week" && (
        <div className="clean-card p-3 sm:p-5 overflow-x-auto">
          <div className="min-w-[1020px] relative">
            {/* Header Row: Days of Week */}
            <div className="sticky top-0 z-30 bg-spy-surface/95 backdrop-blur-xs border-b border-spy-border pb-3 mb-4 select-none">
              <div className="grid grid-cols-[64px_repeat(7,minmax(130px,1fr))] gap-2 text-center">
                <div className="text-[10px] font-mono text-spy-dim flex items-end justify-center pb-1">
                  TIME
                </div>

                {resolvedDays.map(({ dateStr, weekday, badge, isExam }, idx) => {
                  const dayDate = days[idx];
                  const isToday = dateStr === todayKey;

                  // Count conflicts for day header
                  const dayMissions = missions.filter((m) => m.scheduled_start && formatDateKey(m.scheduled_start) === dateStr);
                  const dayFixed = resolvedDays[idx].blocks.filter((b) => !b.isSkipped && (b.type === "class" || b.type === "tuition"));

                  let conflictCount = 0;
                  for (let i = 0; i < dayFixed.length; i++) {
                    const [sh1, sm1] = dayFixed[i].start_time.split(":").map(Number);
                    const [eh1, em1] = dayFixed[i].end_time.split(":").map(Number);
                    const s1 = (sh1 || 0) * 60 + (sm1 || 0);
                    const e1 = (eh1 || 0) * 60 + (em1 || 0);

                    // Check overlap with day missions (ignore > 4h deadline markers)
                    for (const m of dayMissions) {
                      const ms = new Date(m.scheduled_start!);
                      const s2 = ms.getHours() * 60 + ms.getMinutes();
                      const e2 = m.scheduled_end ? new Date(m.scheduled_end).getHours() * 60 + new Date(m.scheduled_end).getMinutes() : s2 + 45;
                      const span = e2 - s2;
                      if (span <= 240 && Math.max(s1, s2) < Math.min(e1, e2)) {
                        conflictCount++;
                      }
                    }
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`p-2 rounded-[6px] border transition-colors flex flex-col items-center justify-start min-h-[92px] gap-1.5 ${
                        isToday
                          ? "bg-[#1f7a4d]/[0.06] border-[#1f7a4d]/30 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                          : isExam
                          ? "bg-spy-red/10 border-spy-red/30"
                          : "bg-spy-surface2 border-spy-border"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-mono font-bold uppercase tracking-wider ${
                            isToday ? "text-[#14663a] dark:text-[#4ade80]" : "text-spy-text"
                          }`}
                        >
                          {weekday}
                        </span>
                        <span
                          className={`text-xs font-mono px-1.5 py-0.2 rounded-[3px] ${
                            isToday
                              ? "bg-[#14663a] text-white dark:bg-emerald-500/20 dark:text-emerald-300 font-bold"
                              : "text-spy-muted"
                          }`}
                        >
                          {dayDate.getDate()}
                        </span>
                      </div>

                      {badge && (
                        <div
                          className="text-[9px] font-mono px-2 py-0.5 rounded-[3px] border font-bold leading-tight max-w-full text-center bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30 truncate"
                          title={badge}
                        >
                          {badge.length > 18 ? `${badge.slice(0, 16)}…` : badge}
                        </div>
                      )}

                      {conflictCount > 0 && (
                        <div className="flex items-center gap-1 text-[8.5px] font-mono font-bold text-red-500 bg-red-500/20 border border-red-500/40 px-1.5 py-0.2 rounded-[2px]">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          <span>{conflictCount} conflict{conflictCount > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Body */}
            <div
              style={{ height: `${gridHeight}px` }}
              className="relative grid grid-cols-[64px_repeat(7,minmax(130px,1fr))] gap-2 select-none pb-6 mb-6 border-b border-spy-border/40"
            >
              {/* Left Hour Axis */}
              <div className="relative h-full text-right pr-2">
                {isTimeInGrid && (
                  <div
                    style={{ top: `${nowPercent}%` }}
                    className="absolute left-0.5 -translate-y-1/2 z-20 flex items-center gap-1 pointer-events-none"
                  >
                    <span className="w-2 h-2 rounded-full bg-spy-red animate-pulse shrink-0" />
                    <span className="text-[7.5px] font-mono font-bold text-white bg-spy-red px-1 py-0.2 rounded-[2px] leading-tight shadow-sm">
                      NOW
                    </span>
                  </div>
                )}

                {hours.map((hour, idx) => {
                  const percent = (idx / (hours.length - 1)) * 100;
                  const ampm = hour === 24 || hour === 0 ? "AM" : hour >= 12 ? "PM" : "AM";
                  const displayHour = hour === 24 || hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

                  return (
                    <div
                      key={hour}
                      style={{ top: `${percent}%` }}
                      className="absolute right-1 -translate-y-1/2 text-[10px] font-mono text-spy-muted"
                    >
                      {displayHour} {ampm}
                    </div>
                  );
                })}
              </div>

              {/* 7 Columns for Days */}
              {resolvedDays.map(({ dateStr, blocks }, idx) => {
                const isToday = dateStr === todayKey;

                // Day missions
                const dayMissions = missions
                  .filter((m) => m.scheduled_start && formatDateKey(m.scheduled_start) === dateStr)
                  .map((m) => {
                    const ds = new Date(m.scheduled_start!);
                    const startStr = getLocalTimeString(m.scheduled_start!) || "14:00";
                    let endStr = addMinutes(startStr, 45);
                    let durationMin = 45;

                    if (m.scheduled_end) {
                      endStr = getLocalTimeString(m.scheduled_end) || endStr;
                      const de = new Date(m.scheduled_end);
                      durationMin = Math.max(15, Math.round((de.getTime() - ds.getTime()) / 60000));
                    }

                    const [sh, sm] = startStr.split(":").map(Number);
                    const [eh, em] = endStr.split(":").map(Number);
                    const rawStartMin = (sh || 0) * 60 + (sm || 0);
                    const rawEndMin = (eh || 0) * 60 + (em || 0);
                    const isDeadlineMarker = durationMin > 240;

                    return {
                      mission: m,
                      startStr,
                      endStr,
                      startMin: isDeadlineMarker ? Math.max(0, rawEndMin - 15) : rawStartMin,
                      endMin: rawEndMin,
                      rawStartMin,
                      rawEndMin,
                      durationMin,
                      isDeadlineMarker,
                    };
                  });

                // Routine blocks vs Fixed blocks
                const activeBlocks = blocks.filter((b) => !b.isSkipped);
                const fixedBlocks = activeBlocks.filter((b) => b.type === "class" || b.type === "tuition");
                const routineBlocks = hideRoutineBlocks
                  ? []
                  : activeBlocks.filter((b) => b.type !== "class" && b.type !== "tuition");

                // Layout sub-columns ONLY for missions that truly overlap other missions
                const positionedMissions = layoutSubColumns(
                  dayMissions.map((m) => ({
                    ...m,
                    id: m.mission.id,
                  }))
                );

                return (
                  <div
                    key={dateStr}
                    id={`planner-day-col-${idx}`}
                    className={`relative h-full rounded-[6px] border transition-colors overflow-hidden cursor-pointer ${
                      isToday
                        ? "bg-[#1f7a4d]/[0.03] border-spy-border border-t-2 border-t-[#1f7a4d] dark:bg-[rgba(34,197,94,0.05)] dark:border-spy-border dark:border-t-2 dark:border-t-spy-green"
                        : "bg-spy-surface border-spy-border"
                    }`}
                    onClick={(e) => {
                      // Click on empty space creates mission
                      if (e.target !== e.currentTarget) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickY = e.clientY - rect.top;
                      const percent = Math.max(0, Math.min(1, clickY / rect.height));
                      const totalMin = (timeRange.endHour - timeRange.startHour) * 60;
                      const clickedMin = timeRange.startHour * 60 + percent * totalMin;

                      const roundedMin = Math.round(clickedMin / 15) * 15;
                      const shh = Math.floor(roundedMin / 60) % 24;
                      const smm = roundedMin % 60;
                      const startStr = `${String(shh).padStart(2, "0")}:${String(smm).padStart(2, "0")}`;
                      const endMinute = roundedMin + 45;
                      const ehh = Math.floor(endMinute / 60) % 24;
                      const emm = endMinute % 60;
                      const endStr = `${String(ehh).padStart(2, "0")}:${String(emm).padStart(2, "0")}`;

                      if (onAddMissionAtSlot) {
                        onAddMissionAtSlot(dateStr, startStr, endStr);
                      }
                    }}
                  >
                    {/* Horizontal hour guide lines behind items */}
                    {hours.map((_, hIdx) => {
                      const topPercent = (hIdx / (hours.length - 1)) * 100;
                      return (
                        <div
                          key={hIdx}
                          style={{ top: `${topPercent}%` }}
                          className="absolute inset-x-0 border-b border-black/[0.05] dark:border-white/[0.05] pointer-events-none z-0"
                        />
                      );
                    })}

                    {/* NOW line strictly behind items (z-0) */}
                    {isToday && isTimeInGrid && (
                      <div
                        style={{ top: `${nowPercent}%` }}
                        className="absolute inset-x-0 z-0 pointer-events-none flex items-center"
                      >
                        <div className="h-[1.5px] w-full bg-spy-red/70 shadow-xs" />
                      </div>
                    )}

                    {/* ================= 1. ROUTINE BLOCKS (SOFT FOCUS WINDOWS) ================= */}
                    {routineBlocks.map((block) => {
                      const style = getBlockStyles(block.start_time, block.end_time);
                      const [bsh, bsm] = block.start_time.split(":").map(Number);
                      const [beh, bem] = block.end_time.split(":").map(Number);
                      const bStart = (bsh || 0) * 60 + (bsm || 0);
                      const bEnd = (beh || 0) * 60 + (bem || 0);

                      // Check if any mission overlaps this routine block (ignore > 4h deadline markers)
                      const overlappingMissions = dayMissions.filter(
                        (m) => !m.isDeadlineMarker && Math.max(m.startMin, bStart) < Math.min(m.endMin, bEnd)
                      );
                      const hasMissionOverlap = overlappingMissions.length > 0;

                      return (
                        <div
                          key={block.id}
                          data-planner-kind="routine"
                          style={{
                            top: style.top,
                            height: style.height,
                            left: "4px",
                            width: "calc(100% - 8px)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem({
                              kind: "routine",
                              block,
                              dateStr,
                            });
                          }}
                          className={`absolute rounded-[5px] border-2 border-dashed p-1.5 transition-all flex flex-col justify-between overflow-hidden cursor-pointer ${
                            hasMissionOverlap
                              ? "bg-purple-500/5 border-purple-400/25 opacity-25 pointer-events-none z-10"
                              : "bg-purple-500/10 border-purple-400/40 text-purple-700 dark:text-purple-300 hover:border-purple-500 z-10"
                          }`}
                          title={`${block.label} (${formatShortTimeRange(block.start_time, block.end_time)}) - Routine Focus Window`}
                        >
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-[9px] font-mono text-spy-dim truncate">
                              {formatShortTimeRange(block.start_time, block.end_time)}
                            </div>
                            <div className="font-sans font-medium text-[10.5px] text-spy-text truncate leading-tight mt-0.5">
                              {block.label}
                            </div>
                          </div>
                          {!hasMissionOverlap && (
                            <div className="text-[8.5px] font-mono text-spy-dim mt-auto truncate">
                              Free window
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* ================= 2. FIXED BLOCKS (CLASSES, TUITION) ================= */}
                    {fixedBlocks.map((block) => {
                      const style = getBlockStyles(block.start_time, block.end_time);
                      const isTuition = block.type === "tuition";

                      if (block.isCancelled) {
                        return (
                          <div
                            key={block.id}
                            data-planner-kind="cancelled-tuition"
                            style={{
                              top: style.top,
                              height: style.height,
                              left: "4px",
                              width: "calc(100% - 8px)",
                            }}
                            className="absolute rounded-[5px] border border-dashed border-spy-border bg-spy-surface2/60 dark:bg-spy-surface2/40 text-spy-dim p-1.5 transition-all flex flex-col justify-between overflow-hidden z-15 backdrop-blur-xs opacity-75 shadow-xs"
                            title="Tuition cancelled"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono leading-tight">
                              <span className="line-through opacity-70">
                                {formatShortTimeRange(block.start_time, block.end_time)}
                              </span>
                              {block.tuitionException?.id && onUndoTuitionException && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUndoTuitionException(block.tuitionException!.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-spy-surface border border-spy-border hover:border-spy-green text-spy-text hover:text-spy-green text-[9px] font-mono font-bold transition-colors cursor-pointer shadow-xs"
                                  title="Undo cancellation"
                                >
                                  <Undo2 className="w-2.5 h-2.5" />
                                  <span>Undo</span>
                                </button>
                              )}
                            </div>
                            <div className="font-mono text-[10px] text-spy-dim italic truncate mt-0.5">
                              Tuition cancelled
                            </div>
                          </div>
                        );
                      }

                      const [bsh, bsm] = block.start_time.split(":").map(Number);
                      const [beh, bem] = block.end_time.split(":").map(Number);
                      const bStart = (bsh || 0) * 60 + (bsm || 0);
                      const bEnd = (beh || 0) * 60 + (bem || 0);

                      // Check conflict with missions (ignore > 4h deadline markers)
                      const conflictMission = dayMissions.find(
                        (m) => !m.isDeadlineMarker && Math.max(m.startMin, bStart) < Math.min(m.endMin, bEnd)
                      );

                      return (
                        <div
                          key={block.id}
                          data-planner-kind="fixed"
                          style={{
                            top: style.top,
                            height: style.height,
                            left: "4px",
                            width: "calc(100% - 8px)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isTuition && onEditTuition) {
                              onEditTuition({
                                day: block.weekday,
                                startTime: block.start_time,
                                endTime: block.end_time,
                                targetDate: dateStr,
                              });
                            } else {
                              setSelectedItem({
                                kind: "fixed",
                                block,
                                dateStr,
                                conflictWith: conflictMission ? conflictMission.mission.title : null,
                              });
                            }
                          }}
                          className={`absolute rounded-[5px] border p-1.5 transition-all shadow-xs flex flex-col justify-between overflow-hidden z-15 cursor-pointer ${
                            conflictMission
                              ? "border-red-500 bg-red-500/10 text-red-500"
                              : isTuition
                              ? "bg-[#fef4ea] border-[#fed7aa] text-[#9a3412] dark:bg-[#201207] dark:border-[#43230e] dark:text-[#fdba74]"
                              : "bg-[#eef5fc] border-[#bfdbfe] text-[#1e40af] dark:bg-[#0c1929] dark:border-[#1d3557] dark:text-[#93c5fd]"
                          }`}
                          title={`${block.label} (${formatShortTimeRange(block.start_time, block.end_time)}) - Protected Fixed Schedule`}
                        >
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center justify-between text-[9px] font-mono font-bold leading-tight truncate">
                              <span className="flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 shrink-0" />
                                <span>{formatShortTimeRange(block.start_time, block.end_time)}</span>
                              </span>
                              {conflictMission && (
                                <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                              )}
                            </div>
                            <div className="font-sans font-bold text-[11px] leading-tight truncate text-spy-text mt-0.5">
                              {block.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* ================= 3. MISSIONS (SOLID, CONTRAST, ON TOP z-20) ================= */}
                    {positionedMissions.map((pos) => {
                      const isDeadlineMarker = pos.durationMin > 240 || pos.isDeadlineMarker;
                      let topCss = "";
                      let heightCss = "";

                      if (isDeadlineMarker) {
                        const gridStartMin = timeRange.startHour * 60;
                        const clampedEndMin = Math.max(gridStartMin, Math.min(timeRange.endHour * 60, pos.endMin));
                        const endPercent = Math.max(0, Math.min(97, ((clampedEndMin - gridStartMin) / totalGridMinutes) * 100));
                        topCss = `calc(${endPercent}% - 14px)`;
                        heightCss = "28px";
                      } else {
                        const style = getBlockStyles(pos.startStr, pos.endStr);
                        topCss = style.top;
                        heightCss = style.height;
                      }

                      const isCompleted = pos.mission.status === "completed";
                      const catInfo = getCategoryInfo(pos.mission.category_id);
                      const isShort = pos.durationMin < 30;

                      // Check conflict with fixed blocks (only if not a deadline marker)
                      const conflictFixed = !isDeadlineMarker
                        ? fixedBlocks.find((fb) => {
                            const [fsh, fsm] = fb.start_time.split(":").map(Number);
                            const [feh, fem] = fb.end_time.split(":").map(Number);
                            const fs = (fsh || 0) * 60 + (fsm || 0);
                            const fe = (feh || 0) * 60 + (fem || 0);
                            return Math.max(pos.startMin, fs) < Math.min(pos.endMin, fe);
                          })
                        : undefined;

                      const hasConflict = Boolean(conflictFixed) || (!isDeadlineMarker && pos.totalCols > 1);

                      // Width calculations
                      const colWidthPercent = 100 / pos.totalCols;
                      const colLeftPercent = pos.colIndex * colWidthPercent;
                      const widthCss = pos.totalCols > 1 ? `calc(${colWidthPercent}% - 4px)` : "calc(100% - 8px)";
                      const leftCss = pos.totalCols > 1 ? `calc(${colLeftPercent}% + 2px)` : "4px";

                      const tooltipPayload = {
                        id: pos.mission.id,
                        title: pos.mission.title,
                        time: isDeadlineMarker
                          ? `Deadline: ${formatTime12(pos.endStr)} (span ${Math.round(pos.durationMin / 60)}h)`
                          : `${formatTime12(pos.startStr)} – ${formatTime12(pos.endStr)}`,
                        category: catInfo.name,
                        categoryColor: catInfo.color,
                        status: isCompleted ? "Completed" : "In Progress",
                        xp: pos.mission.xp,
                        notes: pos.mission.notes,
                      };

                      return (
                        <div
                          key={`mission-${pos.mission.id}`}
                          style={{
                            top: topCss,
                            height: heightCss,
                            left: leftCss,
                            width: widthCss,
                          }}
                          onClick={() => {
                            if (onEditMission) onEditMission(pos.mission);
                          }}
                          onMouseEnter={() => setActiveTooltip(tooltipPayload)}
                          onMouseLeave={() => setActiveTooltip((curr) => (curr?.id === pos.mission.id ? null : curr))}
                          className={`absolute rounded-[5px] border p-1.5 transition-all shadow-sm flex flex-col justify-between overflow-hidden z-20 cursor-pointer ${
                            hasConflict
                              ? "border-red-500 border-2 bg-red-500/15 text-red-500"
                              : isDeadlineMarker
                              ? "bg-amber-500/10 border-amber-500 text-spy-text hover:border-amber-400"
                              : isCompleted
                              ? "bg-spy-surface2/95 border-spy-green/50 text-spy-text"
                              : "bg-spy-surface2/95 border-spy-green text-spy-text hover:shadow-md"
                          }`}
                        >
                          {/* Accent Bar */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[4px]"
                            style={{ backgroundColor: hasConflict ? "#ef4444" : isDeadlineMarker ? "#f59e0b" : catInfo.color }}
                          />

                          {isDeadlineMarker ? (
                            <div className="flex items-center justify-between gap-1 w-full h-full text-[9px] font-mono px-1">
                              <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                                <Flag className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                <span className="font-bold text-amber-500 shrink-0">DUE {formatTime12(pos.endStr)}:</span>
                                <span className={`font-sans font-bold truncate ${isCompleted ? "line-through text-spy-muted" : "text-spy-text"}`}>
                                  {pos.mission.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-spy-green font-bold text-[8px]">+{pos.mission.xp} XP</span>
                                {!isCompleted ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCompleteMission(pos.mission);
                                    }}
                                    className="p-0.5 rounded-[2px] bg-spy-green/20 hover:bg-spy-green text-spy-green hover:text-black transition-colors"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-spy-green" />
                                )}
                              </div>
                            </div>
                          ) : isShort ? (
                            <div className="flex items-center gap-1.5 truncate text-[9px] font-mono">
                              <Target className="w-2.5 h-2.5 text-spy-green shrink-0" />
                              <span className="font-bold truncate">{pos.mission.title}</span>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0 flex-1 overflow-hidden pl-1">
                                <div className="flex items-center justify-between text-[8.5px] font-mono leading-tight truncate">
                                  <span className="font-bold truncate">
                                    {formatShortTimeRange(pos.startStr, pos.endStr)}
                                  </span>
                                  {hasConflict && (
                                    <AlertTriangle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                  )}
                                </div>
                                <div
                                  className={`font-sans font-bold text-[10.5px] leading-snug line-clamp-2 break-words mt-0.5 ${
                                    isCompleted ? "line-through text-spy-muted" : "text-spy-text"
                                  }`}
                                >
                                  {pos.mission.title}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[8px] font-mono pt-0.5 text-spy-muted mt-auto pl-1">
                                <span className="text-spy-green font-bold">
                                  +{pos.mission.xp} XP
                                </span>
                                {!isCompleted ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCompleteMission(pos.mission);
                                    }}
                                    className="p-0.5 rounded-[2px] bg-spy-green/20 hover:bg-spy-green text-spy-green hover:text-black transition-colors"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-spy-green" />
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= ACTIVE HOVER TOOLTIP ================= */}
      {activeTooltip && (
        <div className="fixed bottom-24 right-6 z-[60] p-3 rounded-[6px] border border-spy-border bg-spy-surface/95 backdrop-blur-md shadow-2xl max-w-sm">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span
              className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] font-bold border"
              style={{
                backgroundColor: `${activeTooltip.categoryColor}15`,
                borderColor: `${activeTooltip.categoryColor}40`,
                color: activeTooltip.categoryColor,
              }}
            >
              {activeTooltip.category}
            </span>
            <span className="text-[10px] font-mono text-spy-green font-bold">
              +{activeTooltip.xp} XP
            </span>
          </div>
          <h4 className="text-xs font-sans font-bold text-spy-text leading-snug mb-1">
            {activeTooltip.title}
          </h4>
          <div className="flex items-center gap-2 text-[10px] font-mono text-spy-muted">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{activeTooltip.time}</span>
            <span>•</span>
            <span className="capitalize">{activeTooltip.status}</span>
          </div>
        </div>
      )}

      {/* ================= UNIFIED ITEM SIDE PANEL / MODAL ================= */}
      {selectedItem && (
        <PlannerItemPanel
          isOpen={Boolean(selectedItem)}
          item={selectedItem}
          categories={categories}
          onClose={() => setSelectedItem(null)}
          onSaveRoutine={async (blockId, updates, scope, dateStr) => {
            if (onSaveRoutine) {
              await onSaveRoutine(blockId, updates, scope, dateStr);
            }
          }}
          onDeleteRoutine={async (blockId, scope, dateStr) => {
            if (onDeleteRoutine) {
              await onDeleteRoutine(blockId, scope, dateStr);
            }
          }}
          onEditMission={(m) => {
            setSelectedItem(null);
            if (onEditMission) onEditMission(m);
          }}
          onQuickMoveMission={onQuickMoveMission}
          onOpenTuitionModal={onEditTuition}
          onOpenCourseHQ={onOpenCourseHQ}
          onOpenAcademicCalendar={onOpenAcademicCalendar}
          onAddMissionInBlock={(block, dateStr) => {
            setSelectedItem(null);
            if (onAssignMissionToBlock) onAssignMissionToBlock(block, dateStr);
          }}
        />
      )}
    </div>
  );
};
