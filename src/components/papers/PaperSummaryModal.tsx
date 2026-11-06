"use client";

import React, { useState, useEffect } from "react";
import { X, BookMarked } from "lucide-react";
import { ResearchPaper } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface PaperSummaryModalProps {
  isOpen: boolean;
  paperToEdit?: ResearchPaper | null;
  onClose: () => void;
  onSave: (paper: Omit<ResearchPaper, "id"> | ResearchPaper) => void;
  isTriggeredByMission?: boolean;
}

export const PaperSummaryModal: React.FC<PaperSummaryModalProps> = ({
  isOpen,
  paperToEdit,
  onClose,
  onSave,
  isTriggeredByMission = false,
}) => {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [venue, setVenue] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"to-read" | "reading" | "done">("done");
  const [tags, setTags] = useState<string[]>(["Deep Learning"]);
  const [tagInput, setTagInput] = useState("");
  const [summary, setSummary] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [dateRead, setDateRead] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (paperToEdit) {
      setTitle(paperToEdit.title || "");
      setAuthors(paperToEdit.authors || "");
      setVenue(paperToEdit.venue || "");
      setUrl(paperToEdit.url || "");
      setStatus(paperToEdit.status || "done");
      setTags(paperToEdit.tags || []);
      setSummary(paperToEdit.summary || "");
      setTakeaway(paperToEdit.takeaway || "");
      setDateRead(paperToEdit.date_read || new Date().toISOString().split("T")[0]);
    } else {
      setTitle("");
      setAuthors("");
      setVenue("");
      setUrl("");
      setStatus(isTriggeredByMission ? "done" : "to-read");
      setTags(["Systems"]);
      setSummary("");
      setTakeaway("");
      setDateRead(new Date().toISOString().split("T")[0]);
    }
    setError("");
  }, [paperToEdit, isOpen, isTriggeredByMission]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim();
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please specify the paper title");
      return;
    }

    const payload = {
      title: title.trim(),
      authors: authors.trim() || undefined,
      venue: venue.trim() || undefined,
      url: url.trim() || undefined,
      status,
      tags,
      summary: summary.trim() || undefined,
      takeaway: takeaway.trim() || undefined,
      date_read: status === "done" ? dateRead : null,
    };

    if (paperToEdit) {
      onSave({
        ...paperToEdit,
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
            <BookMarked className="w-4 h-4 text-spy-green" />
            <h3 className="text-sm font-semibold text-spy-text font-mono">
              {isTriggeredByMission
                ? "MISSION DEBRIEF: RESEARCH PAPER READ"
                : paperToEdit
                ? "EDIT RESEARCH PAPER"
                : "ADD RESEARCH PAPER"}
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
          <div className="mb-4 p-2.5 rounded-[4px] bg-[#dcf3e4] text-[#14663a] border border-[#b9e7c8] dark:bg-spy-green/15 dark:text-spy-green dark:border-spy-green/30 text-xs font-mono">
            📄 Weekly Paper Mission completed! Record your 3-line synthesis and key takeaway below.
          </div>
        )}

        {error && (
          <div className="mb-4 p-2.5 rounded-[4px] bg-spy-redMuted border border-spy-red/30 text-xs text-spy-red font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              Paper Title
            </label>
            <input
              type="text"
              placeholder="e.g. FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-medium"
              required
            />
          </div>

          {/* Authors & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Authors
              </label>
              <input
                type="text"
                placeholder="e.g. Tri Dao, Daniel Y. Fu, et al."
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Venue & Year
              </label>
              <input
                type="text"
                placeholder="e.g. NeurIPS 2022"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
              />
            </div>
          </div>

          {/* URL & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-spy-muted mb-1">
                ArXiv / PDF Link
              </label>
              <input
                type="url"
                placeholder="https://arxiv.org/abs/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Reading Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "to-read" | "reading" | "done")}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-2.5 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
              >
                <option value="to-read">To Read</option>
                <option value="reading">Reading</option>
                <option value="done">Completed (Done)</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1 flex items-center justify-between">
              <span>Tags / Domain</span>
              <span className="text-[10px] text-spy-dim">Type and hit Enter to add</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-[3px] text-xs font-mono bg-spy-surface2 border border-spy-border text-spy-text flex items-center gap-1"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-spy-red font-bold"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="e.g. Attention, GPU Architecture, Paging..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-2.5 py-1 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
            />
          </div>

          {/* 3-Line Summary */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              3-Line Executive Summary
            </label>
            <textarea
              rows={3}
              placeholder="1. Problem: Standard attention is bottlenecked by HBM IO reads/writes.&#10;2. Idea: Tiling softmax computation to compute attention in fast SRAM cache.&#10;3. Result: 2-4x wallclock speedup without approximating attention."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] p-2.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-sans"
            />
          </div>

          {/* Key Takeaway */}
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              Key Architectural Takeaway
            </label>
            <textarea
              rows={2}
              placeholder="What single insight is most impactful for my system or future research?"
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] p-2.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-sans"
            />
          </div>

          {/* Date read if completed */}
          {status === "done" && (
            <div>
              <label className="block text-xs font-mono text-spy-muted mb-1">
                Date Completed
              </label>
              <input
                type="date"
                value={dateRead}
                onChange={(e) => setDateRead(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-spy-border">
            <Button type="button" variant="stealth" size="sm" onClick={onClose}>
              {isTriggeredByMission ? "Skip Summary" : "Cancel"}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {paperToEdit ? "Save Changes" : "Record Paper"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
