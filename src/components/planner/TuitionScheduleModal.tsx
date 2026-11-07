"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, AlertTriangle } from "lucide-react";
import { DayOfWeek } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { formatTime12 } from "@/lib/formatters";

interface TuitionScheduleModalProps {
  isOpen: boolean;
  initialDays?: DayOfWeek[];
  initialStartTime?: string;
  initialEndTime?: string;
  targetDate?: string;
  targetDay?: DayOfWeek;
  onSave: (options: {
    days: DayOfWeek[];
    startTime: string;
    endTime: string;
    scope: "always" | "this_week" | "move_session";
    targetDate?: string;
    targetDay?: DayOfWeek;
  }) => Promise<void> | void;
  onClose: () => void;
}

const ALL_DAYS: DayOfWeek[] = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];

export const TuitionScheduleModal: React.FC<TuitionScheduleModalProps> = ({
  isOpen,
  initialDays = ["MON", "THU", "FRI"],
  initialStartTime = "18:00",
  initialEndTime = "19:30",
  targetDate,
  targetDay,
  onSave,
  onClose,
}) => {
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(initialDays);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [scope, setScope] = useState<"always" | "this_week" | "move_session">(
    targetDate ? "move_session" : "always"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDays(initialDays.length > 0 ? initialDays : ["MON", "THU", "FRI"]);
      setStartTime(initialStartTime || "18:00");
      setEndTime(initialEndTime || "19:30");
      setScope(targetDate ? "move_session" : "always");
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, initialDays, initialStartTime, initialEndTime, targetDate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Keep at least one
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      setError("Please select at least one day of the week.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be later than start time.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        days: selectedDays,
        startTime,
        endTime,
        scope,
        targetDate,
        targetDay,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update tuition schedule";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-md bg-spy-surface border border-spy-border rounded-[6px] p-5 sm:p-6 text-spy-text shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[3px] bg-yellow-500/20 text-yellow-500">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-mono text-sm font-semibold text-spy-text">
                EDIT TUITION SCHEDULE
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

          {error && (
            <div className="mb-4 p-2.5 rounded-[4px] bg-spy-redMuted border border-spy-red/40 text-spy-red text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
            {/* Days Selection */}
            <div>
              <label className="block text-spy-muted mb-1.5 font-medium">
                Teaching Days
              </label>
              <div className="grid grid-cols-7 gap-1">
                {ALL_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`py-1.5 text-center font-mono text-[11px] font-bold rounded-[3px] border transition-colors ${
                        isSelected
                          ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50"
                          : "bg-spy-surface2 text-spy-dim border-spy-border hover:text-spy-text"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                />
                <span className="text-[10px] font-mono text-spy-dim mt-0.5 block">
                  {formatTime12(startTime)}
                </span>
              </div>

              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                />
                <span className="text-[10px] font-mono text-spy-dim mt-0.5 block">
                  {formatTime12(endTime)}
                </span>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="pt-1">
              <label className="block text-spy-muted mb-1.5 font-medium">
                Application Scope
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-2 rounded-[4px] bg-spy-surface2 border border-spy-border cursor-pointer hover:border-spy-green/50">
                  <input
                    type="radio"
                    name="tuition_scope"
                    value="always"
                    checked={scope === "always"}
                    onChange={() => setScope("always")}
                    className="mt-0.5 text-spy-green focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-spy-text block">
                      Apply from now on (Standard routine)
                    </span>
                    <span className="text-spy-dim text-[11px] block mt-0.5">
                      Updates your permanent weekly template, tuition prep auto-missions, and dashboard briefing.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded-[4px] bg-spy-surface2 border border-spy-border cursor-pointer hover:border-spy-green/50">
                  <input
                    type="radio"
                    name="tuition_scope"
                    value="this_week"
                    checked={scope === "this_week"}
                    onChange={() => setScope("this_week")}
                    className="mt-0.5 text-spy-green focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-spy-text block">
                      Only this week
                    </span>
                    <span className="text-spy-dim text-[11px] block mt-0.5">
                      Overrides the schedule for the current week without altering your recurring routine.
                    </span>
                  </div>
                </label>

                {targetDate && (
                  <label className="flex items-start gap-2.5 p-2 rounded-[4px] bg-spy-surface2 border border-spy-border cursor-pointer hover:border-spy-green/50">
                    <input
                      type="radio"
                      name="tuition_scope"
                      value="move_session"
                      checked={scope === "move_session"}
                      onChange={() => setScope("move_session")}
                      className="mt-0.5 text-spy-green focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold text-spy-text block">
                        Move this session only ({targetDate})
                      </span>
                      <span className="text-spy-dim text-[11px] block mt-0.5">
                        Reschedules only this single teaching session on {targetDate}.
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-spy-border">
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
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {isSaving ? "SAVING..." : "SAVE SCHEDULE"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
