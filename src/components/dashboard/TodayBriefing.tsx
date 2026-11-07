"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  GraduationCap,
  ShieldAlert,
  Laptop
} from "lucide-react";
import { ClassScheduleItem, DayOfWeek, TimeBlock, AcademicEvent, Mission } from "@/types/database";
import { formatTimeRange12, formatDate } from "@/lib/formatters";
import { getCategoryTheme } from "@/lib/categoryTheme";
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
  onOpenTuitionModal 
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
      return resolveDaySchedule(selectedDate, timeBlocks, academicEvents, missions);
    }
    return null;
  }, [selectedDate, timeBlocks, academicEvents, missions]);

  // Unified items to display
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
      }));
  }, [resolution, schedule, selectedDay]);

  // Next upcoming class logic using intelligent resolver that skips holidays
  const upcomingClassInfo = useMemo(() => {
    if (timeBlocks.length > 0) {
      return getNextUpcomingClass(currentTime, timeBlocks, academicEvents);
    }
    return null;
  }, [currentTime, timeBlocks, academicEvents]);

  const getEventStatus = (item: { start_time: string; end_time: string }) => {
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
  };

  const isToday = DAY_KEYS[currentTime.getDay()] === selectedDay;

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

        {/* Live Countdown status skipping holidays */}
        {isToday && (
          <div className="mb-4 bg-spy-surface2 border border-spy-border p-2.5 rounded-[4px] flex items-center justify-between text-xs font-mono">
            <span className="text-spy-muted flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-spy-green shrink-0" />
              <span className="truncate">
                {upcomingClassInfo
                  ? `Next class: ${upcomingClassInfo.block.label.replace(/\s*\(\d+\)/, "")}`
                  : "Next class"}
              </span>
            </span>
            <span className="text-spy-green font-semibold shrink-0 ml-2">
              {upcomingClassInfo ? upcomingClassInfo.countdownText : "No upcoming classes"}
            </span>
          </div>
        )}

        {/* Schedule List */}
        {displayItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-spy-dim font-sans">
            {resolution?.isHoliday
              ? "University classes suspended for holiday. Enjoy your focused routine!"
              : "No academic sessions or tuition scheduled for this day."}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayItems.map((item) => {
              const status = getEventStatus(item);
              const catTheme = getCategoryTheme(item.type === "tuition" ? "tuition" : item.course_name);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === "tuition" && onOpenTuitionModal) {
                      onOpenTuitionModal({
                        day: selectedDay,
                        startTime: item.start_time,
                        endTime: item.end_time,
                      });
                    }
                  }}
                  className={`p-3 rounded-[4px] border transition-colors flex items-center justify-between gap-3 ${
                    item.type === "tuition" ? "cursor-pointer hover:border-spy-green" : ""
                  } ${
                    status === "in-progress"
                      ? "bg-spy-greenMuted border-spy-green"
                      : status === "concluded"
                      ? "bg-spy-surface border-spy-border opacity-50"
                      : "bg-spy-surface2 border-spy-border"
                  }`}
                  title={item.type === "tuition" ? "Click to edit tuition schedule" : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-[4px] border shrink-0 ${catTheme.iconTileClass}`}>
                      {item.type === "tuition" ? (
                        <GraduationCap className="w-3.5 h-3.5" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-medium text-spy-text truncate flex items-center gap-2">
                        <span>{item.course_name}</span>
                        {item.isOnline && (
                          <span className="px-1.5 py-0.2 rounded-[2px] bg-blue-600 text-white text-[9px] font-bold">
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-spy-muted font-mono mt-0.5">
                        <span>{formatTimeRange12(item.start_time, item.end_time)}</span>
                        {item.room && (
                          <span className="flex items-center gap-1 text-spy-dim">
                            <MapPin className="w-3 h-3" />
                            {item.room}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-xs font-mono">
                    {status === "in-progress" ? (
                      <span className="text-spy-green font-semibold">Active now</span>
                    ) : status === "concluded" ? (
                      <span className="text-spy-dim">Done</span>
                    ) : (
                      <span className="text-spy-muted">
                        {item.type === "tuition" ? "Tuition (Edit)" : "Class"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
