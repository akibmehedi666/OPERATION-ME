"use client";

import React, { useState } from "react";
import { 
  AcademicEvent, 
  TimeBlock, 
  Mission, 
  AcademicEventType 
} from "@/types/database";
import { 
  resolveDaySchedule, 
  formatDateKey, 
  getEventsForDate,
  WEEKDAY_ORDER,
  WEEKDAY_TO_NAME 
} from "@/lib/scheduleResolver";
import { formatDate, formatTimeRange12 } from "@/lib/formatters";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  ShieldAlert, 
  CreditCard, 
  Clock, 
  Laptop, 
  CheckCircle2,
  Trash2
} from "lucide-react";

interface AcademicCalendarViewProps {
  timeBlocks: TimeBlock[];
  academicEvents: AcademicEvent[];
  missions: Mission[];
  onAddEvent: (dateStr: string) => void;
  onDeleteEvent: (id: string) => void;
  onCompleteMission: (mission: Mission) => void;
}

const WEEKDAY_NAMES: Record<string, string> = {
  SAT: "Saturday",
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
};

function formatEventDetails(ev: { type: string; details?: string | null }): string {
  if (!ev.details) {
    if (ev.type === "holiday") return "University holiday — classes suspended";
    if (ev.type === "exam") return "Examinations scheduled";
    if (ev.type === "payment") return "Tuition fee deadline";
    return "";
  }
  const raw = ev.details.trim();
  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.overrideWeekday) {
        const dayName = WEEKDAY_NAMES[parsed.overrideWeekday.toUpperCase()] || parsed.overrideWeekday;
        return `Follows ${dayName} schedule${parsed.isOnline ? ", online" : ""}`;
      }
      if (parsed.isOnline !== undefined) {
        return parsed.isOnline ? "Online class session" : "In-person class session";
      }
      return Object.entries(parsed)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`)
        .join(", ");
    } catch {
      return raw;
    }
  }
  return raw;
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  timeBlocks,
  academicEvents,
  missions,
  onAddEvent,
  onDeleteEvent,
  onCompleteMission,
}) => {
  // Navigation month state (Default to Nov 2026 as per user requirement)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 10, 1)); // Nov 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    formatDateKey(new Date(2026, 10, 5))
  );

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(formatDateKey(today));
  };

  // Build days for month grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Day offset matching our week (SAT = 0, SUN = 1, MON = 2, ..., FRI = 6)
  const firstDayWeekdayIndex = (firstDayOfMonth.getDay() + 1) % 7;

  const calendarDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayWeekdayIndex - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    calendarDays.push({
      dateStr: formatDateKey(prevDate),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    calendarDays.push({
      dateStr: formatDateKey(currDate),
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete 6 rows (42 cells)
  const remainingCells = 42 - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    calendarDays.push({
      dateStr: formatDateKey(nextDate),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Selected date resolved schedule & details
  const resolvedSelectedDay = resolveDaySchedule(
    selectedDateStr,
    timeBlocks,
    academicEvents,
    missions
  );

  const getEventBadge = (type: AcademicEventType) => {
    switch (type) {
      case "exam":
        return {
          bg: "bg-[#fce8e0] text-[#b23a12] border-[#facfb7] dark:bg-spy-red/20 dark:text-spy-red dark:border-spy-red/30",
          dot: "bg-spy-red",
          icon: <ShieldAlert className="w-3 h-3 text-spy-red" />,
        };
      case "payment":
        return {
          bg: "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber/30",
          dot: "bg-spy-amber",
          icon: <CreditCard className="w-3 h-3 text-spy-amber" />,
        };
      case "deadline":
        return {
          bg: "bg-[#fdeadb] text-[#a8500f] border-[#fad0b2] dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40",
          dot: "bg-orange-500",
          icon: <Clock className="w-3 h-3 text-orange-500" />,
        };
      case "class_override":
        return {
          bg: "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40",
          dot: "bg-blue-500",
          icon: <Laptop className="w-3 h-3 text-blue-500" />,
        };
      case "holiday":
      default:
        return {
          bg: "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
          dot: "bg-gray-400",
          icon: <CalendarIcon className="w-3 h-3 text-gray-400" />,
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left 2 Cols: Month Calendar Grid */}
      <div className="lg:col-span-2 clean-card p-5">
        {/* Month Header & Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-spy-green" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-spy-text">
              {currentMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-[3px] bg-spy-surface2 border border-spy-border hover:border-spy-borderLight text-spy-text"
            >
              Today
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-[3px] border border-spy-border hover:bg-spy-surface2 text-spy-text"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-[3px] border border-spy-border hover:bg-spy-surface2 text-spy-text"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center select-none">
          {/* Weekday Names (Sat to Fri) */}
          {WEEKDAY_ORDER.map((wd) => (
            <div
              key={wd}
              className="py-1 text-[11px] font-mono font-bold text-spy-muted uppercase tracking-wider"
            >
              {wd}
            </div>
          ))}

          {/* 42 Date Cells */}
          {calendarDays.map(({ dateStr, dayNumber, isCurrentMonth }) => {
            const isSelected = dateStr === selectedDateStr;
            const eventsOnDate = getEventsForDate(dateStr, academicEvents);
            const isExamRange = eventsOnDate.some((e) => e.type === "exam");
            const isHoliday = eventsOnDate.some((e) => e.type === "holiday");
            const isOverride = eventsOnDate.some((e) => e.type === "class_override");

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDateStr(dateStr)}
                className={`min-h-[76px] p-1.5 rounded-[4px] border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? "ring-2 ring-spy-green border-spy-green bg-spy-surface2 z-10 shadow-sm"
                    : isExamRange
                    ? "bg-[#fce8e0]/40 border-spy-red/30 dark:bg-spy-red/10 dark:border-spy-red/30"
                    : isHoliday
                    ? "bg-gray-100/60 border-gray-200 dark:bg-gray-900/30 dark:border-gray-800"
                    : isOverride
                    ? "bg-[#e4eefc]/30 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40"
                    : isCurrentMonth
                    ? "bg-spy-surface border-spy-border hover:border-spy-borderLight"
                    : "bg-spy-surface2/30 border-spy-border/30 opacity-40"
                }`}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-medium ${
                      isSelected
                        ? "text-spy-green font-bold"
                        : isCurrentMonth
                        ? "text-spy-text"
                        : "text-spy-muted"
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {/* Dot count if many events */}
                  {eventsOnDate.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      {eventsOnDate.map((ev) => {
                        const style = getEventBadge(ev.type);
                        return (
                          <span
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                            title={ev.title}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Event Ribbons inside cell */}
                <div className="space-y-0.5 mt-1 overflow-hidden w-full">
                  {eventsOnDate.slice(0, 2).map((ev) => {
                    const style = getEventBadge(ev.type);
                    return (
                      <div
                        key={ev.id}
                        className={`text-[8px] font-mono px-1 py-0.2 rounded-[2px] border truncate font-bold ${style.bg}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono pt-4 mt-4 border-t border-spy-border">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-spy-red" />
            <span className="text-spy-muted">Exam range</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-spy-muted">Payment installment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-spy-muted">Deadline / Submission</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-spy-muted">Online Class</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span className="text-spy-muted">Holiday</span>
          </div>
        </div>
      </div>

      {/* Right Column: Day Inspector Drawer */}
      <div className="clean-card p-5 space-y-4">
        {/* Date Heading & Override Badge */}
        <div className="pb-3 border-b border-spy-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-spy-dim uppercase tracking-wider">
              INSPECTION DOSSIER
            </span>
            <button
              onClick={() => onAddEvent(selectedDateStr)}
              className="text-xs font-mono font-bold text-spy-green hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Event</span>
            </button>
          </div>
          <h2 className="text-base font-bold text-spy-text font-mono mt-1">
            {formatDate(selectedDateStr)}
          </h2>
          <div className="text-xs font-mono text-spy-muted">
            {WEEKDAY_TO_NAME[resolvedSelectedDay.weekday]}
          </div>

          {/* Active Override Badge */}
          {resolvedSelectedDay.badge && (
            <div className="mt-2 text-xs font-mono font-bold px-2.5 py-1 rounded-[3px] bg-spy-green/10 text-spy-green border border-spy-green/30 w-fit">
              ★ {resolvedSelectedDay.badge}
            </div>
          )}
        </div>

        {/* Academic Events on this Date */}
        <div>
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-spy-muted mb-2">
            ACADEMIC EVENTS ({resolvedSelectedDay.events.length})
          </h4>
          {resolvedSelectedDay.events.length === 0 ? (
            <div className="text-xs text-spy-dim font-mono py-2">
              No academic milestones scheduled for this date.
            </div>
          ) : (
            <div className="space-y-2">
              {resolvedSelectedDay.events.map((ev) => {
                const style = getEventBadge(ev.type);
                return (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-[4px] bg-spy-surface2 border border-spy-border flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono px-1 rounded-[2px] border font-bold ${style.bg}`}>
                          {ev.type.toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-spy-text truncate">
                          {ev.title}
                        </span>
                      </div>
                      {formatEventDetails(ev) && (
                        <div className="text-[11px] text-spy-muted font-sans mt-1">
                          {formatEventDetails(ev)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1 text-spy-muted hover:text-spy-red rounded transition-colors shrink-0"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resolved Timetable Blocks for this Date */}
        <div>
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-spy-muted mb-2">
            RESOLVED SCHEDULE ({resolvedSelectedDay.blocks.length})
          </h4>
          {resolvedSelectedDay.blocks.length === 0 ? (
            <div className="text-xs text-spy-dim font-mono py-2">
              No scheduled blocks for this day.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {resolvedSelectedDay.blocks.map((block) => (
                <div
                  key={block.id}
                  className={`p-2 rounded-[3px] border text-xs font-sans flex items-center justify-between gap-2 ${
                    block.type === "class"
                      ? "bg-blue-50/50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-200"
                      : block.type === "tuition"
                      ? "bg-amber-50/50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-200"
                      : "bg-spy-surface2 border-spy-border text-spy-text"
                  }`}
                >
                  <div className="min-w-0 truncate">
                    <span className="font-semibold">{block.label}</span>
                    {block.isOnline && (
                      <span className="ml-1 text-[9px] font-mono px-1 bg-blue-600 text-white rounded-[2px]">
                        ONLINE
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-spy-muted shrink-0">
                    {formatTimeRange12(block.start_time, block.end_time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missions due or scheduled on this date */}
        <div>
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-spy-muted mb-2">
            MISSIONS ACTIVE ON THIS DATE
          </h4>
          {(() => {
            const dateMissions = missions.filter((m) => {
              if (m.deadline && formatDateKey(m.deadline) === selectedDateStr) return true;
              if (m.scheduled_start && formatDateKey(m.scheduled_start) === selectedDateStr) return true;
              return false;
            });

            if (dateMissions.length === 0) {
              return (
                <div className="text-xs text-spy-dim font-mono py-2">
                  No mission deadlines on this date.
                </div>
              );
            }

            return (
              <div className="space-y-1.5">
                {dateMissions.map((m) => {
                  const isDone = m.status === "completed";
                  return (
                    <div
                      key={m.id}
                      className="p-2 rounded-[3px] bg-spy-surface2 border border-spy-border flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1 truncate">
                        <span className={isDone ? "line-through text-spy-muted" : "text-spy-text font-medium"}>
                          {m.title}
                        </span>
                      </div>
                      {!isDone ? (
                        <button
                          type="button"
                          onClick={() => onCompleteMission(m)}
                          className="px-2 py-0.5 rounded-[2px] bg-spy-green/20 text-spy-green hover:bg-spy-green hover:text-black font-mono text-[10px] font-bold transition-colors"
                        >
                          Accomplish
                        </button>
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-spy-green shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
