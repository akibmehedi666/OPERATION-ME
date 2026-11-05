"use client";

import React, { useState } from "react";
import { TimeBlock, TimeBlockType, DayOfWeek, Category } from "@/types/database";
import { WEEKDAY_ORDER } from "@/lib/scheduleResolver";
import { formatTime12 } from "@/lib/formatters";
import { X, Trash2, Clock } from "lucide-react";

interface TimeBlockModalProps {
  isOpen: boolean;
  block?: TimeBlock | null;
  defaultWeekday?: DayOfWeek;
  defaultDate?: string;
  categories: Category[];
  onSave: (blockData: Omit<TimeBlock, "id" | "created_at">, isOnlyThisWeek?: boolean) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const BLOCK_TYPES: { type: TimeBlockType; label: string; color: string }[] = [
  { type: "class", label: "University class", color: "text-blue-500" },
  { type: "tuition", label: "Tuition", color: "text-orange-500" },
  { type: "project", label: "Project / career", color: "text-green-500" },
  { type: "study", label: "Course study", color: "text-purple-500" },
  { type: "cp", label: "CP / SQL practice", color: "text-teal-500" },
  { type: "break", label: "Break / rest / travel", color: "text-gray-400" },
];

export const TimeBlockModal: React.FC<TimeBlockModalProps> = ({
  isOpen,
  block,
  defaultWeekday = "SAT",
  defaultDate,
  categories,
  onSave,
  onDelete,
  onClose,
}) => {
  const [weekday, setWeekday] = useState<DayOfWeek>(block?.weekday || defaultWeekday);
  const [startTime, setStartTime] = useState<string>(block?.start_time || "10:00");
  const [endTime, setEndTime] = useState<string>(block?.end_time || "11:30");
  const [type, setType] = useState<TimeBlockType>(block?.type || "study");
  const [label, setLabel] = useState<string>(block?.label || "");
  const [defaultCategory, setDefaultCategory] = useState<string>(block?.default_category || "");
  const [isFixed, setIsFixed] = useState<boolean>(block?.is_fixed || false);
  const [isOnlyThisWeek, setIsOnlyThisWeek] = useState<boolean>(Boolean(block?.override_date));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    onSave(
      {
        weekday,
        start_time: startTime,
        end_time: endTime,
        type,
        label: label.trim(),
        default_category: defaultCategory || null,
        is_fixed: isFixed,
        is_active: true,
        override_date: isOnlyThisWeek ? defaultDate || null : null,
      },
      isOnlyThisWeek
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg p-6 bg-spy-surface border border-spy-border rounded-[6px] shadow-2xl text-spy-text max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-spy-green" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-spy-text">
              {block ? "EDIT TIME BLOCK" : "NEW TIME BLOCK"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-spy-muted hover:text-spy-text rounded-[3px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
              Block Label *
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Study OS / Economics, Project Deep Work"
              className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-sans"
            />
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-xs font-mono uppercase text-spy-muted mb-1.5">
              Block Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BLOCK_TYPES.map((bt) => {
                const isSelected = type === bt.type;
                return (
                  <button
                    key={bt.type}
                    type="button"
                    onClick={() => {
                      setType(bt.type);
                      if (bt.type === "class" || bt.type === "tuition") {
                        setIsFixed(true);
                      }
                    }}
                    className={`p-2 rounded-[3px] border text-left transition-colors flex items-center gap-2 text-xs font-mono ${
                      isSelected
                        ? "bg-spy-surface2 border-spy-green text-spy-green font-bold shadow-xs"
                        : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text hover:border-spy-borderLight"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${bt.color} bg-current`} />
                    <span className="truncate">{bt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekday */}
          <div>
            <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
              Day of Week
            </label>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_ORDER.map((wd) => {
                const isSelected = weekday === wd;
                return (
                  <button
                    key={wd}
                    type="button"
                    onClick={() => setWeekday(wd)}
                    className={`py-1.5 text-center text-xs font-mono rounded-[3px] border transition-colors ${
                      isSelected
                        ? "bg-[#14663a] text-white border-[#14663a] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green font-bold"
                        : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
                    }`}
                  >
                    {wd}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Times (Start & End) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-mono"
              />
              <span className="text-[10px] font-mono text-spy-muted mt-0.5 block">
                {formatTime12(startTime)}
              </span>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-mono"
              />
              <span className="text-[10px] font-mono text-spy-muted mt-0.5 block">
                {formatTime12(endTime)}
              </span>
            </div>
          </div>

          {/* Associated Category */}
          <div>
            <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
              Default Category (Optional)
            </label>
            <select
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-mono"
            >
              <option value="">-- None / General --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div className="pt-2 border-t border-spy-border space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="accent-spy-green rounded"
              />
              <span className="text-xs text-spy-text font-sans">
                Fixed block (classes / tuition cannot be moved by drag)
              </span>
            </label>

            {defaultDate && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isOnlyThisWeek}
                  onChange={(e) => setIsOnlyThisWeek(e.target.checked)}
                  className="accent-spy-green rounded"
                />
                <span className="text-xs text-spy-text font-sans">
                  Apply only to this week ({defaultDate})
                </span>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-spy-border">
            {block && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(block.id);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-mono text-spy-red hover:bg-spy-redMuted rounded-[3px] transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-spy-muted hover:text-spy-text border border-spy-border rounded-[3px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-mono font-bold bg-[#14663a] text-white hover:bg-[#0f4d2c] dark:bg-spy-green dark:text-black dark:hover:bg-spy-green/90 rounded-[3px] shadow-sm transition-colors"
              >
                {block ? "Save Changes" : "Create Block"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
