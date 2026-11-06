"use client";

import React, { useState, useEffect } from "react";
import { X, Trophy } from "lucide-react";
import { CodeforcesLog } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface CodeforcesLogModalProps {
  isOpen: boolean;
  logToEdit?: CodeforcesLog | null;
  onClose: () => void;
  onSave: (log: Omit<CodeforcesLog, "id"> | CodeforcesLog) => void;
  isTriggeredByMission?: boolean;
}

const COMMON_TAGS = [
  "math",
  "greedy",
  "dp",
  "brute force",
  "binary search",
  "graphs",
  "dfs and similar",
  "two pointers",
  "data structures",
  "strings",
  "number theory",
  "constructive algorithms",
];

export const CodeforcesLogModal: React.FC<CodeforcesLogModalProps> = ({
  isOpen,
  logToEdit,
  onClose,
  onSave,
  isTriggeredByMission = false,
}) => {
  const [problemName, setProblemName] = useState("");
  const [problemUrl, setProblemUrl] = useState("");
  const [rating, setRating] = useState<number | undefined>(1000);
  const [status, setStatus] = useState<"solved" | "tried" | "upsolve">("solved");
  const [tags, setTags] = useState<string[]>(["math"]);
  const [tagInput, setTagInput] = useState("");
  const [timeTaken, setTimeTaken] = useState<number>(35);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (logToEdit) {
      setProblemName(logToEdit.problem_name || "");
      setProblemUrl(logToEdit.problem_url || "");
      setRating(logToEdit.rating || 1000);
      setStatus(logToEdit.status || "solved");
      setTags(logToEdit.tags || []);
      setTimeTaken(logToEdit.time_taken_minutes || 35);
      setDate(logToEdit.date || new Date().toISOString().split("T")[0]);
      setNotes(logToEdit.notes || "");
    } else {
      setProblemName("");
      setProblemUrl("");
      setRating(1000);
      setStatus("solved");
      setTags(["math"]);
      setTimeTaken(35);
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
    setError("");
  }, [logToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase();
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemName.trim()) {
      setError("Please specify the problem name or code");
      return;
    }

    const xpEarned =
      status === "solved" ? (rating ? Math.max(30, Math.round(rating / 25)) : 40) : 15;

    const payload = {
      problem_name: problemName.trim(),
      problem_url: problemUrl.trim() || undefined,
      rating: rating ? Number(rating) : undefined,
      status,
      tags,
      time_taken_minutes: Number(timeTaken) || 30,
      date,
      notes: notes.trim() || undefined,
      xp: xpEarned,
      solved_at: status === "solved" ? new Date().toISOString() : undefined,
    };

    if (logToEdit) {
      onSave({
        ...logToEdit,
        ...payload,
      });
    } else {
      onSave(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-spy-surface border border-spy-border rounded-[6px] p-5 sm:p-6 text-spy-text shadow-2xl font-sans max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-spy-amber" />
            <h3 className="text-sm font-semibold text-spy-text font-mono">
              {isTriggeredByMission
                ? "MISSION DEBRIEF: CODEFORCES SOLVE"
                : logToEdit
                ? "EDIT CODEFORCES ENTRY"
                : "LOG CODEFORCES PROBLEM"}
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

        {isTriggeredByMission && (
          <div className="mb-4 p-2.5 rounded-[4px] bg-[#fbefd5] text-[#9a5b00] border border-[#f4dcaa] dark:bg-spy-amber/15 dark:text-spy-amber dark:border-spy-amber/30 text-xs font-mono">
            🎯 Daily CP Mission accomplished! Quick-log the problem details below (or dismiss).
          </div>
        )}

        {error && (
          <div className="mb-4 p-2.5 rounded-[4px] bg-spy-redMuted border border-spy-red/30 text-xs text-spy-red font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Problem Name & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Problem Name / ID
              </label>
              <input
                type="text"
                placeholder="e.g. Watermelon (4A) or 1850E"
                value={problemName}
                onChange={(e) => setProblemName(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Difficulty Rating
              </label>
              <input
                type="number"
                step="100"
                min="800"
                max="3500"
                placeholder="1200"
                value={rating || ""}
                onChange={(e) => setRating(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
              />
            </div>
          </div>

          {/* URL & Time Taken */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Problem Link
              </label>
              <input
                type="url"
                placeholder="https://codeforces.com/problemset/problem/..."
                value={problemUrl}
                onChange={(e) => setProblemUrl(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Time (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={timeTaken}
                onChange={(e) => setTimeTaken(parseInt(e.target.value) || 30)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
              />
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1.5">
              Solve Verdict / Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { status: "solved", label: "Solved (AC)", desc: "+XP Awarded" },
                { status: "upsolve", label: "Upsolved", desc: "After Editorial" },
                { status: "tried", label: "Attempted", desc: "Needs Work" },
              ].map((item) => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => setStatus(item.status as "solved" | "upsolve" | "tried")}
                  className={`py-2 px-2.5 rounded-[4px] border text-xs font-mono flex flex-col items-center justify-center transition-all ${
                    status === item.status
                      ? item.status === "solved"
                        ? "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-[#0f2417] dark:text-[#4ade80] dark:border-[#163d24] font-bold shadow-none"
                        : item.status === "upsolve"
                        ? "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-[#0f1a2e] dark:text-[#60a5fa] dark:border-[#1b3152] font-bold shadow-none"
                        : "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-[#261a0d] dark:text-[#fbbf24] dark:border-[#422d14] font-bold shadow-none"
                      : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-75 font-normal">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1.5 flex items-center justify-between">
              <span>Algorithmic Tags</span>
              <span className="text-[10px] text-spy-dim">Select or press Enter to add</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto no-scrollbar p-1 rounded-[3px] bg-spy-surface2 border border-spy-border">
              {COMMON_TAGS.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] font-mono transition-colors ${
                      isSelected
                        ? "bg-[#fbf3cc] text-[#8a6a00] border-[#f5e499] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green font-bold"
                        : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Add other tag (type and hit Enter)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-2.5 py-1 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
            />
          </div>

          {/* Tactical Notes / Insights */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              Key Insight / Algorithm Note
            </label>
            <textarea
              rows={3}
              placeholder="What observation made the answer click? e.g. Notice parity: sum is even if and only if..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] p-2.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-spy-border">
            <span className="text-xs font-mono text-spy-amber font-bold">
              +{status === "solved" ? (rating ? Math.max(30, Math.round(rating / 25)) : 40) : 15} XP
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="stealth" size="sm" onClick={onClose}>
                {isTriggeredByMission ? "Skip Log" : "Cancel"}
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {logToEdit ? "Update Entry" : "Save Problem"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
