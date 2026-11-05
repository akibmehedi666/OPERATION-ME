"use client";

import React, { useState, useEffect } from "react";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  GraduationCap, 
  BookOpen, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { ClassScheduleItem, DayOfWeek } from "@/types/database";
import { Badge } from "@/components/ui/Badge";

interface TodayBriefingProps {
  schedule: ClassScheduleItem[];
}

const DAY_NAMES: Record<DayOfWeek, string> = {
  SUN: "SUNDAY",
  MON: "MONDAY",
  TUE: "TUESDAY",
  WED: "WEDNESDAY",
  THU: "THURSDAY",
  FRI: "FRIDAY",
  SAT: "SATURDAY",
};

const DAY_KEYS: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const TodayBriefing: React.FC<TodayBriefingProps> = ({ schedule }) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("SAT");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [countdownText, setCountdownText] = useState<string>("");
  const [nextEvent, setNextEvent] = useState<ClassScheduleItem | null>(null);

  // Sync with real current day on mount
  useEffect(() => {
    const todayIndex = new Date().getDay(); // 0 is SUN ... 6 is SAT
    const realDayKey = DAY_KEYS[todayIndex];
    setSelectedDay(realDayKey);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter schedule for selected day
  const daySchedule = schedule
    .filter((item) => item.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Determine next upcoming event and countdown
  useEffect(() => {
    const now = currentTime;
    const todayIndex = now.getDay();
    const todayKey = DAY_KEYS[todayIndex];

    if (selectedDay !== todayKey) {
      setNextEvent(null);
      setCountdownText("PREVIEWING DIFFERENT DAY SCHEDULE");
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
        // Either in progress or upcoming
        if (currentMinutes < startMinutes) {
          const diffSec = (startMinutes - currentMinutes) * 60 - currentSeconds;
          if (diffSec < shortestDiffSeconds) {
            shortestDiffSeconds = diffSec;
            upcoming = item;
          }
        } else {
          // In progress!
          upcoming = item;
          shortestDiffSeconds = 0;
          break;
        }
      }
    }

    setNextEvent(upcoming);

    if (!upcoming) {
      setCountdownText("ALL DIRECTIVES CONCLUDED FOR TODAY");
    } else if (shortestDiffSeconds === 0) {
      setCountdownText("STATUS: CURRENTLY IN PROGRESS // ACTIVE");
    } else {
      const h = Math.floor(shortestDiffSeconds / 3600);
      const m = Math.floor((shortestDiffSeconds % 3600) / 60);
      const s = shortestDiffSeconds % 60;
      setCountdownText(
        `T-MINUS ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
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
    <div className="tactical-card bg-spy-surface border border-spy-border p-4 sm:p-6 font-mono text-spy-text">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-spy-border mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-spy-dim">
            <CalendarDays className="w-4 h-4 text-spy-green" />
            <span>DAILY BRIEFING // OPERATION CALENDAR</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
            {DAY_NAMES[selectedDay]} ITINERARY
          </h2>
        </div>

        {/* Day selector tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {DAY_KEYS.map((day) => {
            const isToday = DAY_KEYS[currentTime.getDay()] === day;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors border ${
                  isSelected
                    ? "bg-spy-green text-black border-spy-green shadow-[0_0_8px_rgba(0,255,102,0.3)]"
                    : isToday
                    ? "bg-spy-surface text-spy-green border-spy-green/50"
                    : "bg-black/40 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {day}
                {isToday && <span className="ml-1 text-[9px] text-spy-amber font-mono">●</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Countdown Alert Banner */}
      <div className="bg-black/60 border-l-2 border-spy-green p-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-spy-green animate-pulse" />
          <span className="text-xs uppercase tracking-wider text-spy-dim">
            NEXT TARGET INITIATION:
          </span>
          {nextEvent && (
            <span className="text-xs font-bold text-white bg-slate-800/80 px-2 py-0.5 border border-slate-700">
              {nextEvent.course_name}
            </span>
          )}
        </div>

        <div className="text-xs sm:text-sm font-bold text-spy-green tracking-widest text-glow-green">
          {countdownText}
        </div>
      </div>

      {/* Schedule List */}
      {daySchedule.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800">
          NO CLASSIFIED SESSIONS SCHEDULED FOR {DAY_NAMES[selectedDay]}. RECON & STUDY DAY.
        </div>
      ) : (
        <div className="space-y-2.5">
          {daySchedule.map((item) => {
            const status = getEventStatus(item);
            return (
              <div
                key={item.id}
                className={`p-3 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  status === "in-progress"
                    ? "bg-spy-green/10 border-spy-green shadow-spy-green"
                    : status === "concluded"
                    ? "bg-black/30 border-slate-800/60 opacity-60"
                    : "bg-spy-card border-spy-border hover:border-spy-border/80"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 bg-black/60 border border-slate-800 shrink-0">
                    {item.type === "tuition" ? (
                      <GraduationCap className="w-4 h-4 text-spy-amber" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-spy-text">
                        {item.course_name}
                      </span>
                      <Badge variant={item.type === "tuition" ? "tuition" : "class"}>
                        {item.type === "tuition" ? "TUITION (TEACHING)" : "ACADEMIC CLASS"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-spy-dim mt-1">
                      <span className="flex items-center gap-1 font-mono text-spy-text">
                        <Clock className="w-3.5 h-3.5 text-spy-green" />
                        {item.start_time} - {item.end_time}
                      </span>
                      {item.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-spy-dim" />
                          ROOM {item.room}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center">
                  {status === "in-progress" ? (
                    <span className="text-[10px] uppercase font-bold text-spy-green border border-spy-green px-2 py-0.5 animate-pulse bg-spy-green/10 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-spy-green" />
                      IN PROGRESS
                    </span>
                  ) : status === "concluded" ? (
                    <span className="text-[10px] uppercase font-bold text-slate-500 border border-slate-800 px-2 py-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-slate-500" />
                      CONCLUDED
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold text-slate-400 border border-slate-800 px-2 py-0.5">
                      UPCOMING
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

