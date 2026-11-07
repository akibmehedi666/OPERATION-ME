"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2, Clock, AlertTriangle, Target } from "lucide-react";
import { Mission, Category, Priority, TimeBlock, AcademicEvent } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { formatTime12 } from "@/lib/formatters";
import { checkScheduleOverlap, formatDateKey } from "@/lib/scheduleResolver";

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missionData: Partial<Mission>) => Promise<{ success: boolean; error?: string } | void> | void;
  categories: Category[];
  editingMission?: Mission | null;
  timeBlocks?: TimeBlock[];
  academicEvents?: AcademicEvent[];
  existingMissions?: Mission[];
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialBlockId?: string;
}

const CODENAME_PREFIXES = [
  "NIGHTFALL", "BLACKBIRD", "CIPHER", "SHADOW", "TITAN", 
  "SPECTRE", "PHANTOM", "APEX", "AEGIS", "VANGUARD", "GHOST"
];

// Helper to add minutes to "HH:MM"
function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const [h, m] = (timeStr || "14:00").split(":").map(Number);
  const totalMin = (h || 0) * 60 + (m || 0) + minutesToAdd;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingMission,
  timeBlocks = [],
  academicEvents = [],
  existingMissions = [],
  initialDate,
  initialStartTime,
  initialEndTime,
  initialBlockId,
}) => {
  const [title, setTitle] = useState("");
  const [codename, setCodename] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [notes, setNotes] = useState("");
  const [xp, setXp] = useState(50);
  const [status, setStatus] = useState<"active" | "locked">("active");

  // Precise timing states
  const [hasSpecificTime, setHasSpecificTime] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:00");
  const [scheduledBlockId, setScheduledBlockId] = useState<string | null>(null);

  // Deadline states
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");

  // Status & error states
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = useMemo(() => formatDateKey(new Date()), []);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    setIsSaving(false);

    if (editingMission) {
      setTitle(editingMission.title);
      setCodename(editingMission.codename || "");
      setCategoryId(editingMission.category_id || categories[0]?.id || "");
      setPriority(editingMission.priority);
      setNotes(editingMission.notes || "");
      setXp(editingMission.xp || 50);
      setStatus(
        editingMission.status === "completed"
          ? "active"
          : (editingMission.status as "active" | "locked")
      );
      setScheduledBlockId(editingMission.scheduled_block_id || null);

      if (editingMission.scheduled_start) {
        setHasSpecificTime(true);
        const s = new Date(editingMission.scheduled_start);
        const syyyy = s.getFullYear();
        const smm = String(s.getMonth() + 1).padStart(2, "0");
        const sdd = String(s.getDate()).padStart(2, "0");
        const shh = String(s.getHours()).padStart(2, "0");
        const smin = String(s.getMinutes()).padStart(2, "0");
        setScheduledDate(`${syyyy}-${smm}-${sdd}`);
        setStartTime(`${shh}:${smin}`);

        if (editingMission.scheduled_end) {
          const e = new Date(editingMission.scheduled_end);
          const ehh = String(e.getHours()).padStart(2, "0");
          const emin = String(e.getMinutes()).padStart(2, "0");
          setEndTime(`${ehh}:${emin}`);
        } else {
          setEndTime(addMinutesToTime(`${shh}:${smin}`, 60));
        }
      } else {
        setHasSpecificTime(false);
        setScheduledDate(initialDate || todayStr);
        setStartTime(initialStartTime || "14:00");
        setEndTime(initialEndTime || "15:00");
      }

      if (editingMission.deadline) {
        const d = new Date(editingMission.deadline);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        setDeadlineDate(`${yyyy}-${mm}-${dd}`);
        setDeadlineTime(`${hh}:${min}`);
      } else {
        setDeadlineDate("");
        setDeadlineTime("23:59");
      }
    } else {
      // New mission default
      setTitle("");
      generateCodename();
      setCategoryId(categories[0]?.id || "");
      setPriority("medium");
      setNotes("");
      setXp(50);
      setStatus("active");
      setScheduledBlockId(initialBlockId || null);

      const targetDateStr = initialDate || todayStr;
      setScheduledDate(targetDateStr);
      setStartTime(initialStartTime || "14:00");
      setEndTime(initialEndTime || (initialStartTime ? addMinutesToTime(initialStartTime, 60) : "15:00"));

      // Default to specific time enabled so Date, Start Time, End Time and Quick Duration chips are readily accessible
      setHasSpecificTime(true);

      // Default deadline to tomorrow midnight
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDeadlineDate(formatDateKey(tomorrow));
      setDeadlineTime("23:59");
    }
  }, [
    isOpen,
    editingMission,
    categories,
    initialDate,
    initialStartTime,
    initialEndTime,
    initialBlockId,
    todayStr,
  ]);

  const generateCodename = () => {
    const prefix = CODENAME_PREFIXES[Math.floor(Math.random() * CODENAME_PREFIXES.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setCodename(`OP-${prefix}-${num}`);
  };

  // Quick duration chips handler
  const handleApplyDuration = (minutes: number) => {
    setEndTime(addMinutesToTime(startTime, minutes));
  };

  // Check overlap with university classes, tuition, and existing missions
  const overlapConflict = useMemo(() => {
    if (!hasSpecificTime || !scheduledDate || !startTime || !endTime) {
      return { hasConflict: false };
    }
    return checkScheduleOverlap(
      scheduledDate,
      startTime,
      endTime,
      timeBlocks,
      academicEvents,
      existingMissions,
      editingMission?.id
    );
  }, [
    hasSpecificTime,
    scheduledDate,
    startTime,
    endTime,
    timeBlocks,
    academicEvents,
    existingMissions,
    editingMission,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Mission title is required.");
      return;
    }

    let scheduledStartIso: string | null = null;
    let scheduledEndIso: string | null = null;

    if (hasSpecificTime) {
      if (!scheduledDate) {
        setErrorMessage("Please select a date for the mission.");
        return;
      }
      if (startTime >= endTime) {
        setErrorMessage("Scheduled end time must be later than start time.");
        return;
      }
      scheduledStartIso = new Date(`${scheduledDate}T${startTime}:00`).toISOString();
      scheduledEndIso = new Date(`${scheduledDate}T${endTime}:00`).toISOString();
    }

    let deadlineIso: string | null = null;
    if (deadlineDate) {
      const timeStr = deadlineTime || "23:59";
      deadlineIso = new Date(`${deadlineDate}T${timeStr}:00`).toISOString();
    } else if (hasSpecificTime && scheduledEndIso) {
      // Default deadline to scheduled end time if not otherwise set
      deadlineIso = scheduledEndIso;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload: Partial<Mission> = {
        ...(editingMission?.id ? { id: editingMission.id } : {}),
        title: title.trim(),
        codename: codename.trim() || `OP-MISSION-${Math.floor(100 + Math.random() * 900)}`,
        category_id: categoryId || null,
        priority,
        deadline: deadlineIso,
        notes: notes.trim() || null,
        xp: Number(xp) || 50,
        status,
        scheduled_start: scheduledStartIso,
        scheduled_end: scheduledEndIso,
        scheduled_block_id: scheduledBlockId,
        course_id: editingMission?.course_id || null,
        project_id: editingMission?.project_id || null,
        paper_id: editingMission?.paper_id || null,
        cf_log_id: editingMission?.cf_log_id || null,
      };

      const result = await onSave(payload);

      if (result && typeof result === "object" && result.success === false) {
        setErrorMessage(result.error || "Failed to persist mission in cloud database.");
        setIsSaving(false);
        return;
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving mission.";
      setErrorMessage(msg);
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-spy-surface border border-spy-border rounded-[6px] p-4 sm:p-6 text-spy-text max-h-[92vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-spy-green" />
              <span className="font-mono text-sm font-semibold text-spy-text">
                {editingMission ? "EDIT MISSION DIRECTIVE" : "NEW MISSION DIRECTIVE"}
              </span>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-spy-muted hover:text-spy-text"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-[4px] bg-spy-redMuted border border-spy-red/40 text-spy-red text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            {/* Title */}
            <div>
              <label className="block text-spy-muted mb-1 font-medium">
                Title <span className="text-spy-green">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement OS Page Replacement Algorithm"
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text placeholder:text-spy-dim focus:outline-none focus:border-spy-green rounded-[3px]"
              />
            </div>

            {/* Codename Generator */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-spy-muted font-medium">
                  Codename
                </label>
                <button
                  type="button"
                  onClick={generateCodename}
                  className="flex items-center gap-1 text-[11px] font-mono text-spy-green hover:underline"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Randomize</span>
                </button>
              </div>
              <input
                type="text"
                value={codename}
                onChange={(e) => setCodename(e.target.value.toUpperCase())}
                placeholder="OP-SHADOW-01"
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs font-mono font-medium text-spy-text focus:outline-none focus:border-spy-green uppercase rounded-[3px]"
              />
            </div>

            {/* Category & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green rounded-[3px] cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-spy-surface text-spy-text">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green rounded-[3px] cursor-pointer"
                >
                  <option value="urgent" className="bg-spy-surface text-spy-red font-semibold">
                    Urgent (Red)
                  </option>
                  <option value="high" className="bg-spy-surface text-spy-amber font-semibold">
                    High (Amber)
                  </option>
                  <option value="medium" className="bg-spy-surface text-spy-green font-semibold">
                    Medium (Green)
                  </option>
                  <option value="low" className="bg-spy-surface text-spy-muted">
                    Low (Normal)
                  </option>
                </select>
              </div>
            </div>

            {/* PRECISE TIME SCHEDULING SECTION */}
            <div className="p-3 rounded-[5px] bg-spy-surface2 border border-spy-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-spy-text flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-spy-green" />
                  <span>Precise Time Execution</span>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-spy-muted select-none">
                  <input
                    type="checkbox"
                    checked={!hasSpecificTime}
                    onChange={(e) => setHasSpecificTime(!e.target.checked)}
                    className="rounded-[2px] text-spy-green focus:ring-0"
                  />
                  <span>No specific time (deadline only)</span>
                </label>
              </div>

              {hasSpecificTime && (
                <div className="space-y-3 pt-1">
                  {/* Date & Start/End Times */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-spy-dim text-[11px] mb-1 font-mono">
                        Date
                      </label>
                      <input
                        type="date"
                        required={hasSpecificTime}
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-spy-surface border border-spy-border px-2 py-1.5 text-xs text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                      />
                    </div>

                    <div>
                      <label className="block text-spy-dim text-[11px] mb-1 font-mono">
                        Start Time ({formatTime12(startTime)})
                      </label>
                      <input
                        type="time"
                        required={hasSpecificTime}
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-spy-surface border border-spy-border px-2 py-1.5 text-xs text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                      />
                    </div>

                    <div>
                      <label className="block text-spy-dim text-[11px] mb-1 font-mono">
                        End Time ({formatTime12(endTime)})
                      </label>
                      <input
                        type="time"
                        required={hasSpecificTime}
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-spy-surface border border-spy-border px-2 py-1.5 text-xs text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                      />
                    </div>
                  </div>

                  {/* Duration Chips */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] font-mono text-spy-dim uppercase tracking-wider">
                      Quick Duration:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyDuration(30)}
                      className="px-2 py-0.5 rounded-[2px] bg-spy-surface border border-spy-border hover:border-spy-green text-spy-text text-[11px] font-mono"
                    >
                      30m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDuration(60)}
                      className="px-2 py-0.5 rounded-[2px] bg-spy-surface border border-spy-border hover:border-spy-green text-spy-text text-[11px] font-mono"
                    >
                      1h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDuration(120)}
                      className="px-2 py-0.5 rounded-[2px] bg-spy-surface border border-spy-border hover:border-spy-green text-spy-text text-[11px] font-mono"
                    >
                      2h
                    </button>
                  </div>

                  {/* Conflict / Overlap Alert Banner */}
                  {overlapConflict.hasConflict && (
                    <div className="p-2.5 rounded-[4px] bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <span className="font-bold">Schedule Overlap Warning:</span> Conflicts with{" "}
                        <span className="font-semibold underline">
                          {overlapConflict.conflictName}
                        </span>{" "}
                        ({overlapConflict.conflictTimeRange}).
                        <div className="text-[10px] opacity-80 mt-0.5">
                          You may still save if this is intentional.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Deadline Date & Time (Shown when no specific time or for deadline target) */}
            <div>
              <label className="block text-spy-muted mb-1 font-medium flex items-center justify-between">
                <span>Mission Deadline</span>
                {hasSpecificTime && (
                  <span className="text-[10px] text-spy-dim font-mono">
                    (Auto-synced with scheduled end time if empty)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green rounded-[3px]"
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green rounded-[3px]"
                />
              </div>
            </div>

            {/* XP and Initial Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  XP Bounty
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="5"
                  value={xp}
                  onChange={(e) => setXp(Number(e.target.value))}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs font-mono text-spy-amber font-bold focus:outline-none focus:border-spy-green rounded-[3px]"
                />
              </div>

              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "locked")}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green rounded-[3px] cursor-pointer"
                >
                  <option value="active" className="bg-spy-surface text-spy-green font-semibold">
                    Active
                  </option>
                  <option value="locked" className="bg-spy-surface text-spy-muted">
                    Queued
                  </option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-spy-muted mb-1 font-medium">
                Notes & Objectives
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tactical directives, references, links, or execution steps..."
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text placeholder:text-spy-dim focus:outline-none focus:border-spy-green rounded-[3px]"
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="sticky -bottom-4 sm:-bottom-6 bg-spy-surface pt-3 pb-1 border-t border-spy-border flex items-center justify-end gap-3 z-10">
              <Button
                type="button"
                variant="stealth"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? "SAVING..." : editingMission ? "Save Changes" : "Create Mission"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
