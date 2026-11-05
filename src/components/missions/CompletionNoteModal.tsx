"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Check, FileText } from "lucide-react";
import { Mission } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface CompletionNoteModalProps {
  isOpen: boolean;
  mission: Mission | null;
  onComplete?: (mission: Mission, note?: string, timeSpentMinutes?: number) => void;
  onSaveEdit?: (missionId: string, note?: string, timeSpentMinutes?: number) => void;
  onClose: () => void;
  isEditingOnly?: boolean;
}

export const CompletionNoteModal: React.FC<CompletionNoteModalProps> = ({
  isOpen,
  mission,
  onComplete,
  onSaveEdit,
  onClose,
  isEditingOnly = false,
}) => {
  const [note, setNote] = useState("");
  const [timeSpent, setTimeSpent] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && mission) {
      setNote(mission.completion_note || "");
      setTimeSpent(
        mission.time_spent_minutes ? String(mission.time_spent_minutes) : ""
      );
      // Auto-focus the note input for speed
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setNote("");
      setTimeSpent("");
    }
  }, [isOpen, mission]);

  if (!isOpen || !mission) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedMinutes = timeSpent.trim() ? parseInt(timeSpent, 10) : undefined;
    const finalNote = note.trim() || undefined;

    if (isEditingOnly && onSaveEdit) {
      onSaveEdit(mission.id, finalNote, isNaN(parsedMinutes as number) ? undefined : parsedMinutes);
    } else if (onComplete) {
      onComplete(mission, finalNote, isNaN(parsedMinutes as number) ? undefined : parsedMinutes);
    }
    onClose();
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete(mission, undefined, undefined);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md clean-card p-5 shadow-2xl font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-3">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-spy-green">
                {isEditingOnly ? "Edit Debrief Note" : "Mission Debrief"}
              </span>
              <h3 className="text-sm font-semibold text-spy-text truncate mt-0.5">
                {mission.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-spy-muted hover:text-spy-text transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            {/* Completion Note Input */}
            <div>
              <label className="block text-spy-muted mb-1 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-spy-green" />
                <span>What did you do or learn? (optional)</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. solved with DP, took 40 min"
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text placeholder:text-spy-dim focus:outline-none focus:border-spy-green rounded-[4px]"
              />
            </div>

            {/* Time Spent Input */}
            <div>
              <label className="block text-spy-muted mb-1 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-spy-green" />
                <span>Time spent (minutes, optional)</span>
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 45"
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text placeholder:text-spy-dim focus:outline-none focus:border-spy-green rounded-[4px] font-mono"
              />
            </div>

            {/* Actions: Save & Complete vs Skip */}
            <div className="flex items-center justify-between pt-2">
              {!isEditingOnly ? (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-mono text-spy-muted hover:text-spy-text transition-colors underline"
                >
                  Skip note
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="stealth"
                  size="sm"
                  onClick={onClose}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isEditingOnly ? "Save Note" : "Save & Complete"}</span>
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

