"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  TimeBlock,
  ResolvedTimeBlock,
  Mission,
  AcademicEvent,
  Category,
  DayOfWeek,
  TimeBlockType
} from "@/types/database";
import { formatTime12 } from "@/lib/formatters";
import { WEEKDAY_ORDER } from "@/lib/scheduleResolver";
import {
  X,
  Lock,
  Clock,
  Calendar,
  Trash2,
  Check,
  AlertTriangle,
  ExternalLink,
  Plus,
  ArrowRight,
  MoveRight
} from "lucide-react";
import { soundFX } from "@/lib/sound";

export interface PlannerSelectedItem {
  kind: "fixed" | "routine" | "mission";
  block?: TimeBlock | ResolvedTimeBlock;
  mission?: Mission;
  academicEvent?: AcademicEvent;
  dateStr: string;
  conflictWith?: string | null;
  fixedSubtype?: "class" | "tuition" | "event";
}

interface PlannerItemPanelProps {
  isOpen: boolean;
  item: PlannerSelectedItem | null;
  categories: Category[];
  onClose: () => void;
  onSaveRoutine: (
    blockId: string,
    updates: Partial<TimeBlock>,
    scope: "today" | "every_week",
    dateStr: string
  ) => Promise<void> | void;
  onDeleteRoutine: (
    blockId: string,
    scope: "today" | "every_week",
    dateStr: string
  ) => Promise<void> | void;
  onEditMission: (mission: Mission) => void;
  onQuickMoveMission?: (mission: Mission, deltaMinutes: number) => void;
  onOpenTuitionModal?: (slot: { day: DayOfWeek; startTime: string; endTime: string; targetDate?: string }) => void;
  onOpenCourseHQ?: (courseId: string) => void;
  onOpenAcademicCalendar?: () => void;
  onAddMissionInBlock?: (block: TimeBlock, dateStr: string) => void;
}

const ROUTINE_BLOCK_TYPES: { type: TimeBlockType; label: string; color: string }[] = [
  { type: "study", label: "Study Window", color: "text-purple-400" },
  { type: "project", label: "Project Focus", color: "text-green-400" },
  { type: "cp", label: "CP / Practice", color: "text-orange-400" },
  { type: "break", label: "Rest / Break", color: "text-gray-400" },
];

