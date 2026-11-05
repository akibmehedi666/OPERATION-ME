"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, Sparkles, Wand2, Calendar, FileText } from "lucide-react";
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
      // Defaults for new mission
      setTitle("");
      generateCodename();
      setCategoryId(categories[0]?.id || "");
      setPriority("medium");
      
      // Default deadline to tomorrow 23:59
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-spy-surface border-2 border-spy-border tactical-card p-6 font-mono text-spy-text max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
            <div className="flex items-center gap-2 text-spy-green font-bold text-sm tracking-wider">
              <ShieldAlert className="w-4 h-4 text-spy-green" />
              <span>{editingMission ? "MODIFY DIRECTIVE" : "AUTHORIZE NEW MISSION"}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-spy-red transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold">
                Objective Title <span className="text-spy-green">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement Operating Systems Page Replacement Algo"
                className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green text-sm"
              />
            </div>

            {/* Codename Generator */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-spy-dim uppercase tracking-wider font-semibold">
                  Codename
                </label>
                <button
                  type="button"
                  onClick={generateCodename}
                  className="flex items-center gap-1 text-[11px] text-spy-green hover:underline"
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
                className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-green font-bold tracking-widest focus:outline-none focus:border-spy-green uppercase text-sm"
              />
            </div>

            {/* Category & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold">
                  Department / Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold">
                  Threat Level / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green"
                >
                  <option value="urgent" className="bg-slate-900 text-red-400">
                    URGENT (OMEGA)
                  </option>
                  <option value="high" className="bg-slate-900 text-amber-400">
                    HIGH (ALPHA)
                  </option>
                  <option value="medium" className="bg-slate-900 text-sky-400">
                    MEDIUM (BRAVO)
                  </option>
                  <option value="low" className="bg-slate-900 text-slate-400">
                    LOW (CHARLIE)
                  </option>
                </select>
              </div>
            </div>

            {/* Deadline Date & Time */}
            <div>
              <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-spy-green" />
                <span>Target Deadline (Cutoff Time)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green"
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green"
                />
              </div>
            </div>

            {/* XP and Initial Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-spy-amber" />
                  <span>XP Bounty</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="5"
                  value={xp}
                  onChange={(e) => setXp(Number(e.target.value))}
                  className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-amber font-bold focus:outline-none focus:border-spy-green"
                />
              </div>

              <div>
                <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold">
                  Queue Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "locked")}
                  className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green"
                >
                  <option value="active" className="bg-slate-900 text-spy-green">
                    ACTIVE DIRECTIVE
                  </option>
                  <option value="locked" className="bg-slate-900 text-slate-400">
                    QUEUED (STANDBY)
                  </option>
                </select>
              </div>
            </div>

            {/* Tactical Notes / Intel */}
            <div>
              <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-spy-green" />
                <span>Tactical Briefing / Intel Notes</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key directives, reference links, specific chapter problems, or requirements..."
                className="w-full bg-black/60 border border-spy-border px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green"
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-spy-border">
              <Button type="button" variant="stealth" size="sm" onClick={onClose}>
                DISMISS
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingMission ? "UPDATE DIRECTIVE" : "DEPLOY MISSION"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

