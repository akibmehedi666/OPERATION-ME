"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TimeBlock, 
  AcademicEvent, 
  Mission, 
  TimeBlockType,
  DayOfWeek,
  Category
} from "@/types/database";
import { 
  resolveDaySchedule, 
  getDaysOfWeek, 
  formatDateKey,
  getLocalTimeString
} from "@/lib/scheduleResolver";
import { 
  calculateBlockFill 
} from "@/lib/plannerScheduler";
import { formatTime12, formatShortTimeRange } from "@/lib/formatters";
import { 
  Check, 
  Plus, 
  AlertTriangle, 
  Calendar as CalendarIcon,
  ShieldAlert,
  CreditCard,
  Laptop,
  CheckCircle2,
  Target,
  Flag,
  Clock
} from "lucide-react";

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
}

const categoryToCourseMap: Record<string, string> = {
  "cat-1": "course-os",
  "cat-2": "course-os-lab",
  "cat-3": "course-econ",
  "cat-4": "course-dip",
  "cat-5": "course-stat",
  "cat-6": "course-fydp",
};

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = (timeStr || "14:00").split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + minutes;
  const newH = Math.min(23, Math.floor(total / 60));
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function formatHourLabel(hour: number): string {
  if (hour === 24 || hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

interface PositionedMission {
  mission: Mission;
  startStr: string;
  endStr: string;
  startMin: number;
  endMin: number;
  colIndex: number;
  totalCols: number;
}

/**
 * Computes side-by-side layout coordinates for overlapping scheduled missions on the same day.
 */
function layoutOverlappingMissions(
  dayMissions: Array<{ mission: Mission; startStr: string; endStr: string }>
): PositionedMission[] {
  if (dayMissions.length === 0) return [];

  const items = dayMissions.map((item) => {
    const [sh, sm] = item.startStr.split(":").map(Number);
    const [eh, em] = item.endStr.split(":").map(Number);
    const startMin = (sh || 0) * 60 + (sm || 0);
    const endMin = Math.max(startMin + 20, (eh || 0) * 60 + (em || 0));
    return { ...item, startMin, endMin, colIndex: 0, totalCols: 1 };
  });

  // Sort by start minute ascending, then duration descending
  items.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  // Cluster overlapping items
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

  // Assign greedy lanes/columns within each cluster
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
  onEditBlock,
  onAddBlock,
  onAssignMissionToBlock,
  onConfirmAutoSchedule,
  onCompleteMission,
  onOpenCourseHQ,
  onEditMission,
  onEditTuition,
}) => {
  const [selectedMobileDayIndex, setSelectedMobileDayIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
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

  // Full day preference persisted to localStorage
  const [isFullDay, setIsFullDay] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("op_me_planner_full_day") === "true";
    }
    return false;
  });

  const handleToggleFullDay = () => {
    setIsFullDay((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("op_me_planner_full_day", String(next));
      }
      return next;
    });
  };

  // Update current time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const days = useMemo(() => getDaysOfWeek(weekStartDate), [weekStartDate]);
  const todayKey = formatDateKey(currentTime);

  // Auto-select today on mobile if in view
  useEffect(() => {
    const idx = days.findIndex((d) => formatDateKey(d) === todayKey);
    if (idx !== -1) {
      setSelectedMobileDayIndex(idx);
    }
  }, [days, todayKey]);

  // Resolve schedule for each of the 7 days
  const resolvedDays = useMemo(() => {
    return days.map((dayDate) => {
      return resolveDaySchedule(dayDate, timeBlocks, academicEvents, missions);
    });
  }, [days, timeBlocks, academicEvents, missions]);

  // --------------------------------------------------------------------------
  // DYNAMIC TIME RANGE CALCULATION:
  // Base: 9 AM (540m) to 10 PM (1320m)
  // Dynamic: start = min(9 AM, earliest start in week, rounded down to hour)
  //          end = max(10 PM, latest end in week, rounded up to hour, +1h padding)
  // Clamped strictly between 6 AM (6) and 12 AM (24).
  // Full Day toggle forces: 6 AM (6) to 12 AM (24).
  // --------------------------------------------------------------------------
  const timeRange = useMemo(() => {
    const DEFAULT_START = 9;  // 9 AM
    const DEFAULT_END = 22;   // 10 PM
    const MIN_HOUR = 6;       // 6 AM
    const MAX_HOUR = 24;      // 12 AM (Midnight)

    const weekDateStrs = new Set(days.map((d) => formatDateKey(d)));
    let earliestMin = DEFAULT_START * 60; // 540
    let latestMin = DEFAULT_END * 60;     // 1320

    // Scan Day Blocks
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

    // Scan Missions (Scheduled & Deadline)
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
      } else if (m.deadline) {
        const deadKey = formatDateKey(m.deadline);
        if (weekDateStrs.has(deadKey)) {
          const dd = new Date(m.deadline);
          const dMin = dd.getHours() * 60 + dd.getMinutes();
          earliestMin = Math.min(earliestMin, dMin);
          latestMin = Math.max(latestMin, dMin + 20);
        }
      }
    }

    // If Full Day is explicitly active:
    if (isFullDay) {
      const outBefore = earliestMin < MIN_HOUR * 60 ? 1 : 0;
      const outAfter = latestMin > MAX_HOUR * 60 ? 1 : 0;
      return {
        startHour: MIN_HOUR,
        endHour: MAX_HOUR,
        hasTasksBefore9AM: false,
        hasTasksAfter10PM: false,
        outOfRangeCount: outBefore + outAfter,
        outBefore,
        outAfter,
      };
    }

    // Auto mode: range expands dynamically to fit all items between 6 AM and 12 AM
    const computedStart = Math.max(MIN_HOUR, Math.min(DEFAULT_START, Math.floor(earliestMin / 60)));
    const computedEnd = Math.min(MAX_HOUR, Math.max(DEFAULT_END, Math.ceil(latestMin / 60) + 1));

    // Warning only counts items strictly outside the visible range [computedStart, computedEnd]
    let outBefore = 0;
    let outAfter = 0;
    if (earliestMin < computedStart * 60) outBefore++;
    if (latestMin > computedEnd * 60) outAfter++;

    return {
      startHour: computedStart,
      endHour: computedEnd,
      hasTasksBefore9AM: outBefore > 0,
      hasTasksAfter10PM: outAfter > 0,
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

  // Dynamic height: 58px per hour interval, minimum 760px
  const gridHeight = useMemo(() => {
    return Math.max(760, (timeRange.endHour - timeRange.startHour) * 58);
  }, [timeRange.startHour, timeRange.endHour]);

  // Current time line calculation
  const currentTotalMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentMinutesOffset = currentTotalMin - timeRange.startHour * 60;
  const isTimeInGrid = currentMinutesOffset >= 0 && currentMinutesOffset <= totalGridMinutes;
  const nowPercent = (currentMinutesOffset / totalGridMinutes) * 100;

  // Calculate top & height percentage for a time range relative to dynamic grid
  const getBlockStyles = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const startMin = (sh ?? timeRange.startHour) * 60 + (sm || 0);
    const endMin = (eh ?? (sh ? sh + 1 : timeRange.startHour + 1)) * 60 + (em || 0);

    const gridStartMin = timeRange.startHour * 60;
    const gridEndMin = timeRange.endHour * 60;

    // Clamp within grid boundaries so blocks NEVER render outside grid container
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

  // Block color tokens for both Light and Dark themes
  const getBlockThemeClasses = (type: TimeBlockType) => {
    switch (type) {
      case "class":
        return {
          card: "bg-[#eef5fc] border-[#bfdbfe] text-[#1e40af] dark:bg-[#0c1929] dark:border-[#1d3557] dark:text-[#93c5fd]",
          badge: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe] dark:bg-[#13273e] dark:text-[#bfdbfe]",
          accent: "#3b82f6",
        };
      case "tuition":
        return {
          card: "bg-[#fef4ea] border-[#fed7aa] text-[#9a3412] dark:bg-[#201207] dark:border-[#43230e] dark:text-[#fdba74]",
          badge: "bg-[#ffedd5] text-[#9a3412] border-[#fed7aa] dark:bg-[#321c0e] dark:text-[#fed7aa]",
          accent: "#f97316",
        };
      case "project":
        return {
          card: "bg-[#edf9f0] border-[#bbf7d0] text-[#15803d] dark:bg-[#0a1e12] dark:border-[#163e26] dark:text-[#86efac]",
          badge: "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] dark:bg-[#0f2e1c] dark:text-[#bbf7d0]",
          accent: "#22c55e",
        };
      case "study":
        return {
          card: "bg-[#f6f0fd] border-[#e9d5ff] text-[#6b21a8] dark:bg-[#1a0c26] dark:border-[#381a52] dark:text-[#d8b4fe]",
          badge: "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff] dark:bg-[#28133b] dark:text-[#e9d5ff]",
          accent: "#a855f7",
        };
      case "cp":
        return {
          card: "bg-[#fff7ed] border-[#fed7aa] text-[#c2410c] dark:bg-[#2a1306] dark:border-[#5a2a0c] dark:text-[#fdba74]",
          badge: "bg-[#ffedd5] text-[#c2410c] border-[#fed7aa] dark:bg-[#3d1a08] dark:text-[#fdba74]",
          accent: "#f97316",
        };
      case "break":
        return {
          card: "bg-[#f4f4f5] border-[#e4e4e7] text-[#52525b] dark:bg-[#18181b] dark:border-[#27272a] dark:text-[#a1a1aa]",
          badge: "bg-[#e4e4e7] text-[#52525b] border-[#d4d4d8] dark:bg-[#27272a] dark:text-[#a1a1aa]",
          accent: "#71717a",
        };
      default:
        return {
          card: "bg-spy-surface2 border-spy-border text-spy-muted",
          badge: "bg-spy-surface text-spy-dim border-spy-border",
          accent: "#64748b",
        };
    }
  };

  // Helper to format short label for override/academic chips
  const formatShortBadge = (text?: string): { short: string; full: string } => {
    if (!text) return { short: "", full: "" };
    const t = text.trim();
    if (/online\s+saturday/i.test(t)) return { short: "Online Sat", full: t };
    if (/online\s+wednesday/i.test(t)) return { short: "Online Wed", full: t };
    if (/last\s+day.*withdrawal/i.test(t)) return { short: "Last Day Drop", full: t };
    if (/last\s+day.*grade/i.test(t)) return { short: "Grades Due", full: t };
    if (/installment/i.test(t)) return { short: "Payment Due", full: t };
    if (/suspension|suspended/i.test(t)) return { short: "Suspended", full: t };
    if (/final\s+exam/i.test(t)) return { short: "Final Exam", full: t };
    if (/mid\s*term/i.test(t)) return { short: "Midterm", full: t };
    return { short: t.length > 16 ? `${t.slice(0, 14)}…` : t, full: t };
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "holiday":
        return {
          pill: "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
          icon: <ShieldAlert className="w-2.5 h-2.5 text-gray-500" />,
        };
      case "exam":
        return {
          pill: "bg-spy-redMuted text-spy-red border-spy-red/30",
          icon: <AlertTriangle className="w-2.5 h-2.5 text-spy-red" />,
        };
      case "payment":
        return {
          pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: <CreditCard className="w-2.5 h-2.5 text-amber-500" />,
        };
      case "class_override":
        return {
          pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
          icon: <Laptop className="w-2.5 h-2.5 text-blue-500" />,
        };
      default:
        return {
          pill: "bg-spy-surface2 text-spy-muted border-spy-border",
          icon: <CalendarIcon className="w-2.5 h-2.5 text-spy-muted" />,
        };
    }
  };

  const getCategoryInfo = (categoryId?: string | null) => {
    const cat = categories.find((c) => c.id === categoryId);
    return {
      name: cat?.name || "General",
      color: cat?.color || "#10b981",
    };
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Full Day Toggle & Dynamic Indicator */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-spy-border/50 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Full Day Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullDay}
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[4px] border transition-all flex items-center gap-1.5 ${
              isFullDay
                ? "bg-[#14663a] text-white border-[#14663a] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green shadow-xs"
                : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text hover:border-spy-borderLight"
            }`}
            title="Toggle full 24h operational day window (6 AM – 12 AM)"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Full Day (6 AM – 12 AM)</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isFullDay ? "bg-white dark:bg-spy-green" : "bg-spy-muted/50"
              }`}
            />
          </button>

          {/* Range Summary pill showing real computed range */}
          <span className="text-[11px] font-mono text-spy-dim">
            Visible: {formatHourLabel(timeRange.startHour)} – {formatHourLabel(timeRange.endHour)}
          </span>
        </div>

        {/* Out of Range Indicator (strictly only when items exist outside the visible range) */}
        {timeRange.outOfRangeCount > 0 && (
          <button
            type="button"
            onClick={handleToggleFullDay}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-[4px] hover:bg-amber-500/20 transition-all shadow-xs"
            title="Click to expand time grid to Full Day (6 AM – 12 AM)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {timeRange.outAfter > 0 && timeRange.outBefore > 0
                ? `${timeRange.outOfRangeCount} tasks outside visible range`
                : timeRange.outAfter > 0
                ? `${timeRange.outAfter} task${timeRange.outAfter > 1 ? "s" : ""} after ${formatHourLabel(timeRange.endHour)}`
                : `${timeRange.outBefore} task${timeRange.outBefore > 1 ? "s" : ""} before ${formatHourLabel(timeRange.startHour)}`}
            </span>
            <span className="text-[10px] underline ml-1 font-sans font-normal opacity-85">
              Expand range
            </span>
          </button>
        )}
      </div>

      {/* Mobile Day Selector Tabs */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-2 border-b border-spy-border">
        {days.map((dayDate, idx) => {
          const isSelected = selectedMobileDayIndex === idx;
          const dayKey = formatDateKey(dayDate);
          const isToday = dayKey === todayKey;

          return (
            <button
              key={dayKey}
              onClick={() => setSelectedMobileDayIndex(idx)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-medium shrink-0 transition-colors border ${
                isSelected
                  ? "bg-[#14663a] text-white border-[#14663a] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green font-bold"
                  : isToday
                  ? "bg-spy-surface2 border-spy-green/50 text-spy-text"
                  : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text"
              }`}
            >
              <span>{dayDate.toLocaleDateString("en-US", { weekday: "short" })}</span>{" "}
              <span className="text-[10px] opacity-80">{dayDate.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid Container with min 130px column width and horizontal scroll */}
      <div className="clean-card p-3 sm:p-5 overflow-x-auto">
        <div className="min-w-[1020px] relative">
          {/* Header Row: Days of Week (Sticky Day Header) */}
          <div className="sticky top-0 z-30 bg-spy-surface/95 backdrop-blur-xs border-b border-spy-border pb-3 mb-4 select-none">
            <div className="grid grid-cols-[56px_repeat(7,minmax(130px,1fr))] gap-2 text-center">
              {/* Corner time label */}
              <div className="text-[10px] font-mono text-spy-dim flex items-end justify-center pb-1">
                TIME
              </div>

              {resolvedDays.map(({ dateStr, weekday, events, badge, isHoliday, isExam }, idx) => {
                const dayDate = days[idx];
                const isToday = dateStr === todayKey;
                const badgeInfo = formatShortBadge(badge);

                // Filter out events that duplicate the primary badge
                const nonDuplicateEvents = events.filter((ev) => {
                  if (!badge) return true;
                  const bNorm = badge.toLowerCase();
                  const eNorm = ev.title.toLowerCase();
                  return !bNorm.includes(eNorm) && !eNorm.includes(bNorm);
                });

                return (
                  <div
                    key={dateStr}
                    className={`p-2 rounded-[6px] border transition-colors flex flex-col items-center justify-start min-h-[92px] sm:min-h-[96px] gap-1.5 ${
                      isToday
                        ? "bg-[#1f7a4d]/[0.06] border-[#1f7a4d]/30 dark:bg-emerald-950/20 dark:border-emerald-800/40 shadow-none"
                        : isExam
                        ? "bg-[#fce8e0]/20 border-spy-red/30 dark:bg-spy-red/10 dark:border-spy-red/30 shadow-none"
                        : "bg-spy-surface2 border-spy-border shadow-none"
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
                            ? "bg-[#14663a] text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 font-bold"
                            : "text-spy-muted"
                        }`}
                      >
                        {dayDate.getDate()}
                      </span>
                    </div>

                    {/* Single Non-duplicate Override / Holiday Badge */}
                    {badge && (
                      <div
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-[3px] border font-bold leading-tight max-w-full text-center ${
                          isHoliday
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                            : isExam
                            ? "bg-[#fce8e0] text-[#b23a12] border-[#facfb7] dark:bg-spy-red/20 dark:text-spy-red dark:border-spy-red/30"
                            : "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/50"
                        }`}
                        title={badgeInfo.full}
                      >
                        {badgeInfo.short}
                      </div>
                    )}

                    {/* Non-duplicate Other Academic Events */}
                    {nonDuplicateEvents.length > 0 && !badge && (
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {nonDuplicateEvents.slice(0, 1).map((ev) => {
                          const style = getEventBadge(ev.type);
                          const evInfo = formatShortBadge(ev.title);
                          return (
                            <span
                              key={ev.id}
                              className={`inline-flex items-center gap-1 text-[8.5px] font-mono px-1.5 py-0.5 rounded-[3px] border font-semibold ${style.pill}`}
                              title={evInfo.full}
                            >
                              {style.icon}
                              <span>{evInfo.short}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Area: Time Axis on Left + 7 Columns (with 24px space below before legend) */}
          <div
            style={{ height: `${gridHeight}px` }}
            className="relative grid grid-cols-[56px_repeat(7,minmax(130px,1fr))] gap-2 select-none pb-6 mb-6 border-b border-spy-border/40"
          >
            {/* Left Hour Axis with NOW indicator pill on the left edge */}
            <div className="relative h-full text-right pr-2">
              {/* NOW Pill on the left edge of the time axis */}
              {isTimeInGrid && (
                <div
                  style={{ top: `${nowPercent}%` }}
                  className="absolute left-0 -translate-y-1/2 z-20 flex items-center gap-1 pointer-events-none"
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
                    className="absolute right-2 -translate-y-1/2 text-[10px] font-mono text-spy-muted"
                  >
                    {displayHour} {ampm}
                  </div>
                );
              })}
            </div>

            {/* 7 Columns for Days */}
            {resolvedDays.map(({ dateStr, weekday, blocks }) => {
              const isToday = dateStr === todayKey;

              // Parse scheduled missions for this date
              const dayScheduledMissions = missions
                .filter((m) => {
                  if (!m.scheduled_start) return false;
                  return formatDateKey(m.scheduled_start) === dateStr;
                })
                .map((m) => {
                  const ds = new Date(m.scheduled_start!);
                  const startStr = getLocalTimeString(m.scheduled_start!) || "14:00";
                  let endStr = "15:00";
                  let durationMin = 45;
                  if (m.scheduled_end) {
                    endStr = getLocalTimeString(m.scheduled_end) || "15:00";
                    const de = new Date(m.scheduled_end);
                    durationMin = Math.max(15, Math.round((de.getTime() - ds.getTime()) / 60000));
                  } else {
                    const de = new Date(ds.getTime() + 45 * 60000);
                    endStr = getLocalTimeString(de) || "14:45";
                  }

                  const [sh, sm] = startStr.split(":").map(Number);
                  const [eh, em] = endStr.split(":").map(Number);
                  const startMin = (sh || 0) * 60 + (sm || 0);
                  const endMin = (eh || 0) * 60 + (em || 0);

                  return {
                    mission: m,
                    startStr,
                    endStr,
                    startMin,
                    endMin,
                    durationMin,
                  };
                });

              // Long missions (> 4 hours, e.g. 10 AM - 6 PM = 8 hrs) are treated as deadline/completion markers at their end time
              const longMissions = dayScheduledMissions.filter((item) => item.durationMin > 240);
              const normalScheduledMissions = dayScheduledMissions.filter((item) => item.durationMin <= 240);

              // Check which normal missions overlap any base blocks
              // Overlapping missions are displayed in a right 28% lane beside the blocks
              const blockIntervals = blocks.map((b) => {
                const [bsh, bsm] = b.start_time.split(":").map(Number);
                const [beh, bem] = b.end_time.split(":").map(Number);
                return {
                  id: b.id,
                  isSkipped: !!b.isSkipped,
                  startMin: (bsh || 0) * 60 + (bsm || 0),
                  endMin: (beh || 0) * 60 + (bem || 0),
                };
              });

              // Has conflicting skipped blocks (e.g. Thu Nov 12 substituted classes)
              const hasConflictingClasses = blockIntervals.some((b) => b.isSkipped);

              const laneMissions: typeof normalScheduledMissions = [];
              const standaloneMissions: typeof normalScheduledMissions = [];

              for (const sm of normalScheduledMissions) {
                const overlapsBlock = blockIntervals.some(
                  (b) => !b.isSkipped && Math.max(sm.startMin, b.startMin) < Math.min(sm.endMin, b.endMin)
                );
                if (overlapsBlock) {
                  laneMissions.push(sm);
                } else {
                  standaloneMissions.push(sm);
                }
              }

              // Standalone missions use sub-column overlap layout (split width equally)
              const positionedStandalone = layoutOverlappingMissions(
                standaloneMissions.map((item) => ({
                  mission: item.mission,
                  startStr: item.startStr,
                  endStr: item.endStr,
                }))
              );

              // Pure deadline missions on this date
              const deadlineMissions = missions.filter((m) => {
                if (m.scheduled_start) return false;
                if (!m.deadline) return false;
                return formatDateKey(m.deadline) === dateStr;
              });

              return (
                <div
                  key={dateStr}
                  className={`relative h-full rounded-[6px] border transition-colors overflow-visible ${
                    isToday
                      ? "bg-[#1f7a4d]/[0.03] border-spy-border border-t-2 border-t-[#1f7a4d] dark:bg-[rgba(34,197,94,0.05)] dark:border-spy-border dark:border-t-2 dark:border-t-spy-green shadow-none"
                      : "bg-spy-surface border-spy-border shadow-none"
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDoubleClick={() => onAddBlock(weekday, dateStr)}
                >
                  {/* Horizontal Guide Lines Behind Blocks */}
                  {hours.map((_, hIdx) => {
                    const topPercent = (hIdx / (hours.length - 1)) * 100;
                    return (
                      <div
                        key={hIdx}
                        style={{ top: `${topPercent}%` }}
                        className="absolute inset-x-0 border-b border-black/[0.06] dark:border-white/[0.06] pointer-events-none z-0"
                      />
                    );
                  })}

                  {/* "NOW" Indicator Line for Today (behind items, full width) */}
                  {isToday && isTimeInGrid && (
                    <div
                      style={{ top: `${nowPercent}%` }}
                      className="absolute inset-x-0 z-0 pointer-events-none flex items-center"
                    >
                      <div className="h-[1.5px] w-full bg-spy-red/70 shadow-xs" />
                    </div>
                  )}

                  {/* 1. Base Time Blocks */}
                  {blocks.map((block) => {
                    const style = getBlockStyles(block.start_time, block.end_time);
                    const theme = getBlockThemeClasses(block.type);
                    const fill = calculateBlockFill(block, dateStr, missions);
                    const isFlexible = block.type === "study" || block.type === "project" || block.type === "cp";
                    const isTuition = block.type === "tuition";
                    const isSkipped = !!block.isSkipped;

                    const [bsh, bsm] = block.start_time.split(":").map(Number);
                    const [beh, bem] = block.end_time.split(":").map(Number);
                    const bStart = (bsh || 0) * 60 + (bsm || 0);
                    const bEnd = (beh || 0) * 60 + (bem || 0);

                    // Does this block overlap with any lane mission?
                    const hasLaneMissionOverlap = laneMissions.some(
                      (m) => Math.max(m.startMin, bStart) < Math.min(m.endMin, bEnd)
                    );

                    // Block width & position:
                    // If skipped: occupies right 28% lane as dimmed info
                    // If regular and shares slot with lane mission or skipped block: occupies left 70% lane
                    // Otherwise: takes full width
                    let blockLeft = "4px";
                    let blockWidth = "calc(100% - 8px)";

                    if (isSkipped) {
                      blockLeft = "calc(72% + 2px)";
                      blockWidth = "calc(28% - 4px)";
                    } else if (hasLaneMissionOverlap || hasConflictingClasses) {
                      blockLeft = "2px";
                      blockWidth = "calc(70% - 4px)";
                    }

                    return (
                      <div
                        key={block.id}
                        style={{
                          top: style.top,
                          height: style.height,
                          left: blockLeft,
                          width: blockWidth,
                        }}
                        onClick={() => {
                          if (isSkipped) return;
                          if (block.type === "class" && onOpenCourseHQ) {
                            const courseId = categoryToCourseMap[block.default_category || ""] || "course-os";
                            onOpenCourseHQ(courseId);
                          } else if (isTuition && onEditTuition) {
                            onEditTuition({
                              day: weekday,
                              startTime: block.start_time,
                              endTime: block.end_time,
                              targetDate: dateStr,
                            });
                          } else if (isFlexible) {
                            onEditBlock(block, dateStr);
                          }
                        }}
                        className={`absolute rounded-[6px] border p-1.5 sm:p-2 pl-2 sm:pl-3 transition-all shadow-xs flex flex-col justify-between group z-10 overflow-hidden ${
                          isSkipped
                            ? "opacity-50 border-dashed border-spy-border bg-spy-surface/40 text-spy-dim hover:opacity-80"
                            : theme.card
                        } ${
                          !isSkipped && isFlexible
                            ? "cursor-pointer hover:ring-1 hover:ring-spy-green/50"
                            : !isSkipped && isTuition
                            ? "cursor-pointer hover:ring-1 hover:ring-yellow-500/50"
                            : ""
                        }`}
                        title={`${block.label} (${formatShortTimeRange(block.start_time, block.end_time)})${
                          isSkipped ? " - Skipped for substituted class" : isTuition ? " - Click to edit tuition routine" : ""
                        }`}
                      >
                        {/* 3px Left Accent Bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[5px]"
                          style={{ backgroundColor: isSkipped ? "#94a3b8" : theme.accent }}
                        />

                        {/* Top: Shortened time range on Line 1, Title on Line 2 with line clamp */}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-1 text-[9.5px] sm:text-[10.5px] font-mono font-bold leading-tight mb-0.5 whitespace-nowrap opacity-90 tracking-tight min-w-0 overflow-hidden">
                            <span className="truncate">
                              {formatShortTimeRange(block.start_time, block.end_time)}
                            </span>
                            {block.isOnline && (
                              <span className="px-1 rounded-[2px] bg-blue-600 text-white text-[7.5px] font-bold shrink-0">
                                ONLINE
                              </span>
                            )}
                            {isSkipped && (
                              <span className="px-1 rounded-[2px] bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[7px] font-bold shrink-0">
                                SKIPPED
                              </span>
                            )}
                          </div>

                          <div
                            className={`font-sans font-semibold text-[10.5px] sm:text-[11.5px] leading-snug line-clamp-2 break-words min-w-0 overflow-hidden ${
                              isSkipped ? "text-spy-dim line-through decoration-spy-dim/50" : "text-spy-text"
                            }`}
                            title={block.label}
                          >
                            {block.label}
                          </div>

                          {/* Overbooked Warning */}
                          {!isSkipped && fill.isOverbooked && (
                            <div className="flex items-center gap-1 text-[8.5px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1 py-0.2 rounded-[2px] mt-1 w-fit">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span>+{fill.overbookedMinutes}m</span>
                            </div>
                          )}
                        </div>

                        {/* Middle: Mission Chips inside flexible block without exact start/end */}
                        {!isSkipped && isFlexible && fill.plannedMissions.length > 0 && (
                          <div className="space-y-1 my-1 overflow-y-auto max-h-[140px] pr-0.5">
                            {fill.plannedMissions
                              .filter((m) => !m.scheduled_start || !m.scheduled_end)
                              .map((mission) => {
                                const isCompleted = mission.status === "completed";
                                const isMissed =
                                  !isCompleted && mission.deadline && new Date(mission.deadline) < currentTime;

                                return (
                                  <div
                                    key={mission.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onEditMission) onEditMission(mission);
                                    }}
                                    className={`p-1 rounded-[3px] border text-[9.5px] font-sans flex items-center justify-between gap-1 transition-all cursor-pointer min-w-0 overflow-hidden ${
                                      isCompleted
                                        ? "bg-spy-surface2 border-spy-border text-spy-text"
                                        : isMissed
                                        ? "bg-spy-redMuted border-spy-red/40 text-spy-red"
                                        : mission.is_auto_scheduled
                                        ? "border-dashed border-spy-green/60 bg-spy-surface/80"
                                        : "bg-spy-surface border-spy-border"
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span
                                          className={`font-medium line-clamp-2 break-words leading-tight ${
                                            isCompleted ? "line-through decoration-spy-dim/60 text-spy-muted" : "text-spy-text"
                                          }`}
                                        >
                                          {mission.title}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {mission.is_auto_scheduled ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onConfirmAutoSchedule(mission.id);
                                          }}
                                          className="px-1 py-0.2 text-[8.5px] font-mono font-bold bg-[#14663a] text-white dark:bg-spy-green dark:text-black rounded-[2px]"
                                          title="Confirm suggestion"
                                        >
                                          Confirm
                                        </button>
                                      ) : !isCompleted ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onCompleteMission(mission);
                                          }}
                                          className="p-0.5 rounded-[2px] bg-spy-green/20 hover:bg-spy-green text-spy-green hover:text-black transition-colors"
                                          title="Accomplish target"
                                        >
                                          <Check className="w-2.5 h-2.5" />
                                        </button>
                                      ) : (
                                        <CheckCircle2 className="w-2.5 h-2.5 text-spy-green" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* Bottom: Fill Indicator & Quick Assign button */}
                        {!isSkipped && isFlexible && (
                          <div className="mt-auto pt-1 border-t border-current/10 flex items-center justify-between text-[10px] font-mono gap-1 min-w-0 overflow-hidden">
                            <span className="opacity-70 truncate text-[8.5px] sm:text-[9px] min-w-0">
                              {fill.plannedMissions.length > 0 ? `${fill.totalPlannedMinutes}m` : `${style.durationMinutes}m free`}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignMissionToBlock(block, dateStr);
                              }}
                              className="p-0.5 sm:px-1.5 sm:py-0.5 rounded-[3px] bg-transparent hover:bg-current/10 text-current opacity-80 hover:opacity-100 transition-colors flex items-center gap-0.5 shrink-0"
                              title="Assign mission to block"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">Assign</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 2. Narrow Lane Missions (Overlapping with blocks beside them, width 28%, colored accent bar) */}
                  {laneMissions.map((item) => {
                    const style = getBlockStyles(item.startStr, item.endStr);
                    const isCompleted = item.mission.status === "completed";
                    const isMissed = !isCompleted && item.mission.deadline && new Date(item.mission.deadline) < currentTime;
                    const catInfo = getCategoryInfo(item.mission.category_id);

                    const tooltipPayload = {
                      id: item.mission.id,
                      title: item.mission.title,
                      time: `${formatTime12(item.startStr)} – ${formatTime12(item.endStr)}`,
                      category: catInfo.name,
                      categoryColor: catInfo.color,
                      status: isCompleted ? "Completed" : isMissed ? "Overdue" : "In Progress",
                      xp: item.mission.xp,
                      notes: item.mission.notes,
                    };

                    return (
                      <div
                        key={`lane-mission-${item.mission.id}`}
                        style={{
                          top: style.top,
                          height: style.height,
                          left: "calc(72% + 2px)",
                          width: "calc(28% - 4px)",
                        }}
                        onClick={() => onEditMission && onEditMission(item.mission)}
                        onMouseEnter={() => setActiveTooltip(tooltipPayload)}
                        onMouseLeave={() => setActiveTooltip((curr) => (curr?.id === item.mission.id ? null : curr))}
                        className={`absolute rounded-[5px] border p-1 pl-2 transition-all shadow-sm flex flex-col justify-between group z-20 cursor-pointer overflow-hidden ${
                          isCompleted
                            ? "bg-spy-surface2 border-spy-border text-spy-text hover:border-spy-green"
                            : isMissed
                            ? "bg-spy-redMuted/90 border-spy-red/60 text-spy-red hover:border-spy-red"
                            : "bg-spy-surface2/95 border-spy-green/60 hover:border-spy-green text-spy-text shadow-sm hover:shadow-md"
                        }`}
                        title={`${item.mission.title} (${formatShortTimeRange(item.startStr, item.endStr)}) • Category: ${catInfo.name}`}
                      >
                        {/* Full-height colored category accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-[4px]"
                          style={{ backgroundColor: catInfo.color }}
                        />

                        {/* Time & Title */}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="text-[8px] sm:text-[8.5px] font-mono font-bold leading-tight mb-0.5 whitespace-nowrap opacity-90 truncate">
                            {formatShortTimeRange(item.startStr, item.endStr)}
                          </div>
                          <div
                            className={`font-sans font-semibold text-[8.5px] sm:text-[9.5px] leading-snug line-clamp-2 break-words overflow-hidden ${
                              isCompleted ? "line-through decoration-spy-dim/60 text-spy-muted" : "text-spy-text"
                            }`}
                          >
                            {item.mission.title}
                          </div>
                        </div>

                        {/* Bottom: Check or XP indicator */}
                        <div className="flex items-center justify-between text-[7.5px] font-mono pt-0.5 text-spy-muted mt-auto">
                          {isCompleted ? (
                            <CheckCircle2 className="w-2.5 h-2.5 text-spy-green" />
                          ) : (
                            <span className="text-[7.5px] text-spy-green font-bold">
                              +{item.mission.xp}
                            </span>
                          )}
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteMission(item.mission);
                              }}
                              className="p-0.5 rounded-[2px] bg-spy-green/20 hover:bg-spy-green text-spy-green hover:text-black transition-colors"
                              title="Complete mission"
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* 3. Standalone Scheduled Missions (No block underneath, sub-column split layout) */}
                  {positionedStandalone.map((pos) => {
                    const style = getBlockStyles(pos.startStr, pos.endStr);
                    const isCompleted = pos.mission.status === "completed";
                    const isMissed = !isCompleted && pos.mission.deadline && new Date(pos.mission.deadline) < currentTime;
                    const catInfo = getCategoryInfo(pos.mission.category_id);

                    // Side-by-side positioning when totalCols > 1
                    const colWidthPercent = 100 / pos.totalCols;
                    const colLeftPercent = pos.colIndex * colWidthPercent;

                    const widthCss = pos.totalCols > 1 ? `calc(${colWidthPercent}% - 4px)` : "calc(100% - 8px)";
                    const leftCss = pos.totalCols > 1 ? `calc(${colLeftPercent}% + 2px)` : "4px";

                    const tooltipPayload = {
                      id: pos.mission.id,
                      title: pos.mission.title,
                      time: `${formatTime12(pos.startStr)} – ${formatTime12(pos.endStr)}`,
                      category: catInfo.name,
                      categoryColor: catInfo.color,
                      status: isCompleted ? "Completed" : isMissed ? "Overdue" : "In Progress",
                      xp: pos.mission.xp,
                      notes: pos.mission.notes,
                    };

                    return (
                      <div
                        key={`sched-mission-${pos.mission.id}`}
                        style={{
                          top: style.top,
                          height: style.height,
                          left: leftCss,
                          width: widthCss,
                        }}
                        onClick={() => onEditMission && onEditMission(pos.mission)}
                        onMouseEnter={() => setActiveTooltip(tooltipPayload)}
                        onMouseLeave={() => setActiveTooltip((curr) => (curr?.id === pos.mission.id ? null : curr))}
                        className={`absolute rounded-[5px] border p-1.5 pl-2.5 transition-all shadow-sm flex flex-col justify-between group z-20 cursor-pointer overflow-hidden ${
                          isCompleted
                            ? "bg-spy-surface2 border-spy-border text-spy-text hover:border-spy-green"
                            : isMissed
                            ? "bg-spy-redMuted/90 border-spy-red/60 text-spy-red hover:border-spy-red shadow-md"
                            : "bg-spy-surface2/95 border-spy-green/60 hover:border-spy-green text-spy-text shadow-sm hover:shadow-md"
                        }`}
                        title={`${pos.mission.title} (${formatShortTimeRange(pos.startStr, pos.endStr)}) • Category: ${catInfo.name}`}
                      >
                        {/* 3px Category Accent Bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[4px]"
                          style={{ backgroundColor: catInfo.color }}
                        />

                        {/* Top: Shortened Time Range on Line 1, Title on Line 2 */}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-[9.5px] font-mono leading-tight mb-0.5 whitespace-nowrap opacity-90 overflow-hidden">
                            <span className="flex items-center gap-1 font-bold shrink-0 truncate">
                              <Target className="w-2.5 h-2.5 text-spy-green shrink-0" />
                              {formatShortTimeRange(pos.startStr, pos.endStr)}
                            </span>
                            {pos.totalCols === 1 && (
                              <span className="text-[8px] bg-spy-green/20 text-spy-green px-1 rounded-[2px] font-bold shrink-0">
                                +{pos.mission.xp} XP
                              </span>
                            )}
                          </div>

                          {/* Line 2: Full Title (wrapped to 2 lines) */}
                          <div
                            className={`font-sans font-semibold text-[10px] sm:text-[11px] leading-snug line-clamp-2 break-words overflow-hidden ${
                              isCompleted ? "line-through decoration-spy-dim/60 text-spy-muted" : "text-spy-text"
                            }`}
                          >
                            {pos.mission.title}
                          </div>
                        </div>

                        {/* Bottom: Action / Status */}
                        <div className="flex items-center justify-between text-[8.5px] font-mono pt-0.5 text-spy-muted mt-auto min-w-0">
                          <span
                            className="truncate px-1 rounded-[2px] font-medium"
                            style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}
                          >
                            {catInfo.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {!isCompleted ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCompleteMission(pos.mission);
                                }}
                                className="p-0.5 rounded-[2px] bg-spy-green/20 hover:bg-spy-green text-spy-green hover:text-black transition-colors"
                                title="Complete mission"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-spy-green" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 4. Long Missions (>4h) rendered as deadline/target markers at their end time */}
                  {longMissions.map((item) => {
                    const style = getBlockStyles(item.endStr, addMinutes(item.endStr, 20));
                    const isCompleted = item.mission.status === "completed";
                    const catInfo = getCategoryInfo(item.mission.category_id);

                    const tooltipPayload = {
                      id: item.mission.id,
                      title: item.mission.title,
                      time: `${formatTime12(item.startStr)} – ${formatTime12(item.endStr)} (${Math.round(item.durationMin / 60)}h)`,
                      category: catInfo.name,
                      categoryColor: catInfo.color,
                      status: isCompleted ? "Completed" : "In Progress",
                      xp: item.mission.xp,
                      notes: item.mission.notes,
                    };

                    return (
                      <div
                        key={`long-mission-${item.mission.id}`}
                        style={{ top: style.top }}
                        onClick={() => onEditMission && onEditMission(item.mission)}
                        onMouseEnter={() => setActiveTooltip(tooltipPayload)}
                        onMouseLeave={() => setActiveTooltip((curr) => (curr?.id === item.mission.id ? null : curr))}
                        className={`absolute inset-x-2 -translate-y-1/2 z-25 flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-spy-green/60 bg-spy-surface2/95 shadow-sm text-spy-text font-mono text-[9px] cursor-pointer hover:border-spy-green transition-all min-w-0 overflow-hidden`}
                        title={`Target End: ${item.mission.title} (${formatShortTimeRange(item.startStr, item.endStr)})`}
                      >
                        <Target className="w-2.5 h-2.5 text-spy-green shrink-0" />
                        <span className={`truncate font-semibold flex-1 ${isCompleted ? "line-through text-spy-muted" : ""}`}>
                          {formatTime12(item.endStr)}: {item.mission.title}
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-spy-green shrink-0" />
                        ) : (
                          <span className="text-[7.5px] text-spy-green font-bold shrink-0">
                            +{item.mission.xp} XP
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* 5. Pure Deadline Markers on Grid */}
                  {deadlineMissions.map((mission) => {
                    const d = new Date(mission.deadline!);
                    const hh = d.getHours();
                    const mm = d.getMinutes();
                    const timeStr = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
                    const style = getBlockStyles(timeStr, addMinutes(timeStr, 20));
                    const isCompleted = mission.status === "completed";

                    return (
                      <div
                        key={`deadline-${mission.id}`}
                        style={{ top: style.top }}
                        onClick={() => onEditMission && onEditMission(mission)}
                        className={`absolute inset-x-2 -translate-y-1/2 z-25 flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[9px] cursor-pointer hover:bg-amber-500/25 transition-all shadow-xs min-w-0 overflow-hidden ${
                          isCompleted ? "opacity-50 line-through" : ""
                        }`}
                        title={`Deadline: ${mission.title} (${formatTime12(d)})`}
                      >
                        <Flag className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        <span className="truncate font-semibold flex-1">
                          {formatTime12(d)}: {mission.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Interactive Tooltip on Hover/Tap */}
      {activeTooltip && (
        <div className="fixed bottom-24 right-6 z-[60] p-3 rounded-[6px] border border-spy-border bg-spy-surface/95 backdrop-blur-md shadow-2xl max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
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
          <div className="flex items-center gap-2 text-[10px] font-mono text-spy-muted mb-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{activeTooltip.time}</span>
            <span>•</span>
            <span className="capitalize">{activeTooltip.status}</span>
          </div>
          {activeTooltip.notes && (
            <p className="text-[10px] font-sans text-spy-dim border-t border-spy-border/50 pt-1 line-clamp-2">
              {activeTooltip.notes}
            </p>
          )}
        </div>
      )}

      {/* Legend at the Bottom (Protected with 24px space above, never overlapped) */}
      <div className="pt-3 border-t border-spy-border/50 flex items-center gap-3 sm:gap-4 flex-wrap text-xs font-mono">
        <span className="text-spy-dim uppercase tracking-wider text-[10px] font-bold">LEGEND:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-spy-muted">University class</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="text-spy-muted">Tuition</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-spy-muted">Project / career</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span className="text-spy-muted">Course study</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          <span className="text-spy-muted">Competitive programming</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-500" />
          <span className="text-spy-muted">Break / personal</span>
        </div>
      </div>
    </div>
  );
};
