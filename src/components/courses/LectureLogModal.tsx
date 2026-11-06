"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, CheckCircle, Clock } from "lucide-react";
import { LectureLog, Course } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface LectureLogModalProps {
  isOpen: boolean;
  course: Course;
  logToEdit?: LectureLog | null;
  onClose: () => void;
  onSave: (log: Omit<LectureLog, "id"> | LectureLog) => void;
}

export const LectureLogModal: React.FC<LectureLogModalProps> = ({
  isOpen,
  course,
  logToEdit,
  onClose,
  onSave,
}) => {
  const [topic, setTopic] = useState("");
  const [lectureNumber, setLectureNumber] = useState<number>(1);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [studied, setStudied] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (logToEdit) {
      setTopic(logToEdit.topic || "");
      setLectureNumber(logToEdit.lecture_number || 1);
      setDate(logToEdit.date || new Date().toISOString().split("T")[0]);
      setStudied(!!logToEdit.studied);
      setNotes(logToEdit.notes || "");
    } else {
      setTopic("");
      setLectureNumber(1);
      setDate(new Date().toISOString().split("T")[0]);
      setStudied(false);
      setNotes("");
    }
    setError("");
  }, [logToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a lecture topic");
      return;
    }

    if (logToEdit) {
      onSave({
        ...logToEdit,
        course_name: course.name,
        course_id: course.id,
        topic: topic.trim(),
        lecture_number: Number(lectureNumber),
        date,
        studied,
        notes: notes.trim() || undefined,
      });
    } else {
      onSave({
        course_name: course.name,
        course_id: course.id,
        topic: topic.trim(),
        lecture_number: Number(lectureNumber),
        date,
        studied,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-spy-surface border border-spy-border rounded-[6px] p-5 sm:p-6 text-spy-text shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-spy-green" />
            <h3 className="text-sm font-semibold text-spy-text font-mono">
              {logToEdit ? "EDIT LECTURE LOG" : "LOG NEW LECTURE"} &middot; {course.code}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-spy-muted hover:text-spy-text p-1"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-[4px] bg-spy-redMuted border border-spy-red/30 text-xs text-spy-red font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lecture Number and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Lecture #
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={lectureNumber}
                onChange={(e) => setLectureNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
                required
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              Topic / Key Subject
            </label>
            <input
              type="text"
              placeholder="e.g. Page Replacement Algorithms & TLB Misses"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green"
              required
            />
          </div>

          {/* Studied Toggle */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1.5">
              Study Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStudied(true)}
                className={`py-2 px-3 rounded-[4px] border text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all ${
                  studied
                    ? "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green"
                    : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>STUDIED (Reviewed)</span>
              </button>
              <button
                type="button"
                onClick={() => setStudied(false)}
                className={`py-2 px-3 rounded-[4px] border text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all ${
                  !studied
                    ? "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber"
                    : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>NEEDS STUDY</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              Lecture Notes & Key Concepts
            </label>
            <textarea
              rows={4}
              placeholder="Record core formulas, algorithm invariants, lab pointers, or exam warnings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] p-2.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-spy-border">
            <Button type="button" variant="stealth" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {logToEdit ? "Save Changes" : "Record Lecture"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

