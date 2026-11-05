"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TimeBlock, 
  AcademicEvent, 
  Mission, 
  TimeBlockType,
  DayOfWeek 
} from "@/types/database";
import { 
  resolveDaySchedule, 
  getDaysOfWeek, 
  formatDateKey 
} from "@/lib/scheduleResolver";
import { 
  calculateBlockFill 
} from "@/lib/plannerScheduler";
import { formatTime12, formatTimeRange12 } from "@/lib/formatters";
import { 
  Check, 
  Plus, 
  AlertTriangle, 
  Calendar as CalendarIcon,
  ShieldAlert,
  CreditCard,
  Laptop,
  CheckCircle2
} from "lucide-react";

interface WeeklyGridViewProps {
  weekStartDate: Date;
  timeBlocks: TimeBlock[];
  academicEvents: AcademicEvent[];
  missions: Mission[];
  onEditBlock: (block: TimeBlock, dateStr: string) => void;
  onAddBlock: (weekday: DayOfWeek, dateStr: string) => void;
  onAssignMissionToBlock: (block: TimeBlock, dateStr: string) => void;
  onConfirmAutoSchedule: (missionId: string) => void;
  onCompleteMission: (mission: Mission) => void;
}

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; // 9 AM to 10 PM
const TOTAL_MINUTES = 13 * 60; // 780 minutes

