"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  GraduationCap, 
  Clock, 
  CalendarX, 
  CalendarDays, 
  ArrowLeft, 
  AlertTriangle, 
  ChevronRight,
  Info
} from "lucide-react";
import { formatTime12 } from "@/lib/formatters";

interface TuitionActionModalProps {
  isOpen: boolean;
  dateStr: string; // "YYYY-MM-DD" e.g. "2026-11-08"
  startTime: string; // "18:00"
  endTime: string;   // "19:30"
  slotId?: string;
  onMoveSession: (params: {
    date: string;
    newStart: string;
    newEnd: string;
    note?: string;
    slotId?: string;
  }) => Promise<void> | void;
  onCancelSession: (params: {
    date: string;
    skipWeeks: number;
    note?: string;
    slotId?: string;
  }) => Promise<void> | void;
  onOpenWeeklySchedule: () => void;
  onClose: () => void;
}

export const TuitionActionModal: React.FC<TuitionActionModalProps> = ({
  isOpen,
  dateStr,
  startTime,
  endTime,
  slotId,
  onMoveSession,
  onCancelSession,
  onOpenWeeklySchedule,
  onClose,
}) => {
  const [view, setView] = useState<"menu" | "move" | "cancel">("menu");

  // Move form state (Simplified: NO day toggles, NO scope radios)
  const [targetDate, setTargetDate] = useState<string>(dateStr);
  const [newStart, setNewStart] = useState<string>(startTime);
  const [newEnd, setNewEnd] = useState<string>(endTime);
  const [moveNote, setMoveNote] = useState<string>("");

  // Cancel form state
  const [cancelMode, setCancelMode] = useState<"single" | "skip_weeks">("single");
  const [skipWeeksCount, setSkipWeeksCount] = useState<number>(1);
  const [cancelNote, setCancelNote] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setView("menu");
      setTargetDate(dateStr || new Date().toISOString().split("T")[0]);
      setNewStart(startTime || "18:00");
      setNewEnd(endTime || "19:30");
      setMoveNote("");
      setCancelMode("single");
      setSkipWeeksCount(1);
      setCancelNote("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, dateStr, startTime, endTime]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view !== "menu") {
          setView("menu");
          setError(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, view, onClose]);

  // Compute upcoming dates when skipping N weeks
  const skippedDatesList = useMemo(() => {
    if (!dateStr) return [];
    const count = Math.min(8, Math.max(1, skipWeeksCount));
    const dates: string[] = [];
    const base = new Date(`${dateStr}T12:00:00`);
    for (let i = 0; i < count; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i * 7);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dates.push(iso);
    }
    return dates;
  }, [dateStr, skipWeeksCount]);

  if (!isOpen) return null;

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStart || !newEnd) {
      setError("Please specify both start and end times.");
      return;
    }
    if (newStart >= newEnd) {
      setError("End time must be later than start time.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onMoveSession({
        date: targetDate,
        newStart,
        newEnd,
        note: moveNote.trim() || undefined,
        slotId,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to move session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const weeks = cancelMode === "single" ? 1 : skipWeeksCount;
      await onCancelSession({
        date: dateStr,
        skipWeeks: weeks,
        note: cancelNote.trim() || undefined,
        slotId,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel session");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatted date string for display
  const displayDateStr = dateStr
    ? new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "This Session";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="relative w-full max-w-md bg-spy-surface border border-spy-border rounded-[6px] p-5 sm:p-6 text-spy-text shadow-2xl overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-[4px] bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-spy-text">
                  Tuition Session
                </h3>
                <p className="text-[11px] font-mono text-spy-dim mt-0.5">
                  {displayDateStr} • {formatTime12(startTime)} – {formatTime12(endTime)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-spy-muted hover:text-spy-text p-1 rounded-[3px] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-[4px] bg-spy-redMuted border border-spy-red/40 text-spy-red text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= VIEW 1: MENU ================= */}
          {view === "menu" && (
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono text-spy-dim uppercase tracking-wider mb-1">
                Select Action
              </div>

              {/* Action 1: Move this session */}
              <button
                type="button"
                onClick={() => {
                  setView("move");
                  setError(null);
                }}
                className="w-full p-3 rounded-[4px] bg-spy-surface2 hover:bg-spy-surface border border-spy-border hover:border-yellow-500/50 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[3px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 group-hover:bg-yellow-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-spy-text font-mono group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
                      Move this session
                    </div>
                    <div className="text-[11px] text-spy-dim font-sans mt-0.5">
                      Change the time or date for this single session
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-spy-dim group-hover:text-spy-text transition-colors" />
              </button>

              {/* Action 2: Cancel this session */}
              <button
                type="button"
                onClick={() => {
                  setView("cancel");
                  setError(null);
                }}
                className="w-full p-3 rounded-[4px] bg-spy-surface2 hover:bg-spy-surface border border-spy-border hover:border-red-500/50 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[3px] bg-red-500/10 text-red-500 group-hover:bg-red-500/20">
                    <CalendarX className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-spy-text font-mono group-hover:text-red-500">
                      Cancel this session
                    </div>
                    <div className="text-[11px] text-spy-dim font-sans mt-0.5">
                      Cancel today&apos;s session or skip next N weeks
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-spy-dim group-hover:text-spy-text transition-colors" />
              </button>

              {/* Action 3: Edit weekly schedule */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWeeklySchedule();
                }}
                className="w-full p-3 rounded-[4px] bg-spy-surface2 hover:bg-spy-surface border border-spy-border hover:border-spy-green/50 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[3px] bg-spy-green/10 text-spy-green group-hover:bg-spy-green/20">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-spy-text font-mono group-hover:text-spy-green">
                      Edit weekly schedule
                    </div>
                    <div className="text-[11px] text-spy-dim font-sans mt-0.5">
                      Change recurring routine in Settings &gt; Schedule
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-spy-dim group-hover:text-spy-text transition-colors" />
              </button>
            </div>
          )}

          {/* ================= VIEW 2: MOVE SESSION (SIMPLIFIED) ================= */}
          {view === "move" && (
            <form onSubmit={handleConfirmMove} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setView("menu");
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 text-spy-dim hover:text-spy-text text-xs font-mono transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to options</span>
              </button>

              <div className="p-2.5 rounded-[4px] bg-spy-surface2 border border-spy-border text-xs text-spy-dim font-sans">
                Moving this single session updates your planner and reschedules the tuition prep auto-mission. Recurring weekly schedule remains unaffected.
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-spy-muted text-xs font-mono mb-1 font-medium">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs font-mono text-spy-text focus:outline-none focus:border-yellow-500 rounded-[3px]"
                />
              </div>

              {/* Start & End Times with 12h previews */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-spy-muted text-xs font-mono mb-1 font-medium">
                    New Start
                  </label>
                  <input
                    type="time"
                    required
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs font-mono text-spy-text focus:outline-none focus:border-yellow-500 rounded-[3px]"
                  />
                  <span className="text-[10px] font-mono text-spy-dim mt-0.5 block">
                    {formatTime12(newStart)}
                  </span>
                </div>

                <div>
                  <label className="block text-spy-muted text-xs font-mono mb-1 font-medium">
                    New End
                  </label>
                  <input
                    type="time"
                    required
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs font-mono text-spy-text focus:outline-none focus:border-yellow-500 rounded-[3px]"
                  />
                  <span className="text-[10px] font-mono text-spy-dim mt-0.5 block">
                    {formatTime12(newEnd)}
                  </span>
                </div>
              </div>

              {/* Note / Reason */}
              <div>
                <label className="block text-spy-muted text-xs font-mono mb-1 font-medium">
                  Note / Reason <span className="text-spy-dim">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student requested later start"
                  value={moveNote}
                  onChange={(e) => setMoveNote(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs font-mono text-spy-text focus:outline-none focus:border-yellow-500 rounded-[3px]"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-spy-border">
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-mono text-spy-dim hover:text-spy-text rounded-[3px] border border-spy-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-mono font-bold text-white bg-yellow-600 hover:bg-yellow-500 rounded-[3px] transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? "Moving..." : "Confirm Move"}
                </button>
              </div>
            </form>
          )}

          {/* ================= VIEW 3: CANCEL SESSION (WITH SKIP N WEEKS) ================= */}
          {view === "cancel" && (
            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setView("menu");
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 text-spy-dim hover:text-spy-text text-xs font-mono transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to options</span>
              </button>

              {/* Radio 1: Single session vs Skip N weeks */}
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-2.5 rounded-[4px] bg-spy-surface2 border border-spy-border cursor-pointer hover:border-spy-borderLight">
                  <input
                    type="radio"
                    name="cancel_scope"
                    value="single"
                    checked={cancelMode === "single"}
                    onChange={() => setCancelMode("single")}
                    className="mt-0.5 text-red-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-mono text-xs font-bold text-spy-text block">
                      Cancel only this session
                    </span>
                    <span className="text-spy-dim text-[11px] block mt-0.5">
                      Cancels tuition on {displayDateStr}.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-[4px] bg-spy-surface2 border border-spy-border cursor-pointer hover:border-spy-borderLight">
                  <input
                    type="radio"
                    name="cancel_scope"
                    value="skip_weeks"
                    checked={cancelMode === "skip_weeks"}
                    onChange={() => setCancelMode("skip_weeks")}
                    className="mt-0.5 text-red-500 focus:ring-0"
                  />
                  <div className="flex-1">
                    <span className="font-mono text-xs font-bold text-spy-text block">
                      Skip next N weeks
                    </span>
                    <span className="text-spy-dim text-[11px] block mt-0.5">
                      Cancel this session plus consecutive weekly occurrences
                    </span>
                  </div>
                </label>
              </div>

              {/* If Skip N weeks is selected, show dropdown 1 to 8 weeks */}
              {cancelMode === "skip_weeks" && (
                <div className="p-3 bg-spy-surface2 border border-spy-border rounded-[4px] space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-mono text-spy-muted">
                      Weeks to skip:
                    </label>
                    <select
                      value={skipWeeksCount}
                      onChange={(e) => setSkipWeeksCount(Number(e.target.value))}
                      className="bg-spy-surface border border-spy-border px-3 py-1.5 text-xs font-mono text-spy-text rounded-[3px] focus:outline-none focus:border-red-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "week" : "weeks"} ({n} {n === 1 ? "session" : "sessions"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-[11px] font-mono text-spy-dim border-t border-spy-border pt-2">
                    <span className="text-spy-muted font-bold block mb-1">
                      Affected Dates ({skippedDatesList.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skippedDatesList.map((d) => (
                        <span
                          key={d}
                          className="px-1.5 py-0.5 rounded-[3px] bg-spy-surface border border-spy-border text-[10px] text-spy-muted"
                        >
                          {new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Note / Reason */}
              <div>
                <label className="block text-spy-muted text-xs font-mono mb-1 font-medium">
                  Cancellation Note <span className="text-spy-dim">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student mid-term exams"
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs font-mono text-spy-text focus:outline-none focus:border-red-500 rounded-[3px]"
                />
              </div>

              {/* Information chip */}
              <div className="p-2.5 rounded-[4px] bg-spy-surface2 border border-spy-border flex items-start gap-2 text-[11px] text-spy-dim font-sans">
                <Info className="w-3.5 h-3.5 text-spy-dim shrink-0 mt-0.5" />
                <span>
                  Cancelled sessions show as faded chips with an <strong className="text-spy-text">Undo</strong> button. Any &ldquo;Prepare tuition lesson&rdquo; missions for these dates will be removed.
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-spy-border">
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-mono text-spy-dim hover:text-spy-text rounded-[3px] border border-spy-border transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-mono font-bold text-white bg-red-600 hover:bg-red-500 rounded-[3px] transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
