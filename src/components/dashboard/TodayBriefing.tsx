"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  GraduationCap
} from "lucide-react";
import { ClassScheduleItem, DayOfWeek } from "@/types/database";
import { formatTimeRange12, formatCountdown, formatDate } from "@/lib/formatters";
import { getCategoryTheme } from "@/lib/categoryTheme";

interface TodayBriefingProps {
  schedule: ClassScheduleItem[];
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

export const TodayBriefing: React.FC<TodayBriefingProps> = ({ schedule }) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("SAT");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [countdownText, setCountdownText] = useState<string>("");
  const [nextEvent, setNextEvent] = useState<ClassScheduleItem | null>(null);

  useEffect(() => {
    const todayIndex = new Date().getDay();
    const realDayKey = DAY_KEYS[todayIndex];
    setSelectedDay(realDayKey);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const daySchedule = schedule
    .filter((item) => item.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  useEffect(() => {
    const now = currentTime;
    const todayIndex = now.getDay();
    const todayKey = DAY_KEYS[todayIndex];

    if (selectedDay !== todayKey) {
      setNextEvent(null);
      setCountdownText("");
      return;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    let upcoming: ClassScheduleItem | null = null;
    let shortestDiffSeconds = Infinity;

    for (const item of daySchedule) {
      const [sh, sm] = item.start_time.split(":").map(Number);
      const startMinutes = sh * 60 + sm;
      const [eh, em] = item.end_time.split(":").map(Number);
      const endMinutes = eh * 60 + em;

      if (currentMinutes < endMinutes) {
        if (currentMinutes < startMinutes) {
          const diffSec = (startMinutes - currentMinutes) * 60 - currentSeconds;
          if (diffSec < shortestDiffSeconds) {
            shortestDiffSeconds = diffSec;
            upcoming = item;
          }
        } else {
          upcoming = item;
          shortestDiffSeconds = 0;
          break;
        }
      }
    }

    setNextEvent(upcoming);

    if (!upcoming) {
      setCountdownText("Completed for today");
    } else if (shortestDiffSeconds === 0) {
      setCountdownText("In progress now");
    } else {
      setCountdownText(`Next in ${formatCountdown(shortestDiffSeconds)}`);
    }
  }, [currentTime, selectedDay, daySchedule]);

  const getEventStatus = (item: ClassScheduleItem) => {
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
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Clean Day Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {DAY_KEYS.map((day) => {
              const isToday = DAY_KEYS[currentTime.getDay()] === day;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2 py-1 text-xs font-mono rounded-[3px] transition-colors border ${
                    isSelected
                      ? "bg-spy-greenMuted text-spy-green border-spy-green font-semibold"
                      : isToday
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

        {/* Live Countdown status if applicable */}
        {countdownText && (
          <div className="mb-4 bg-spy-surface2 border border-spy-border p-2.5 rounded-[4px] flex items-center justify-between text-xs font-mono">
            <span className="text-spy-muted flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-spy-green shrink-0" />
              <span className="truncate">{nextEvent ? nextEvent.course_name : "Timetable"}</span>
            </span>
            <span className="text-spy-green font-semibold shrink-0 ml-2">
              {countdownText}
            </span>
          </div>
        )}

        {/* Schedule List */}
        {daySchedule.length === 0 ? (
          <div className="text-center py-8 text-xs text-spy-dim font-sans">
            No academic sessions or tuition scheduled today.
          </div>
        ) : (
          <div className="space-y-2.5">
            {daySchedule.map((item) => {
              const status = getEventStatus(item);
              const catTheme = getCategoryTheme(item.type === "tuition" ? "tuition" : item.course_name);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-[4px] border transition-colors flex items-center justify-between gap-3 ${
                    status === "in-progress"
                      ? "bg-spy-greenMuted border-spy-green"
                      : status === "concluded"
                      ? "bg-spy-surface border-spy-border opacity-50"
                      : "bg-spy-surface2 border-spy-border"
                  }`}
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
                      <div className="text-sm font-medium text-spy-text truncate">
                        {item.course_name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-spy-muted font-mono mt-0.5">
                        {/* 12-hour format range */}
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
                        {item.type === "tuition" ? "Tuition" : "Class"}
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
