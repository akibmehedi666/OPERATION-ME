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
  onOpenCourseHQ?: (courseId: string) => void;
}

const categoryToCourseMap: Record<string, string> = {
  "cat-1": "course-os",
  "cat-2": "course-os-lab",
  "cat-3": "course-econ",
  "cat-4": "course-dip",
  "cat-5": "course-stat",
  "cat-6": "course-fydp",
};

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
  onOpenCourseHQ,
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
      durationMinutes: durationMin,
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
          card: "bg-[#eefaf8] border-[#99f6e4] text-[#0f766e] dark:bg-[#091c1b] dark:border-[#133b39] dark:text-[#5eead4]",
          badge: "bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4] dark:bg-[#0e2c2b] dark:text-[#99f6e4]",
          accent: "#14b8a6",
        };
      case "break":
      default:
        return {
          card: "bg-[#f4f2ee] border-[#d6d3d1] text-[#44403c] dark:bg-[#131615] dark:border-[#272f2b] dark:text-[#a8a29e]",
          badge: "bg-[#e7e5e4] text-[#44403c] border-[#d6d3d1] dark:bg-[#1c211f] dark:text-[#d6d3d1]",
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
          pill: "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/40",
        };
      default:
        return {
          icon: <CalendarIcon className="w-2.5 h-2.5 text-spy-muted" />,
          pill: "bg-spy-surface2 text-spy-muted border-spy-border",
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
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 pb-3 border-b border-spy-border mb-4 text-center select-none">
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
                          ? "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-700"
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
                  className={`relative h-full rounded-[6px] border transition-colors ${
                    isToday
                      ? "bg-[#1f7a4d]/[0.03] border-spy-border border-t-2 border-t-[#1f7a4d] dark:bg-[rgba(34,197,94,0.05)] dark:border-spy-border dark:border-t-2 dark:border-t-spy-green shadow-none"
                      : "bg-spy-surface border-spy-border shadow-none"
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDoubleClick={() => onAddBlock(weekday, dateStr)}
                >
                  {/* Faint 1-Hour Horizontal Grid Guide Lines Behind Blocks */}
                  {HOURS.map((_, hIdx) => {
                    const topPercent = (hIdx / (HOURS.length - 1)) * 100;
                    return (
                      <div
                        key={hIdx}
                        style={{ top: `${topPercent}%` }}
                        className="absolute inset-x-0 border-b border-black/[0.06] dark:border-white/[0.06] pointer-events-none z-0"
                      />
                    );
                  })}

                  {/* "NOW" Indicator Line for Today */}
                  {isToday && isTimeInGrid && (
                    <div
                      style={{ top: `${nowPercent}%` }}
                      className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                    >
                      <span className="w-2 h-2 -ml-1 rounded-full bg-spy-red animate-pulse shrink-0" />
                      <span className="text-[7.5px] font-mono font-bold text-white bg-spy-red px-1 rounded-[2px] leading-tight shrink-0 ml-0.5 shadow-sm">
                        NOW
                      </span>
                      <div className="h-[1.5px] w-full bg-spy-red shadow-xs" />
                    </div>
                  )}

                  {/* Rendered Time Blocks in this day */}
                  {blocks.map((block) => {
                    const style = getBlockStyles(block.start_time, block.end_time);
                    const theme = getBlockThemeClasses(block.type);
                    const fill = calculateBlockFill(block, dateStr, missions);
                    const isFlexible = block.type === "study" || block.type === "project" || block.type === "cp";
                    const isShortBlock = style.durationMinutes < 60;

                    return (
                      <div
                        key={block.id}
                        style={{ top: style.top, height: style.height }}
                        onClick={() => {
                          if (block.type === "class" && onOpenCourseHQ) {
                            const courseId = categoryToCourseMap[block.default_category || ""] || "course-os";
                            onOpenCourseHQ(courseId);
                          } else if (isFlexible) {
                            onEditBlock(block, dateStr);
                          }
                        }}
                        className={`absolute inset-x-1 rounded-[6px] border p-2 pl-3 overflow-hidden transition-all shadow-xs flex flex-col justify-between group z-10 ${
                          theme.card
                        } ${isFlexible ? "cursor-pointer hover:ring-1 hover:ring-spy-green/50" : ""}`}
                        title={`${block.label} (${formatTimeRange12(block.start_time, block.end_time)})`}
                      >
                        {/* 3px Left Accent Bar in Category Color */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[5px]"
                          style={{ backgroundColor: theme.accent }}
                        />

                        {/* Top: Time Range & Type/Online Tag */}
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[11px] font-mono leading-tight mb-1 opacity-75">
                            <span className="truncate">
                              {formatTime12(block.start_time)} - {formatTime12(block.end_time)}
                            </span>
                            {block.isOnline && (
                              <span className="px-1 rounded-[2px] bg-blue-600 text-white text-[8px] font-bold shrink-0">
                                ONLINE
                              </span>
                            )}
                          </div>

                          {/* Block Label */}
                          <div className="font-sans font-semibold text-[12px] sm:text-[13px] leading-tight truncate">
                            {block.label}
                          </div>

                          {/* Overbooked Warning */}
                          {fill.isOverbooked && (
                            <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1 py-0.2 rounded-[2px] mt-1 w-fit">
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

                        {/* Bottom: Fill Indicator & Ghost-style Quick Assign button */}
                        {isFlexible && (
                          <div className="mt-auto pt-1 border-t border-current/10 flex items-center justify-between text-[10px] font-mono gap-1">
                            <span className="opacity-70 truncate text-[9px]">
                              {fill.plannedMissions.length > 0 ? `${fill.totalPlannedMinutes}m` : `${style.durationMinutes}m free`}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignMissionToBlock(block, dateStr);
                              }}
                              className="p-1 sm:px-1.5 sm:py-0.5 rounded-[3px] bg-transparent hover:bg-current/10 text-current opacity-70 hover:opacity-100 transition-colors flex items-center gap-0.5 shrink-0"
                              title="Assign mission to block"
                            >
                              <Plus className="w-3 h-3" />
                              {!isShortBlock && <span>Assign</span>}
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
