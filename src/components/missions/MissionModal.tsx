"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2 } from "lucide-react";
import { Mission, Category, Priority } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missionData: Partial<Mission>) => void;
  categories: Category[];
  editingMission?: Mission | null;
}

const CODENAME_PREFIXES = ["NIGHTFALL", "BLACKBIRD", "CIPHER", "SHADOW", "TITAN", "SPECTRE", "PHANTOM", "APEX", "AEGIS", "VANGUARD"];

export const MissionModal: React.FC<MissionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingMission,
}) => {
  const [title, setTitle] = useState("");
  const [codename, setCodename] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [notes, setNotes] = useState("");
  const [xp, setXp] = useState(50);
  const [status, setStatus] = useState<"active" | "locked">("active");

  useEffect(() => {
    if (editingMission) {
      setTitle(editingMission.title);
      setCodename(editingMission.codename || "");
      setCategoryId(editingMission.category_id || (categories[0]?.id || ""));
      setPriority(editingMission.priority);
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
        setDeadlineTime("");
      }
      setNotes(editingMission.notes || "");
      setXp(editingMission.xp || 50);
      setStatus(editingMission.status === "completed" ? "active" : (editingMission.status as "active" | "locked"));
    } else {
      setTitle("");
      generateCodename();
      setCategoryId(categories[0]?.id || "");
      setPriority("medium");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      setDeadlineDate(`${yyyy}-${mm}-${dd}`);
      setDeadlineTime("23:59");

      setNotes("");
      setXp(50);
      setStatus("active");
    }
  }, [editingMission, isOpen, categories]);

  const generateCodename = () => {
    const prefix = CODENAME_PREFIXES[Math.floor(Math.random() * CODENAME_PREFIXES.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setCodename(`OP-${prefix}-${num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let deadlineIso: string | null = null;
    if (deadlineDate) {
      const timeStr = deadlineTime || "23:59";
      deadlineIso = new Date(`${deadlineDate}T${timeStr}:00`).toISOString();
    }

    onSave({
      ...(editingMission ? { id: editingMission.id } : {}),
      title: title.trim(),
      codename: codename.trim() || `OP-MISSION-${Math.floor(100 + Math.random() * 900)}`,
      category_id: categoryId || null,
      priority,
      deadline: deadlineIso,
      notes: notes.trim() || null,
      xp: Number(xp) || 50,
      status,
    });

    onClose();
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
          className="relative w-full max-w-lg bg-spy-surface border border-spy-border rounded-[6px] p-4 sm:p-6 text-spy-text max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
            <span className="font-mono text-sm font-semibold text-spy-text">
              {editingMission ? "EDIT MISSION" : "NEW MISSION"}
            </span>
            <button
              onClick={onClose}
              className="text-spy-muted hover:text-spy-text"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
                placeholder="e.g. Implement OS Page Replacement"
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

            {/* Deadline Date & Time */}
            <div>
              <label className="block text-spy-muted mb-1 font-medium">
                Deadline
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
                  Initial Status
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
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief instructions, references, or links..."
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text placeholder:text-spy-dim focus:outline-none focus:border-spy-green rounded-[3px]"
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="sticky -bottom-4 sm:-bottom-6 bg-spy-surface pt-3 pb-1 border-t border-spy-border flex items-center justify-end gap-3 z-10">
              <Button type="button" variant="stealth" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingMission ? "Save Changes" : "Create Mission"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