export const PlannerItemPanel: React.FC<PlannerItemPanelProps> = ({
  isOpen,
  item,
  categories,
  onClose,
  onSaveRoutine,
  onDeleteRoutine,
  onEditMission,
  onQuickMoveMission,
  onOpenTuitionModal,
  onOpenCourseHQ,
  onOpenAcademicCalendar,
  onAddMissionInBlock,
}) => {
  const [mounted, setMounted] = useState(false);

  // Routine block form state
  const [label, setLabel] = useState("");
  const [weekday, setWeekday] = useState<DayOfWeek>("SUN");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [type, setType] = useState<TimeBlockType>("study");
  const [defaultCategory, setDefaultCategory] = useState<string>("");
  const [scope, setScope] = useState<"today" | "every_week">("today");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (item?.block) {
      setLabel(item.block.label || "");
      setWeekday(item.block.weekday || "SUN");
      setStartTime(item.block.start_time || "10:00");
      setEndTime(item.block.end_time || "11:30");
      setType(item.block.type || "study");
      setDefaultCategory(item.block.default_category || "");
      setScope(item.block.override_date ? "today" : "every_week");
    }
  }, [item]);

  if (!isOpen || !item || !mounted) return null;

  const handleRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.block?.id || !label.trim()) return;

    setIsSaving(true);
    try {
      await onSaveRoutine(
        item.block.id,
        {
          label: label.trim(),
          weekday,
          start_time: startTime,
          end_time: endTime,
          type,
          default_category: defaultCategory || null,
        },
        scope,
        item.dateStr
      );
      soundFX.playTargetAcquired();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoutineClick = async () => {
    if (!item.block?.id) return;
    setIsDeleting(true);
    try {
      await onDeleteRoutine(item.block.id, scope, item.dateStr);
      soundFX.playBlip();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md h-full bg-spy-surface border-l border-spy-border shadow-2xl flex flex-col font-mono text-xs overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Planner Item Details"
      >
        {/* Header */}
        <div className="p-4 border-b border-spy-border flex items-center justify-between bg-spy-surface2">
          <div className="flex items-center gap-2">
            {item.kind === "fixed" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe] dark:bg-[#13273e] dark:text-[#93c5fd] dark:border-[#1d4ed8] font-bold text-[10px] uppercase">
                <Lock className="w-3 h-3" />
                <span>Fixed Schedule</span>
              </span>
            )}
            {item.kind === "routine" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-bold text-[10px] uppercase">
                <span>Routine Focus Window</span>
              </span>
            )}
            {item.kind === "mission" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-spy-green/15 text-spy-green border border-spy-green/40 font-bold text-[10px] uppercase">
                <Check className="w-3 h-3" />
                <span>Mission Directive</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-spy-muted hover:text-spy-text transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conflict Alert Banner if any */}
        {item.conflictWith && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/30 flex items-start gap-2.5 text-red-500 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[11px] uppercase tracking-wider">
                Schedule Conflict Detected
              </div>
              <p className="text-[10px] font-sans text-spy-dim mt-0.5">
                Overlaps with <span className="font-semibold text-spy-text">{item.conflictWith}</span>.
              </p>
              {item.mission && onQuickMoveMission && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => onQuickMoveMission(item.mission!, 30)}
                    className="px-2 py-1 rounded-[3px] bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-[10px] font-bold flex items-center gap-1"
                  >
                    <MoveRight className="w-3 h-3" />
                    <span>Move +30m</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickMoveMission(item.mission!, -30)}
                    className="px-2 py-1 rounded-[3px] bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-[10px] font-bold flex items-center gap-1"
                  >
                    <span>Move -30m</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ================= 1. FIXED ITEM (READ-ONLY) ================= */}
          {item.kind === "fixed" && (
            <div className="space-y-4">
              <div className="p-4 rounded-[4px] bg-[#dbeafe]/40 border border-[#bfdbfe] dark:bg-[#13273e]/50 dark:border-[#1e3a5f] space-y-2">
                <div className="flex items-center gap-1.5 text-spy-dim text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span className="uppercase font-bold text-spy-text">
                    {item.block?.type === "tuition" ? "Teaching Routine" : "University Timetable"}
                  </span>
                </div>
                <h2 className="text-base font-bold text-spy-text font-sans">
                  {item.block?.label || item.academicEvent?.title || "Fixed Slot"}
                </h2>
                {item.block && (
                  <div className="flex items-center gap-2 text-xs font-mono text-spy-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatTime12(item.block.start_time)} – {formatTime12(item.block.end_time)}
                    </span>
                    <span className="text-spy-dim">({item.block.weekday})</span>
                  </div>
                )}
                {item.academicEvent && (
                  <div className="flex items-center gap-2 text-xs font-mono text-spy-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.dateStr}</span>
                    <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-spy-surface border border-spy-border">
                      {item.academicEvent.type}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-spy-surface2 border border-spy-border rounded-[4px] space-y-2 text-[11px]">
                <div className="text-spy-text font-semibold">Protected Time Slot</div>
                <p className="text-spy-dim font-sans leading-relaxed">
                  Fixed classes and tuition cannot be dragged or resized on the grid to prevent accidental timetable disruptions.
                </p>
                <div className="pt-2">
                  {item.block?.type === "tuition" && onOpenTuitionModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTuitionModal({
                          day: item.block?.weekday as DayOfWeek,
                          startTime: item.block?.start_time || "18:00",
                          endTime: item.block?.end_time || "19:30",
                          targetDate: item.dateStr,
                        });
                      }}
                      className="w-full py-2 px-3 rounded-[3px] bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25 flex items-center justify-center gap-1.5 font-bold transition-colors"
                    >
                      <span>Manage Tuition Session</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {item.block?.type === "class" && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCourseHQ?.("course-os");
                      }}
                      className="w-full py-2 px-3 rounded-[3px] bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 flex items-center justify-center gap-1.5 font-bold transition-colors"
                    >
                      <span>View Course in Course HQ</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {item.academicEvent && onOpenAcademicCalendar && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAcademicCalendar();
                      }}
                      className="w-full py-2 px-3 rounded-[3px] bg-spy-green/15 text-spy-green border border-spy-green/30 hover:bg-spy-green/25 flex items-center justify-center gap-1.5 font-bold transition-colors"
                    >
                      <span>Manage in Academic Calendar</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. ROUTINE FOCUS WINDOW (EDITABLE) ================= */}
          {item.kind === "routine" && item.block && (
            <form onSubmit={handleRoutineSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-spy-muted mb-1">
                  Focus Window Label *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Study OS / Economics, Project Deep Work"
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs font-sans text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green"
                />
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-spy-muted mb-1.5">
                  Routine Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROUTINE_BLOCK_TYPES.map((bt) => (
                    <button
                      key={bt.type}
                      type="button"
                      onClick={() => setType(bt.type)}
                      className={`p-2 rounded-[3px] border text-left flex items-center gap-2 transition-colors ${type === bt.type
                          ? "bg-spy-surface2 border-spy-green text-spy-green font-bold"
                          : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text"
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${bt.color} bg-current`} />
                      <span className="truncate">{bt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-spy-muted mb-1">
                  Day of Week
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAY_ORDER.map((wd) => (
                    <button
                      key={wd}
                      type="button"
                      onClick={() => setWeekday(wd)}
                      className={`py-1.5 rounded-[3px] border text-center transition-colors font-mono text-[10px] ${weekday === wd
                          ? "bg-spy-greenMuted border-spy-green text-spy-green font-bold"
                          : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
                        }`}
                    >
                      {wd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start & End Times (12-hour formatted pickers) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-spy-muted mb-1">
                    Start Time ({formatTime12(startTime)})
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-spy-surface2 border border-spy-border px-3 py-1.5 text-xs text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-spy-muted mb-1">
                    End Time ({formatTime12(endTime)})
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-spy-surface2 border border-spy-border px-3 py-1.5 text-xs text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-spy-muted mb-1">
                  Associated Category
                </label>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green"
                >
                  <option value="">(None / General Routine)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Choice: "Only this day" vs "Every week" */}
              <div className="p-3 bg-spy-surface2 border border-spy-border rounded-[4px] space-y-2">
                <div className="font-bold text-spy-text uppercase text-[11px]">
                  Apply Changes To:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope("today")}
                    className={`p-2 rounded-[3px] border text-left transition-colors flex flex-col gap-0.5 ${scope === "today"
                        ? "bg-spy-green/15 border-spy-green text-spy-green font-bold"
                        : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text"
                      }`}
                  >
                    <span className="text-[11px]">Only this day</span>
                    <span className="text-[9px] font-sans text-spy-dim">
                      Applies to {item.dateStr}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope("every_week")}
                    className={`p-2 rounded-[3px] border text-left transition-colors flex flex-col gap-0.5 ${scope === "every_week"
                        ? "bg-spy-green/15 border-spy-green text-spy-green font-bold"
                        : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text"
                      }`}
                  >
                    <span className="text-[11px]">Every week</span>
                    <span className="text-[9px] font-sans text-spy-dim">
                      Updates recurring template
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick action: Dispatch Mission in this window */}
              {onAddMissionInBlock && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddMissionInBlock(item.block!, item.dateStr);
                  }}
                  className="w-full py-2 bg-spy-surface hover:bg-spy-surface2 border border-spy-border hover:border-spy-green text-spy-text hover:text-spy-green rounded-[3px] transition-colors flex items-center justify-center gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Deploy Mission in this Window</span>
                </button>
              )}

              {/* Submit & Delete buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-spy-border gap-2">
                <button
                  type="button"
                  onClick={handleDeleteRoutineClick}
                  disabled={isDeleting}
                  className="px-3 py-2 rounded-[3px] border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{scope === "today" ? "Delete for Today" : "Delete Weekly"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-[3px] border border-spy-border text-spy-muted hover:text-spy-text transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-[3px] bg-spy-green text-black font-bold hover:bg-spy-green/90 transition-colors text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ================= 3. MISSION ITEM ================= */}
          {item.kind === "mission" && item.mission && (
            <div className="space-y-4">
              <div className="p-4 rounded-[4px] bg-spy-surface2 border border-spy-green space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-spy-green uppercase font-bold">
                    {item.mission.codename || "TACTICAL DIRECTIVE"}
                  </span>
                  <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-spy-surface border border-spy-border">
                    {item.mission.priority} priority
                  </span>
                </div>
                <h2 className="text-sm font-bold text-spy-text font-sans leading-snug">
                  {item.mission.title}
                </h2>
                <div className="flex items-center gap-2 text-xs font-mono text-spy-muted">
                  <Clock className="w-3.5 h-3.5 text-spy-green" />
                  <span>
                    {item.mission.scheduled_start
                      ? `${formatTime12(item.mission.scheduled_start.split("T")[1]?.slice(0, 5))} – ${item.mission.scheduled_end
                        ? formatTime12(item.mission.scheduled_end.split("T")[1]?.slice(0, 5))
                        : ""
                      }`
                      : "Unscheduled time"}
                  </span>
                </div>
                {item.mission.notes && (
                  <p className="text-xs text-spy-dim font-sans pt-1 border-t border-spy-border">
                    {item.mission.notes}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditMission(item.mission!);
                }}
                className="w-full py-2.5 rounded-[3px] bg-spy-green text-black font-bold hover:bg-spy-green/90 transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
              >
                <span>Open Full Mission Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

