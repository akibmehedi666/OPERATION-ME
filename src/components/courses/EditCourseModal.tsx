"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, AlertTriangle } from "lucide-react";
import { Course } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface EditCourseModalProps {
  isOpen: boolean;
  course: Course | null;
  onSave: (courseId: string, updates: Partial<Course>) => Promise<void> | void;
  onClose: () => void;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  course,
  onSave,
  onClose,
}) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [room, setRoom] = useState("");
  const [credits, setCredits] = useState<number>(3.0);
  const [classTimes, setClassTimes] = useState("");
  const [color, setColor] = useState("#10b981");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (course && isOpen) {
      setCode(course.code || "");
      setName(course.name || "");
      setSection(course.section || "");
      setRoom(course.room || "");
      setCredits(course.credits || 3.0);
      setClassTimes(course.class_times || "");
      setColor(course.color || "#10b981");
      setError(null);
      setIsSaving(false);
    }
  }, [course, isOpen]);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Course code and course title are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(course.id, {
        code: code.trim(),
        name: name.trim(),
        section: section.trim() || undefined,
        room: room.trim() || undefined,
        credits: Number(credits) || 3.0,
        class_times: classTimes.trim() || undefined,
        color,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update course";
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
          className="relative w-full max-w-lg bg-spy-surface border border-spy-border rounded-[6px] p-5 sm:p-6 text-spy-text shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[3px] bg-spy-green/20 text-spy-green">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-mono text-sm font-semibold text-spy-text">
                EDIT COURSE DIRECTIVE
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

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-spy-muted mb-1 font-medium">
                  Course Code <span className="text-spy-green">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CSE-406"
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-spy-muted mb-1 font-medium">
                  Course Name <span className="text-spy-green">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text font-medium focus:outline-none focus:border-spy-green rounded-[3px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  Section
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. A"
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                />
              </div>

              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  Room
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. UB406"
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                />
              </div>

              <div>
                <label className="block text-spy-muted mb-1 font-medium">
                  Credits
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={credits}
                  onChange={(e) => setCredits(parseFloat(e.target.value) || 3.0)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-spy-muted mb-1 font-medium">
                Class Schedule / Routine
              </label>
              <input
                type="text"
                value={classTimes}
                onChange={(e) => setClassTimes(e.target.value)}
                placeholder="e.g. SUN & WED 11:10 AM - 12:30 PM"
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text font-mono focus:outline-none focus:border-spy-green rounded-[3px]"
              />
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
              >
                {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