export const WeeklyGridView: React.FC<WeeklyGridViewProps> = ({
  weekStartDate,
  timeBlocks,
  academicEvents,
  missions,
  onEditBlock,
  onAddBlock,
  onAssignMissionToBlock,
  onConfirmAutoSchedule,
  onCompleteMission,
}) => {
  const [selectedMobileDayIndex, setSelectedMobileDayIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

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

  // Calculate current time line position in grid (9 AM = 540m, 10 PM = 1320m)
  const currentTotalMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentMinutesOffset = currentTotalMin - 9 * 60;
  const isTimeInGrid = currentMinutesOffset >= 0 && currentMinutesOffset <= TOTAL_MINUTES;
  const nowPercent = (currentMinutesOffset / TOTAL_MINUTES) * 100;

  // Resolve schedule for each of the 7 days
  const resolvedDays = days.map((dayDate) => {
    return resolveDaySchedule(dayDate, timeBlocks, academicEvents, missions);
  });

  // Calculate top & height percentage for a time range
  const getBlockStyles = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const startMin = (sh || 9) * 60 + (sm || 0);
    const endMin = (eh || 10) * 60 + (em || 0);

    const offsetMin = Math.max(0, startMin - 9 * 60);
    const durationMin = Math.max(15, endMin - startMin);

    const top = (offsetMin / TOTAL_MINUTES) * 100;
    const height = (durationMin / TOTAL_MINUTES) * 100;

    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  };

  // Block color tokens for both Light (paper) and Dark themes
  const getBlockThemeClasses = (type: TimeBlockType) => {
    switch (type) {
      case "class":
        return {
          card: "bg-[#e4eefc] border-[#b9d5f7] text-[#1d4f9f] dark:bg-[#13253b] dark:border-[#1e3a5f] dark:text-[#93c5fd]",
          badge: "bg-[#d0e3fa] text-[#1d4f9f] border-[#b0d0f7] dark:bg-[#1a3352] dark:text-[#bfdbfe]",
          accent: "#1d4f9f",
        };
      case "tuition":
        return {
          card: "bg-[#fdeadb] border-[#f9c39b] text-[#a8500f] dark:bg-[#382313] dark:border-[#5a371c] dark:text-[#fdba74]",
          badge: "bg-[#fbd3b7] text-[#a8500f] border-[#f6b788] dark:bg-[#4a2e19] dark:text-[#fed7aa]",
          accent: "#a8500f",
        };
      case "project":
        return {
          card: "bg-[#dcf3e4] border-[#aae0be] text-[#14663a] dark:bg-[#102b1c] dark:border-[#1d4d33] dark:text-[#86efac]",
          badge: "bg-[#c5eacc] text-[#14663a] border-[#9fdab4] dark:bg-[#163d27] dark:text-[#bbf7d0]",
          accent: "#14663a",
        };
      case "study":
        return {
          card: "bg-[#f0e6fa] border-[#dabef5] text-[#6b2fa0] dark:bg-[#2b173e] dark:border-[#482667] dark:text-[#d8b4fe]",
          badge: "bg-[#e3d0f7] text-[#6b2fa0] border-[#cda7f0] dark:bg-[#3d1f59] dark:text-[#e9d5ff]",
          accent: "#6b2fa0",
        };
      case "cp":
        return {
          card: "bg-[#dff3f1] border-[#a9e2dd] text-[#0f6b66] dark:bg-[#102e2c] dark:border-[#1c4e4a] dark:text-[#5eead4]",
          badge: "bg-[#c9ebe7] text-[#0f6b66] border-[#95dcd6] dark:bg-[#164340] dark:text-[#99f6e4]",
          accent: "#0f6b66",
        };
      case "break":
      default:
        return {
          card: "bg-[#eae7df] border-[#cfc9b8] text-[#5c5850] dark:bg-[#1c1f1e] dark:border-[#2c312e] dark:text-[#9ca3af]",
          badge: "bg-[#ded8cb] text-[#5c5850] border-[#c4bdaf] dark:bg-[#282d2a] dark:text-[#d1d5db]",
          accent: "#78716c",
        };
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "exam":
        return {
          icon: <ShieldAlert className="w-2.5 h-2.5 text-spy-red" />,
          pill: "bg-[#fce8e0] text-[#b23a12] border-[#facfb7] dark:bg-spy-red/20 dark:text-spy-red dark:border-spy-red/30",
        };
      case "payment":
        return {
          icon: <CreditCard className="w-2.5 h-2.5 text-spy-amber" />,
          pill: "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber/30",
        };
      case "class_override":
        return {
          icon: <Laptop className="w-2.5 h-2.5 text-[#1d4f9f]" />,
          pill: "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40",
        };
      default:
        return {
          icon: <CalendarIcon className="w-2.5 h-2.5 text-spy-muted" />,
          pill: "bg-spy-surface2 text-spy-muted border-spy-border",
        };
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Main Grid Container */}
      <div className="clean-card p-3 sm:p-5 overflow-x-auto">
        <div className="min-w-[850px] relative">
          {/* Header Row: Days of Week */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 pb-3 border-b border-spy-border mb-2 text-center select-none">
            {/* Corner time label */}
            <div className="text-[10px] font-mono text-spy-dim flex items-end justify-center pb-1">
              TIME
            </div>

            {resolvedDays.map(({ dateStr, weekday, events, badge, isHoliday, isExam }, idx) => {
              const dayDate = days[idx];
              const isToday = dateStr === todayKey;

              return (
                <div
                  key={dateStr}
                  className={`p-2 rounded-[4px] border transition-colors flex flex-col items-center justify-between min-h-[64px] ${
                    isToday
                      ? "bg-[#dcf3e4]/30 border-[#14663a]/40 dark:bg-spy-surface2 dark:border-spy-green/40 shadow-xs"
                      : isExam
                      ? "bg-[#fce8e0]/20 border-spy-red/30 dark:bg-spy-red/10 dark:border-spy-red/30"
                      : "bg-spy-surface2 border-spy-border"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider ${
                        isToday ? "text-[#14663a] dark:text-spy-green" : "text-spy-text"
                      }`}
                    >
                      {weekday}
                    </span>
                    <span
                      className={`text-xs font-mono px-1 py-0.2 rounded-[2px] ${
                        isToday
                          ? "bg-[#14663a] text-white dark:bg-spy-green dark:text-black font-bold"
                          : "text-spy-muted"
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                  </div>

                  {/* Override or Holiday Badge */}
                  {badge && (
                    <div
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] border mt-1 truncate max-w-full font-bold ${
                        isHoliday
                          ? "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                          : isExam
                          ? "bg-[#fce8e0] text-[#b23a12] border-[#facfb7] dark:bg-spy-red/20 dark:text-spy-red"
                          : "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-blue-950/40 dark:text-blue-300"
                      }`}
                      title={badge}
                    >
                      {badge}
                    </div>
                  )}

                  {/* Day Events Dots / Mini Badges */}
                  {events.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
                      {events.slice(0, 2).map((ev) => {
                        const style = getEventBadge(ev.type);
                        return (
                          <span
                            key={ev.id}
                            className={`inline-flex items-center gap-0.5 text-[8px] font-mono px-1 rounded-[2px] border ${style.pill}`}
                            title={ev.title}
                          >
                            {style.icon}
                            <span className="truncate max-w-[50px]">{ev.title}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid Area: Time Axis on Left + 7 Columns */}
          <div className="relative grid grid-cols-[60px_repeat(7,1fr)] gap-2 h-[760px] select-none">
            {/* Left Hour Axis */}
            <div className="relative h-full text-right pr-2">
              {HOURS.map((hour, idx) => {
                const percent = (idx / (HOURS.length - 1)) * 100;
                const ampm = hour >= 12 ? "PM" : "AM";
                const displayHour = hour > 12 ? hour - 12 : hour;

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

              return (
                <div
                  key={dateStr}
                  className={`relative h-full rounded-[4px] border transition-colors ${
                    isToday
                      ? "bg-[#f4f1ea]/40 border-[#14663a]/30 dark:bg-spy-surface2/30 dark:border-spy-green/30"
                      : "bg-spy-surface border-spy-border/50"
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDoubleClick={() => onAddBlock(weekday, dateStr)}
                >
                  {/* Subtle 1-Hour Horizontal Grid Guide Lines */}
                  {HOURS.map((_, hIdx) => {
                    const topPercent = (hIdx / (HOURS.length - 1)) * 100;
                    return (
                      <div
                        key={hIdx}
                        style={{ top: `${topPercent}%` }}
                        className="absolute inset-x-0 border-b border-spy-border/30 pointer-events-none"
                      />
                    );
                  })}

                  {/* "NOW" Indicator Line for Today */}
                  {isToday && isTimeInGrid && (
                    <div
                      style={{ top: `${nowPercent}%` }}
                      className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                    >
                      <span className="w-2.5 h-2.5 -ml-1.5 rounded-full bg-spy-red border-2 border-spy-surface animate-pulse" />
                      <div className="h-[2px] w-full bg-spy-red shadow-xs" />
                      <span className="text-[8px] font-mono text-white bg-spy-red px-1 rounded-[1px] absolute right-1 -top-3">
                        NOW
                      </span>
                    </div>
                  )}

                  {/* Rendered Time Blocks in this day */}
                  {blocks.map((block) => {
                    const style = getBlockStyles(block.start_time, block.end_time);
                    const theme = getBlockThemeClasses(block.type);
                    const fill = calculateBlockFill(block, dateStr, missions);
                    const isFlexible = block.type === "study" || block.type === "project" || block.type === "cp";

                    return (
                      <div
                        key={block.id}
                        style={{ top: style.top, height: style.height }}
                        onClick={() => {
                          if (isFlexible) {
                            onEditBlock(block, dateStr);
                          }
                        }}
                        className={`absolute inset-x-1 rounded-[4px] border p-1.5 overflow-hidden transition-all shadow-xs flex flex-col justify-between group ${
                          theme.card
                        } ${isFlexible ? "cursor-pointer hover:ring-1 hover:ring-spy-green/50" : ""}`}
                        title={`${block.label} (${formatTimeRange12(block.start_time, block.end_time)})`}
                      >
                        {/* Top: Time Range & Type/Online Tag */}
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[9px] font-mono leading-tight mb-0.5">
                            <span className="font-bold truncate">
                              {formatTime12(block.start_time)} - {formatTime12(block.end_time)}
                            </span>
                            {block.isOnline && (
                              <span className="px-1 rounded-[2px] bg-blue-600 text-white text-[8px] font-bold">
                                ONLINE
                              </span>
                            )}
                          </div>

                          {/* Block Label */}
                          <div className="font-sans font-semibold text-xs leading-snug truncate">
                            {block.label}
                          </div>

                          {/* Overbooked Warning */}
                          {fill.isOverbooked && (
                            <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1 py-0.2 rounded-[2px] mt-0.5 w-fit">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span>Overbooked (+{fill.overbookedMinutes}m)</span>
                            </div>
                          )}
                        </div>

                        {/* Middle: Mission Cards inside flexible block */}
                        {isFlexible && (
                          <div className="space-y-1 my-1 overflow-y-auto max-h-[160px] pr-0.5">
                            {fill.plannedMissions.map((mission) => {
                              const isCompleted = mission.status === "completed";
                              const isMissed =
                                !isCompleted && mission.deadline && new Date(mission.deadline) < currentTime;

                              return (
                                <div
                                  key={mission.id}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`p-1 rounded-[3px] border text-[10px] font-sans flex items-center justify-between gap-1 transition-all ${
                                    isCompleted
                                      ? "opacity-60 bg-black/5 dark:bg-white/5 line-through border-spy-border"
                                      : isMissed
                                      ? "bg-spy-redMuted border-spy-red/40 text-spy-red"
                                      : mission.is_auto_scheduled
                                      ? "border-dashed border-spy-green/60 bg-spy-surface/80"
                                      : "bg-spy-surface border-spy-border"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium truncate text-spy-text">
                                        {mission.title}
                                      </span>
                                      {mission.is_auto_scheduled && (
                                        <span className="text-[8px] font-mono bg-spy-green/20 text-spy-green px-1 rounded-[1px] uppercase shrink-0">
                                          Suggested
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {mission.is_auto_scheduled ? (
                                      <button
                                        type="button"
                                        onClick={() => onConfirmAutoSchedule(mission.id)}
                                        className="px-1 py-0.2 text-[9px] font-mono font-bold bg-[#14663a] text-white dark:bg-spy-green dark:text-black rounded-[2px]"
                                        title="Confirm suggestion"
                                      >
                                        Confirm
                                      </button>
                                    ) : !isCompleted ? (
                                      <button
                                        type="button"
                                        onClick={() => onCompleteMission(mission)}
                                        className="p-1 rounded-[2px] bg-spy-green/20 hover:bg-spy-green text-spy-green hover:text-black transition-colors"
                                        title="Accomplish target"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3 text-spy-green" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Bottom: Fill Indicator & Quick Add Mission button */}
                        {isFlexible && (
                          <div className="pt-0.5 border-t border-current/10 flex items-center justify-between text-[9px] font-mono">
                            <span className="opacity-80 truncate">{fill.displayText}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignMissionToBlock(block, dateStr);
                              }}
                              className="px-1 rounded-[2px] border border-current/30 hover:bg-current/10 flex items-center gap-0.5 transition-colors"
                              title="Assign mission to block"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Assign</span>
                            </button>
                          </div>
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

      {/* Legend at the Bottom */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs font-mono pt-2">
        <span className="text-spy-dim uppercase tracking-wider text-[10px]">LEGEND:</span>
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
          <span className="text-spy-muted">CP / SQL practice</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span className="text-spy-muted">Break / rest</span>
        </div>
      </div>
    </div>
  );
};
