"use client";

import React, { useState } from "react";
import { AcademicEvent, AcademicEventType } from "@/types/database";
import { X, Trash2, Calendar } from "lucide-react";

interface AcademicEventModalProps {
  isOpen: boolean;
  event?: AcademicEvent | null;
  defaultDate?: string;
  onSave: (eventData: Omit<AcademicEvent, "id" | "created_at">) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const EVENT_TYPES: { type: AcademicEventType; label: string; color: string }[] = [
  { type: "exam", label: "Exam (Mid-term / Final / Quiz)", color: "text-red-500" },
  { type: "deadline", label: "Assignment / Submission Deadline", color: "text-orange-500" },
  { type: "payment", label: "Tuition Installment Payment", color: "text-amber-500" },
  { type: "holiday", label: "Holiday / University Closed", color: "text-gray-400" },
  { type: "class_override", label: "Online Class Schedule Override", color: "text-blue-500" },
];

export const AcademicEventModal: React.FC<AcademicEventModalProps> = ({
  isOpen,
  event,
  defaultDate,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState<string>(event?.title || "");
  const [date, setDate] = useState<string>(event?.date || defaultDate || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(event?.end_date || "");
  const [type, setType] = useState<AcademicEventType>(event?.type || "deadline");
  const [details, setDetails] = useState<string>(event?.details || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    onSave({
      title: title.trim(),
      date,
      end_date: endDate || null,
      type,
      details: details.trim() || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md p-6 bg-spy-surface border border-spy-border rounded-[6px] shadow-2xl text-spy-text max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-spy-green" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-spy-text">
              {event ? "EDIT ACADEMIC KEY DATE" : "NEW ACADEMIC EVENT"}
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
          {/* Title */}
          <div>
            <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating Systems Quiz 2, FYDP Mid-Review"
              className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-sans"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
              Event Type
            </label>
            <div className="space-y-1.5">
              {EVENT_TYPES.map((et) => {
                const isSelected = type === et.type;
                return (
                  <button
                    key={et.type}
                    type="button"
                    onClick={() => setType(et.type)}
                    className={`w-full p-2 rounded-[3px] border text-left transition-colors flex items-center gap-2 text-xs font-mono ${
                      isSelected
                        ? "bg-spy-surface2 border-spy-green text-spy-green font-bold shadow-xs"
                        : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${et.color} bg-current`} />
                    <span className="truncate">{et.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Optional End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                End Date (Optional Range)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-mono"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
              Details / Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Covers chapters 1-4, carry scientific calculator..."
              className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-sans"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-spy-border">
            {event && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(event.id);
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
                {event ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
