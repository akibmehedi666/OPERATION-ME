"use client";

import React, { useState, useEffect } from "react";
import { 
  TimeBlock, 
  AcademicEvent, 
  Mission, 
  Category, 
  DayOfWeek,
  TuitionException 
} from "@/types/database";
import { 
  getWeekStartDate, 
  formatDateKey, 
  isExamModeActive,
  extractBaseBlockId,
  getOverrideBlockId
} from "@/lib/scheduleResolver";
import { formatDate } from "@/lib/formatters";
import { soundFX } from "@/lib/sound";
import { WeeklyGridView } from "@/components/planner/WeeklyGridView";
import { AcademicCalendarView } from "@/components/planner/AcademicCalendarView";
import { TimeBlockModal } from "@/components/planner/TimeBlockModal";
import { AcademicEventModal } from "@/components/planner/AcademicEventModal";
import { AssignMissionModal } from "@/components/planner/AssignMissionModal";
import { TuitionScheduleModal } from "@/components/planner/TuitionScheduleModal";
import { PlanNextWeekModal } from "@/components/planner/PlanNextWeekModal";
import { 
  Calendar, 
  Grid3X3, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Wand2, 
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
  RotateCcw
} from "lucide-react";

interface PlannerViewProps {
  timeBlocks: TimeBlock[];
  academicEvents: AcademicEvent[];
  missions: Mission[];
  categories: Category[];
  structureLoadingError?: string | null;
  onRetryLoad?: () => void;
  onAddTimeBlock: (block: Omit<TimeBlock, "id" | "created_at"> & { id?: string }) => void;
  onUpdateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  onDeleteTimeBlock: (id: string) => void;
  onAddAcademicEvent: (event: Omit<AcademicEvent, "id" | "created_at">) => void;
  onUpdateAcademicEvent: (id: string, updates: Partial<AcademicEvent>) => void;
  onDeleteAcademicEvent: (id: string) => void;
  onScheduleMission: (missionId: string, blockId: string, start?: string, end?: string) => void;
  onConfirmAutoSchedule: (missionId: string) => void;
  onRunAutoSchedule: (weekStartDate: Date) => number;
  onCompleteMission: (mission: Mission) => void;
  onOpenCourseHQ?: (courseId: string) => void;
  onEditMission?: (mission: Mission) => void;
  onAssignNewMission?: (params: {
    block?: TimeBlock | null;
    dateStr: string;
    startTime: string;
    endTime: string;
    defaultCategoryId?: string;
  }) => void;
  onUpdateTuitionSchedule?: (options: {
    days: DayOfWeek[];
    startTime: string;
    endTime: string;
    scope: "always" | "this_week" | "move_session";
    targetDate?: string;
    targetDay?: DayOfWeek;
  }) => Promise<void> | void;
  tuitionExceptions?: TuitionException[];
  onUndoTuitionException?: (exceptionId: string) => Promise<void> | void;
  onEditTuitionSlot?: (slot: { day: DayOfWeek; startTime: string; endTime: string; targetDate?: string }) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  timeBlocks,
  academicEvents,
  missions,
  categories,
  structureLoadingError,
  onRetryLoad,
  onAddTimeBlock,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onAddAcademicEvent,
  onUpdateAcademicEvent,
  onDeleteAcademicEvent,
  onScheduleMission,
  onConfirmAutoSchedule,
  onRunAutoSchedule,
  onCompleteMission,
  onOpenCourseHQ,
  onEditMission,
  onAssignNewMission,
  onUpdateTuitionSchedule,
  tuitionExceptions = [],
  onUndoTuitionException,
  onEditTuitionSlot,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  // Default to current week containing today (weeks run Sat-Fri)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    getWeekStartDate(new Date())
  );

  // Modals state
  const [blockModal, setBlockModal] = useState<{
    isOpen: boolean;
    block: TimeBlock | null;
    defaultWeekday?: DayOfWeek;
    defaultDate?: string;
  }>({
    isOpen: false,
    block: null,
  });

  const [eventModal, setEventModal] = useState<{
    isOpen: boolean;
    event: AcademicEvent | null;
    defaultDate?: string;
  }>({
    isOpen: false,
    event: null,
  });

  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    block: TimeBlock | null;
    blockDateStr: string;
  }>({
    isOpen: false,
    block: null,
    blockDateStr: "",
  });

  const [tuitionModal, setTuitionModal] = useState<{
    isOpen: boolean;
    day?: DayOfWeek;
    startTime?: string;
    endTime?: string;
    targetDate?: string;
  }>({
    isOpen: false,
  });

  const [autoScheduleNotice, setAutoScheduleNotice] = useState<string | null>(null);
  const [isPlanNextWeekOpen, setIsPlanNextWeekOpen] = useState<boolean>(false);
  const [undoToast, setUndoToast] = useState<{
    overrideId: string;
    message: string;
  } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Auto-dismiss undo toast after 8 seconds
  useEffect(() => {
    if (!undoToast) return;
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [undoToast]);

  const handleUndoRoutineDelete = async () => {
    if (!undoToast) return;
    setIsUndoing(true);
    try {
      await onDeleteTimeBlock(undoToast.overrideId);
      soundFX.playTargetAcquired();
      setUndoToast(null);
    } catch (err) {
      console.error("[PlannerView] Undo failed:", err);
    } finally {
      setIsUndoing(false);
    }
  };

  // Save routine handler: applies changes either to today only or recurring weekly template
  const handleSaveRoutine = async (
    blockId: string,
    updates: Partial<TimeBlock>,
    scope: "today" | "every_week",
    dateStr: string
  ) => {
    const baseId = extractBaseBlockId(blockId, dateStr);
    if (scope === "every_week") {
      await onUpdateTimeBlock(baseId, {
        ...updates,
        override_date: null,
      });
    } else {
      const overrideId = getOverrideBlockId(baseId, dateStr);
      const baseBlock = timeBlocks.find((b) => b.id === baseId || b.id === blockId);
      await onAddTimeBlock({
        id: overrideId,
        weekday: updates.weekday || baseBlock?.weekday || "SUN",
        start_time: updates.start_time || baseBlock?.start_time || "10:00",
        end_time: updates.end_time || baseBlock?.end_time || "11:30",
        type: updates.type || baseBlock?.type || "study",
        label: updates.label || baseBlock?.label || "Routine Focus",
        default_category:
          updates.default_category !== undefined
            ? updates.default_category
            : (baseBlock?.default_category || null),
        is_fixed: false,
        is_active: true,
        override_date: dateStr,
      });
    }
  };

  // Delete routine handler: applies either to today or recurring weekly template
  const handleDeleteRoutine = async (
    blockId: string,
    scope: "today" | "every_week",
    dateStr: string
  ) => {
    const baseId = extractBaseBlockId(blockId, dateStr);
    if (scope === "every_week") {
      await onDeleteTimeBlock(baseId);
      // Clean up any single-day overrides associated with this base recurring block
      const overrides = timeBlocks.filter(
        (b) => b.override_date && extractBaseBlockId(b.id, b.override_date) === baseId
      );
      for (const ov of overrides) {
        try {
          await onDeleteTimeBlock(ov.id);
        } catch {
          // Ignore individual override cleanup failure
        }
      }
    } else {
      const overrideId = getOverrideBlockId(baseId, dateStr);
      const baseBlock = timeBlocks.find((b) => b.id === baseId || b.id === blockId);
      const blockLabel = baseBlock?.label || "Routine block";
      await onAddTimeBlock({
        id: overrideId,
        weekday: baseBlock?.weekday || "SUN",
        start_time: baseBlock?.start_time || "00:00",
        end_time: baseBlock?.end_time || "00:00",
        type: baseBlock?.type || "break",
        label: baseBlock?.label ? `${baseBlock.label} (Deleted)` : "Deleted for today",
        default_category: baseBlock?.default_category || null,
        is_fixed: false,
        is_active: false,
        override_date: dateStr,
      });

      setUndoToast({
        overrideId,
        message: `Deleted "${blockLabel}" for ${dateStr}`,
      });
    }
  };

  // Quick move mission by deltaMinutes (+30m / -30m)
  const handleQuickMoveMission = (mission: Mission, deltaMinutes: number) => {
    if (!mission.scheduled_start) return;
    const ds = new Date(mission.scheduled_start);
    ds.setMinutes(ds.getMinutes() + deltaMinutes);
    const newStart = ds.toISOString();
    let newEnd: string | undefined = undefined;
    if (mission.scheduled_end) {
      const de = new Date(mission.scheduled_end);
      de.setMinutes(de.getMinutes() + deltaMinutes);
      newEnd = de.toISOString();
    }
    onScheduleMission(mission.id, mission.scheduled_block_id || "", newStart, newEnd);
  };

  // Week navigation
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleTodayWeek = () => {
    setCurrentWeekStart(getWeekStartDate(new Date()));
  };

  // Auto-scheduler runner
  const handleAutoSchedule = () => {
    const count = onRunAutoSchedule(currentWeekStart);
    setAutoScheduleNotice(
      count > 0
        ? `Successfully auto-scheduled ${count} mission${count > 1 ? "s" : ""} to optimal blocks!`
        : "All missions are currently scheduled or have no pending deadlines."
    );
    setTimeout(() => setAutoScheduleNotice(null), 4000);
  };

  // Exam mode check
  const examMode = isExamModeActive(academicEvents, new Date());

  // Week end date for label (6 days after start)
  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const unscheduledMissionsCount = missions.filter(
    (m) => m.status === "active" && m.deadline && !m.scheduled_block_id
  ).length;

  return (
    <div className="space-y-6">
      {/* Exam Mode Banner if active */}
      {examMode.active && (
        <div className="p-3.5 rounded-[4px] bg-[#fce8e0] border border-[#facfb7] dark:bg-spy-redMuted dark:border-spy-red/40 flex items-center justify-between gap-3 text-spy-red">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <div className="text-xs font-sans">
              <span className="font-mono font-bold uppercase tracking-wider mr-1">
                EXAM MODE ENGAGED //
              </span>
              <span>
                {examMode.daysUntil === 0
                  ? "Examinations are currently underway. Course study blocks prioritized."
                  : `Approaching ${examMode.examEvent?.title} in ${examMode.daysUntil} days. Intensive review active.`}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-spy-red/20 border border-spy-red/40 font-bold">
            HIGH TACTICAL PRIORITY
          </span>
        </div>
      )}

      {/* Auto-Schedule Notice Toast */}
      {autoScheduleNotice && (
        <div className="p-3 rounded-[4px] bg-spy-surface2 border border-spy-green text-spy-green font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{autoScheduleNotice}</span>
          </div>
          <button
            onClick={() => setAutoScheduleNotice(null)}
            className="text-spy-muted hover:text-spy-text text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Planner Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-spy-border">
        {/* Left: View Switcher (Weekly Grid vs Academic Calendar) */}
        <div className="flex items-center gap-1.5 p-1 rounded-[4px] bg-spy-surface2 border border-spy-border">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-[3px] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-[#14663a] text-white dark:bg-spy-green dark:text-black shadow-xs"
                : "text-spy-muted hover:text-spy-text"
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Weekly Grid</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-[3px] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === "calendar"
                ? "bg-[#14663a] text-white dark:bg-spy-green dark:text-black shadow-xs"
                : "text-spy-muted hover:text-spy-text"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Academic Calendar</span>
          </button>
        </div>

        {/* Center / Week Navigator (When in Weekly Grid view) */}
        {viewMode === "grid" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTodayWeek}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-[3px] bg-spy-surface2 border border-spy-border hover:border-spy-borderLight text-spy-text"
            >
              Today
            </button>
            <div className="flex items-center border border-spy-border rounded-[3px] overflow-hidden bg-spy-surface">
              <button
                onClick={handlePrevWeek}
                className="p-1 hover:bg-spy-surface2 text-spy-text transition-colors"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-mono font-bold text-spy-text select-none min-w-[170px] text-center">
                {formatDate(currentWeekStart)} - {formatDate(weekEndDate)}
              </span>
              <button
                onClick={handleNextWeek}
                className="p-1 hover:bg-spy-surface2 text-spy-text transition-colors"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {viewMode === "grid" && (
            <>
              <button
                onClick={handleAutoSchedule}
                className="px-3 py-1.5 text-xs font-mono font-bold rounded-[3px] bg-spy-surface2 border border-spy-green text-[#14663a] dark:text-spy-green hover:bg-spy-green/10 flex items-center gap-1.5 transition-colors"
                title="Auto-schedule unscheduled missions to flexible blocks"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Auto-Schedule</span>
                {unscheduledMissionsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-spy-green text-black text-[10px]">
                    {unscheduledMissionsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsPlanNextWeekOpen(true)}
                className="px-3 py-1.5 text-xs font-mono font-bold rounded-[3px] bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 flex items-center gap-1.5 transition-colors"
                title="Weekly planning helper: Review next week's free routine windows and plan missions"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Plan next week</span>
              </button>
            </>
          )}

          <button
            onClick={() =>
              setBlockModal({
                isOpen: true,
                block: null,
                defaultWeekday: "SAT",
                defaultDate: formatDateKey(currentWeekStart),
              })
            }
            className="px-3 py-1.5 text-xs font-mono font-bold rounded-[3px] bg-spy-surface2 border border-spy-border hover:border-spy-borderLight text-spy-text flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block</span>
          </button>

          <button
            onClick={() =>
              setEventModal({
                isOpen: true,
                event: null,
                defaultDate: formatDateKey(currentWeekStart),
              })
            }
            className="px-3 py-1.5 text-xs font-mono font-bold rounded-[3px] bg-[#14663a] text-white hover:bg-[#0f4d2c] dark:bg-spy-green dark:text-black dark:hover:bg-spy-green/90 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Key Date</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Content */}
      {structureLoadingError || timeBlocks.length === 0 ? (
        <div className="p-8 my-6 rounded-[3px] border border-amber-500/40 bg-amber-500/10 text-center flex flex-col items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3 animate-pulse" />
          <h3 className="text-base font-mono font-bold text-spy-text mb-1">
            {structureLoadingError ? "Structure Synchronization Notice" : "Planner Grid Unpopulated"}
          </h3>
          <p className="text-xs font-mono text-spy-muted max-w-md mb-4 leading-relaxed">
            {structureLoadingError ||
              "Supabase structure tables returned 0 blocks for this session. Click below to retry seeding and synchronizing your routine."}
          </p>
          {onRetryLoad && (
            <button
              onClick={onRetryLoad}
              className="px-4 py-2 text-xs font-mono font-bold rounded-[3px] bg-spy-green text-black hover:bg-spy-green/90 transition-colors shadow-sm flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Synchronization</span>
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <WeeklyGridView
          weekStartDate={currentWeekStart}
          timeBlocks={timeBlocks}
          academicEvents={academicEvents}
          missions={missions}
          categories={categories}
          onEditBlock={(block, dateStr) =>
            setBlockModal({
              isOpen: true,
              block,
              defaultWeekday: block.weekday,
              defaultDate: dateStr,
            })
          }
          onAddBlock={(weekday, dateStr) =>
            setBlockModal({
              isOpen: true,
              block: null,
              defaultWeekday: weekday,
              defaultDate: dateStr,
            })
          }
          onAssignMissionToBlock={(block, dateStr) => {
            if (onAssignNewMission) {
              onAssignNewMission({
                block,
                dateStr,
                startTime: block.start_time,
                endTime: block.end_time,
                defaultCategoryId: block.default_category || undefined,
              });
            } else {
              setAssignModal({
                isOpen: true,
                block,
                blockDateStr: dateStr,
              });
            }
          }}
          onAddMissionAtSlot={(dateStr, timeStr) => {
            if (onAssignNewMission) {
              const [hh, mm] = timeStr.split(":").map(Number);
              const endHh = (hh + 1) % 24;
              const endTime = `${String(endHh).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}`;
              onAssignNewMission({
                dateStr,
                startTime: timeStr,
                endTime,
              });
            }
          }}
          onConfirmAutoSchedule={onConfirmAutoSchedule}
          onCompleteMission={onCompleteMission}
          onOpenCourseHQ={onOpenCourseHQ}
          onEditMission={onEditMission}
          onEditTuition={(slot) => {
            if (onEditTuitionSlot) {
              onEditTuitionSlot(slot);
            } else {
              setTuitionModal({
                isOpen: true,
                day: slot.day,
                startTime: slot.startTime,
                endTime: slot.endTime,
                targetDate: slot.targetDate,
              });
            }
          }}
          tuitionExceptions={tuitionExceptions}
          onUndoTuitionException={onUndoTuitionException}
          onSaveRoutine={handleSaveRoutine}
          onDeleteRoutine={handleDeleteRoutine}
          onQuickMoveMission={handleQuickMoveMission}
          onOpenAcademicCalendar={() => setViewMode("calendar")}
        />
      ) : (
        <AcademicCalendarView
          timeBlocks={timeBlocks}
          academicEvents={academicEvents}
          missions={missions}
          onAddEvent={(dateStr) =>
            setEventModal({
              isOpen: true,
              event: null,
              defaultDate: dateStr,
            })
          }
          onDeleteEvent={onDeleteAcademicEvent}
          onCompleteMission={onCompleteMission}
        />
      )}

      {/* Modals */}
      <TimeBlockModal
        isOpen={blockModal.isOpen}
        block={blockModal.block}
        defaultWeekday={blockModal.defaultWeekday}
        defaultDate={blockModal.defaultDate}
        categories={categories}
        onSave={(data) => {
          if (blockModal.block) {
            onUpdateTimeBlock(blockModal.block.id, data);
          } else {
            onAddTimeBlock(data);
          }
        }}
        onDelete={onDeleteTimeBlock}
        onClose={() => setBlockModal({ isOpen: false, block: null })}
      />

      <AcademicEventModal
        isOpen={eventModal.isOpen}
        event={eventModal.event}
        defaultDate={eventModal.defaultDate}
        onSave={(data) => {
          if (eventModal.event) {
            onUpdateAcademicEvent(eventModal.event.id, data);
          } else {
            onAddAcademicEvent(data);
          }
        }}
        onDelete={onDeleteAcademicEvent}
        onClose={() => setEventModal({ isOpen: false, event: null })}
      />

      <AssignMissionModal
        isOpen={assignModal.isOpen}
        block={assignModal.block}
        blockDateStr={assignModal.blockDateStr}
        missions={missions}
        categories={categories}
        onCreateNew={() => {
          if (assignModal.block && onAssignNewMission) {
            onAssignNewMission({
              block: assignModal.block,
              dateStr: assignModal.blockDateStr,
              startTime: assignModal.block.start_time,
              endTime: assignModal.block.end_time,
              defaultCategoryId: assignModal.block.default_category || undefined,
            });
          }
        }}
        onAssign={(missionId, blockId, start, end) =>
          onScheduleMission(missionId, blockId, start, end)
        }
        onClose={() => setAssignModal({ isOpen: false, block: null, blockDateStr: "" })}
      />

      {onUpdateTuitionSchedule && (
        <TuitionScheduleModal
          isOpen={tuitionModal.isOpen}
          initialDays={tuitionModal.day ? [tuitionModal.day] : ["MON", "THU", "FRI"]}
          initialStartTime={tuitionModal.startTime || "18:00"}
          initialEndTime={tuitionModal.endTime || "19:30"}
          targetDate={tuitionModal.targetDate}
          targetDay={tuitionModal.day}
          onSave={onUpdateTuitionSchedule}
          onClose={() => setTuitionModal({ isOpen: false })}
        />
      )}

      {/* Plan Next Week Modal */}
      <PlanNextWeekModal
        isOpen={isPlanNextWeekOpen}
        currentWeekStartDate={currentWeekStart}
        timeBlocks={timeBlocks}
        academicEvents={academicEvents}
        missions={missions}
        categories={categories}
        onClose={() => setIsPlanNextWeekOpen(false)}
        onApplyPlan={async (assignments) => {
          for (const a of assignments) {
            onScheduleMission(a.missionId, a.blockId, a.startTime, a.endTime);
          }
        }}
      />

      {/* Routine Delete Undo Toast */}
      {undoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-spy-surface border border-spy-green/60 text-spy-text rounded-[4px] shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="text-xs font-mono">{undoToast.message}</span>
          <button
            type="button"
            onClick={handleUndoRoutineDelete}
            disabled={isUndoing}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-spy-green text-black hover:bg-spy-green/90 rounded-[2px] transition-colors flex items-center gap-1 disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isUndoing ? "Restoring..." : "Undo"}</span>
          </button>
          <button
            type="button"
            onClick={() => setUndoToast(null)}
            className="p-1 text-spy-muted hover:text-spy-text transition-colors rounded-[2px] cursor-pointer"
            title="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
