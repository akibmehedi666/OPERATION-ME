"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Calendar, 
  MapPin, 
  BookOpen, 
  GraduationCap,
  ShieldAlert,
  Laptop,
  Undo2
} from "lucide-react";
import { ClassScheduleItem, DayOfWeek, TimeBlock, AcademicEvent, Mission, TuitionException } from "@/types/database";
import { formatTimeRange12, formatDate } from "@/lib/formatters";
import { 
  resolveDaySchedule, 
  getWeekStartDate, 
  getDaysOfWeek, 
  getNextUpcomingClass 
} from "@/lib/scheduleResolver";

interface TodayBriefingProps {
  schedule?: ClassScheduleItem[];
  timeBlocks?: TimeBlock[];
  academicEvents?: AcademicEvent[];
  missions?: Mission[];
  onOpenTuitionModal?: (slot?: { day: DayOfWeek; startTime: string; endTime: string }) => void;
  tuitionExceptions?: TuitionException[];
  onUndoTuitionException?: (id: string) => Promise<void> | void;
  onOpenTuitionActionModal?: (slot?: { day: DayOfWeek; startTime: string; endTime: string; dateStr?: string }) => void;
}

const DAY_NAMES: Record<DayOfWeek, string> = {
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

const DAY_KEYS: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const TodayBriefing: React.FC<TodayBriefingProps> = ({ 
  schedule = [], 
  timeBlocks = [], 
  academicEvents = [], 
  missions = [],
  onOpenTuitionModal,
  tuitionExceptions = [],
  onUndoTuitionException,
  onOpenTuitionActionModal,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("SAT");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const todayIndex = new Date().getDay();
    const realDayKey = DAY_KEYS[todayIndex];
    setSelectedDay(realDayKey);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Compute reference week days based on currentTime
  const weekDays = useMemo(() => {
    return getDaysOfWeek(getWeekStartDate(currentTime));
  }, [currentTime]);

  // Find date corresponding to the selected day
  const selectedDate = useMemo(() => {
    const found = weekDays.find((d) => DAY_KEYS[d.getDay()] === selectedDay);
    return found || currentTime;
  }, [weekDays, selectedDay, currentTime]);

  // Resolve schedule for selectedDay honoring academic events & overrides
  const resolution = useMemo(() => {
    if (timeBlocks.length > 0) {
      return resolveDaySchedule(selectedDate, timeBlocks, academicEvents, missions, tuitionExceptions);
    }
    return null;
  }, [selectedDate, timeBlocks, academicEvents, missions, tuitionExceptions]);

  // Unified items to evaluate for selected day
  const displayItems = useMemo(() => {
    if (resolution) {
      return resolution.blocks
        .filter((b) => b.type === "class" || b.type === "tuition")
        .map((b) => ({
          id: b.id,
          course_name: b.label,
          start_time: b.start_time,
          end_time: b.end_time,
          type: b.type === "tuition" ? ("tuition" as const) : ("class" as const),
          room: b.isOnline ? "Online Session" : (b.label.match(/\((\d+)\)/)?.[1] ? `UB${b.label.match(/\((\d+)\)/)?.[1]}` : null),
          isOnline: b.isOnline,
          isCancelled: b.isCancelled,
          tuitionExceptionId: b.tuitionException?.id,
        }));
    }

    return schedule
      .filter((item) => item.day_of_week === selectedDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((item) => ({
        id: item.id,
        course_name: item.course_name,
        start_time: item.start_time,
        end_time: item.end_time,
        type: item.type,
        room: item.room,
        isOnline: false,
        isCancelled: false,
        tuitionExceptionId: undefined,
      }));
  }, [resolution, schedule, selectedDay]);

  // Next upcoming class logic using intelligent resolver that skips holidays
  const upcomingClassInfo = useMemo(() => {
    if (timeBlocks.length > 0) {
      return getNextUpcomingClass(currentTime, timeBlocks, academicEvents);
    }
    return null;
  }, [currentTime, timeBlocks, academicEvents]);

  const isToday = DAY_KEYS[currentTime.getDay()] === selectedDay;

  const getEventStatus = useCallback((item: { start_time: string; end_time: string }) => {
    const todayIndex = currentTime.getDay();
    const todayKey = DAY_KEYS[todayIndex];
    if (selectedDay !== todayKey) return "scheduled";

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [sh, sm] = item.start_time.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const [eh, em] = item.end_time.split(":").map(Number);
    const endMinutes = eh * 60 + em;

    if (currentMinutes >= endMinutes) return "concluded";
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return "in-progress";
    return "upcoming";
  }, [currentTime, selectedDay]);

  // 1. Next Class resolution
  const classItems = useMemo(
    () => displayItems.filter((i) => i.type === "class"),
    [displayItems]
  );

  const nextClassDisplay = useMemo(() => {
    if (resolution?.isHoliday) {
      return {
        title: "Academic Holiday",
        time: "No classes scheduled",
        room: null,
        statusText: "Classes Suspended",
        statusColor: "text-amber-500",
        isOnline: false,
      };
    }

    if (classItems.length === 0) {
      return {
        title: "No Classes Scheduled",
        time: "Free day",
        room: null,
        statusText: "Open Schedule",
        statusColor: "text-spy-dim",
        isOnline: false,
      };
    }

    if (isToday) {
      // Find currently active or next upcoming class
      const activeOrUpcoming = classItems.find((c) => {
        const s = getEventStatus(c);
        return s === "in-progress" || s === "upcoming";
      });

      if (activeOrUpcoming) {
        const s = getEventStatus(activeOrUpcoming);
        return {
          title: activeOrUpcoming.course_name.replace(/\s*\(\d+\)/, ""),
          time: formatTimeRange12(activeOrUpcoming.start_time, activeOrUpcoming.end_time),
          room: activeOrUpcoming.room,
          statusText: s === "in-progress" ? "Active Now" : (upcomingClassInfo?.countdownText || "Upcoming"),
          statusColor: s === "in-progress" ? "text-spy-green" : "text-spy-green",
          isOnline: activeOrUpcoming.isOnline,
        };
      }

      // All classes completed today
      const lastClass = classItems[classItems.length - 1];
      return {
        title: lastClass.course_name.replace(/\s*\(\d+\)/, ""),
        time: formatTimeRange12(lastClass.start_time, lastClass.end_time),
        room: lastClass.room,
        statusText: "Concluded",
        statusColor: "text-spy-dim",
        isOnline: lastClass.isOnline,
      };
    }

    // Future / alternate day: show the day's first scheduled class
    const firstClass = classItems[0];
    return {
      title: firstClass.course_name.replace(/\s*\(\d+\)/, ""),
      time: formatTimeRange12(firstClass.start_time, firstClass.end_time),
      room: firstClass.room,
      statusText: `${classItems.length} class${classItems.length > 1 ? "es" : ""}`,
      statusColor: "text-spy-muted",
      isOnline: firstClass.isOnline,
    };
  }, [classItems, isToday, resolution, upcomingClassInfo, getEventStatus]);

  // 2. Next Tuition resolution
  const tuitionItems = useMemo(
    () => displayItems.filter((i) => i.type === "tuition"),
    [displayItems]
  );
  const tuitionItem = tuitionItems.length > 0 ? tuitionItems[0] : null;

  // Fallback next weekly tuition slot if none on selectedDay
  const fallbackWeeklyTuition = useMemo(() => {
    if (tuitionItem) return null;
    const allTuitions = (timeBlocks || []).filter(
      (b) => b.type === "tuition" || b.default_category === "tuition"
    );
    if (allTuitions.length === 0) return null;
    return allTuitions[0];
  }, [tuitionItem, timeBlocks]);

  return (
    <div className="clean-card p-5 h-full flex flex-col justify-between">
      <div>
        {/* Header line: Title + Date + Day tabs */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-spy-border">
          <div>
            <div className="text-xs font-mono font-medium text-spy-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-spy-green" />
              <span>Today&apos;s Briefing</span>
            </div>
            <h2 className="text-base font-semibold text-spy-text mt-0.5">
              {DAY_NAMES[selectedDay]} Schedule
            </h2>
            <div className="text-[11px] font-mono text-spy-dim mt-0.5">
              {formatDate(selectedDate)}
            </div>
          </div>

          {/* Clean Day Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {DAY_KEYS.map((day) => {
              const isRealToday = DAY_KEYS[currentTime.getDay()] === day;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2 py-1 text-xs font-mono rounded-[3px] transition-colors border ${
                    isSelected
                      ? "bg-spy-greenMuted text-spy-green border-spy-green font-semibold"
                      : isRealToday
                      ? "bg-spy-surface2 text-spy-text border-spy-border font-medium"
                      : "bg-transparent text-spy-dim border-transparent hover:text-spy-text"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Holiday Override Banner */}
        {resolution?.isHoliday && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-[4px] flex items-center justify-between text-xs font-mono text-amber-600 dark:text-amber-400">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{resolution.badge || "Holiday (No class)"}</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/20 rounded-[2px]">
              Classes Suspended
            </span>
          </div>
        )}

        {/* Online Class Override Banner */}
        {resolution?.isOverridden && !resolution.isHoliday && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-[4px] flex items-center justify-between text-xs font-mono text-blue-600 dark:text-blue-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Laptop className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{resolution.badge}</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-blue-500/20 rounded-[2px]">
              Online Schedule
            </span>
          </div>
        )}

        {/* Focused Briefing: Next Class + Next Tuition ONLY */}
        <div className="space-y-3">
          {/* 1. Next Class Briefing Card */}
          <div className="p-3.5 rounded-[4px] border border-spy-border bg-spy-surface2 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-[4px] border border-spy-border bg-spy-surface text-spy-green mt-0.5 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-spy-muted">
                  Next Class
                </div>
                <div className="text-sm font-semibold text-spy-text line-clamp-2 break-words flex items-center gap-2">
                  <span>{nextClassDisplay.title}</span>
                  {nextClassDisplay.isOnline && (
                    <span className="px-1.5 py-0.2 rounded-[2px] bg-blue-600 text-white text-[9px] font-bold">
                      ONLINE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-spy-muted font-mono">
                  <span>{nextClassDisplay.time}</span>
                  {nextClassDisplay.room && (
                    <span className="flex items-center gap-1 text-spy-dim">
                      <MapPin className="w-3 h-3" />
                      {nextClassDisplay.room}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className={`text-xs font-mono font-semibold ${nextClassDisplay.statusColor}`}>
                {nextClassDisplay.statusText}
              </span>
            </div>
          </div>

          {/* 2. Next Tuition Briefing Card */}
          {tuitionItem ? (
            tuitionItem.isCancelled ? (
              <div className="p-3.5 rounded-[4px] border border-dashed border-spy-border bg-spy-surface2/60 dark:bg-spy-surface2/40 opacity-80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-[4px] border border-spy-border shrink-0 text-spy-dim">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono uppercase tracking-wider text-spy-dim">
                      Next Tuition
                    </div>
                    <div className="text-sm font-medium text-spy-dim line-through truncate">
                      Tuition Session
                    </div>
                    <div className="text-xs font-mono text-spy-dim italic mt-0.5">
                      Tuition cancelled ({formatTimeRange12(tuitionItem.start_time, tuitionItem.end_time)})
                    </div>
                  </div>
                </div>
                {tuitionItem.tuitionExceptionId && onUndoTuitionException && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUndoTuitionException(tuitionItem.tuitionExceptionId!);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-spy-surface border border-spy-border hover:border-spy-green text-xs font-mono font-bold text-spy-text hover:text-spy-green transition-colors cursor-pointer shadow-xs"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Undo</span>
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => {
                  if (onOpenTuitionActionModal) {
                    onOpenTuitionActionModal({
                      day: selectedDay,
                      startTime: tuitionItem.start_time,
                      endTime: tuitionItem.end_time,
                      dateStr: resolution?.dateStr,
                    });
                  } else if (onOpenTuitionModal) {
                    onOpenTuitionModal({
                      day: selectedDay,
                      startTime: tuitionItem.start_time,
                      endTime: tuitionItem.end_time,
                    });
                  }
                }}
                className="p-3.5 rounded-[4px] border border-spy-border bg-spy-surface2 hover:border-spy-green transition-colors flex items-start justify-between gap-3 cursor-pointer"
                title="Click to move, cancel, or edit tuition schedule"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-[4px] border border-spy-border bg-spy-surface text-spy-amber mt-0.5 shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-spy-muted">
                      Next Tuition
                    </div>
                    <div className="text-sm font-semibold text-spy-text truncate">
                      Tuition Session
                    </div>
                    <div className="text-xs text-spy-muted font-mono">
                      {formatTimeRange12(tuitionItem.start_time, tuitionItem.end_time)}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-spy-surface border border-spy-border text-spy-dim hover:text-spy-green hover:border-spy-green transition-colors">
                    Move / Cancel
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="p-3.5 rounded-[4px] border border-spy-border bg-spy-surface2/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-[4px] border border-spy-border bg-spy-surface text-spy-dim mt-0.5 shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-spy-dim">
                    Next Tuition
                  </div>
                  <div className="text-sm font-normal text-spy-muted">
                    No tuition scheduled for this day
                  </div>
                  <div className="text-xs text-spy-dim font-mono">
                    {fallbackWeeklyTuition
                      ? `Routine slot: ${DAY_NAMES[fallbackWeeklyTuition.weekday] || fallbackWeeklyTuition.weekday} at ${formatTimeRange12(fallbackWeeklyTuition.start_time, fallbackWeeklyTuition.end_time)}`
                      : "Free evening focus window"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
