"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  BookMarked,
  ExternalLink,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Quote,
  Calendar,
} from "lucide-react";
import { ResearchPaper } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { PaperSummaryModal } from "./PaperSummaryModal";

interface ResearchPapersViewProps {
  papers: ResearchPaper[];
  onAddPaper: (paper: Omit<ResearchPaper, "id">) => void;
  onUpdatePaper: (paper: ResearchPaper) => void;
  onDeletePaper: (id: string) => void;
}

export const ResearchPapersView: React.FC<ResearchPapersViewProps> = ({
  papers,
  onAddPaper,
  onUpdatePaper,
  onDeletePaper,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "reading" | "to-read" | "done">("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ResearchPaper | null>(null);
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  // Statistics
  const doneCount = useMemo(() => papers.filter((p) => p.status === "done").length, [papers]);
  const readingCount = useMemo(() => papers.filter((p) => p.status === "reading").length, [papers]);
  const toReadCount = useMemo(() => papers.filter((p) => p.status === "to-read").length, [papers]);

  // Current active paper
  const currentReadingPaper = useMemo(() => {
    return papers.find((p) => p.status === "reading") || null;
  }, [papers]);

  // Tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    papers.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [papers]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (selectedTag !== "all" && !(p.tags || []).includes(selectedTag)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchAuthors = (p.authors || "").toLowerCase().includes(q);
          const matchVenue = (p.venue || "").toLowerCase().includes(q);
          const matchSummary = (p.summary || "").toLowerCase().includes(q);
          const matchTakeaway = (p.takeaway || "").toLowerCase().includes(q);
          const matchTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchAuthors && !matchVenue && !matchSummary && !matchTakeaway && !matchTags) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Reading papers first, then done by date read, then to-read
        if (a.status === "reading" && b.status !== "reading") return -1;
        if (b.status === "reading" && a.status !== "reading") return 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [papers, statusFilter, selectedTag, searchQuery]);

  const handleToggleExpand = (id: string) => {
    setExpandedPaperId(expandedPaperId === id ? null : id);
  };

  const handleQuickStatusChange = (paper: ResearchPaper, newStatus: "to-read" | "reading" | "done") => {
    onUpdatePaper({
      ...paper,
      status: newStatus,
      date_read: newStatus === "done" ? new Date().toISOString().split("T")[0] : paper.date_read,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Library */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#eef6f0] border-[#cde5d4] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#14663a] dark:text-spy-muted">
              Total Catalog
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#14663a] dark:text-spy-green">
              {papers.length} {papers.length === 1 ? "paper" : "papers"}
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#dcf3e4] border border-[#b9e7c8] text-[#14663a] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green">
            <BookMarked className="w-5 h-5" />
          </div>
        </div>

        {/* Read / Completed */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#dff3f1] border-[#bfe8e3] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#0f6b66] dark:text-spy-muted">
              Mastered (Done)
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#0f6b66] dark:text-teal-400">
              {doneCount} read
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#ccefe9] border border-[#9fdcd1] text-[#0f6b66] dark:bg-spy-surface2 dark:border-spy-border dark:text-teal-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Currently Reading */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#fbefd5] border-[#f4dcaa] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9a5b00] dark:text-spy-muted">
              In Progress
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#9a5b00] dark:text-spy-amber">
              {readingCount} reading
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#f8e3ba] border border-[#f1cd85] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* To Read Backlog */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#e4eefc] border-[#c6ddf9] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#1d4f9f] dark:text-spy-muted">
              To-Read Queue
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#1d4f9f] dark:text-blue-400">
              {toReadCount} in queue
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#d6e7fa] border border-[#b8d6f7] text-[#1d4f9f] dark:bg-spy-surface2 dark:border-spy-border dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. CURRENT ACTIVE PAPER SPOTLIGHT */}
      {currentReadingPaper && (
        <div className="clean-card p-4 sm:p-5 border-l-[4px] border-l-[#b7791f] bg-gradient-to-r from-[#fefbf6] to-[#fffdf8] dark:from-transparent dark:to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.2 rounded-[2px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                  Active Reading Objective
                </span>
                {currentReadingPaper.venue && (
                  <span className="text-[11px] font-mono text-spy-dim">
                    {currentReadingPaper.venue}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-spy-text truncate">
                {currentReadingPaper.title}
              </h3>
              {currentReadingPaper.authors && (
                <div className="text-xs text-spy-muted font-sans">
                  {currentReadingPaper.authors}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentReadingPaper.url && (
                <a
                  href={currentReadingPaper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-[3px] border border-spy-border hover:border-spy-green text-xs font-mono flex items-center gap-1.5 text-spy-text hover:text-spy-green transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF</span>
                </a>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingPaper(currentReadingPaper);
                  setIsModalOpen(true);
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Read & Summarize</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SEARCH & STATUS FILTERS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-spy-dim" />
              <input
                type="text"
                placeholder="Search paper title, authors, tags, takeaways..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] pl-8 pr-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green"
              />
            </div>
            <div className="flex items-center border border-spy-border rounded-[3px] overflow-hidden text-xs font-mono bg-spy-surface2 shrink-0">
              {(["all", "reading", "to-read", "done"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                    statusFilter === st
                      ? "bg-spy-surface text-spy-text font-bold border-b-2 border-spy-green"
                      : "text-spy-muted hover:text-spy-text"
                  }`}
                >
                  {st === "all" ? "All" : st === "reading" ? "Reading" : st === "to-read" ? "To Read" : "Done"}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingPaper(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Paper</span>
          </Button>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            <button
              onClick={() => setSelectedTag("all")}
              className={`px-2 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors ${
                selectedTag === "all"
                  ? "bg-spy-green text-black font-bold"
                  : "bg-spy-surface2 border border-spy-border text-spy-muted hover:text-spy-text"
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? "all" : tag)}
                className={`px-2 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors ${
                  selectedTag === tag
                    ? "bg-[#14663a] text-white dark:bg-spy-green dark:text-black font-bold"
                    : "bg-spy-surface2 border border-spy-border text-spy-muted hover:text-spy-text"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* 4. PAPERS LIST */}
        {filteredPapers.length === 0 ? (
          <div className="clean-card p-8 text-center font-mono text-xs text-spy-muted space-y-2">
            <BookMarked className="w-8 h-8 text-spy-dim mx-auto" />
            <p>No research papers found matching criteria.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPaper(null);
                setIsModalOpen(true);
              }}
            >
              + Catalog Your First Paper
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPapers.map((paper) => {
              const isExpanded = expandedPaperId === paper.id;

              return (
                <div
                  key={paper.id}
                  className={`clean-card p-4 transition-all border-l-[3px] ${
                    paper.status === "done"
                      ? "border-l-spy-green"
                      : paper.status === "reading"
                      ? "border-l-spy-amber"
                      : "border-l-blue-500"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1 flex-1">
                      {/* Meta badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.2 rounded-[2px] border font-bold ${
                            paper.status === "done"
                              ? "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green"
                              : paper.status === "reading"
                              ? "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber"
                              : "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                          }`}
                        >
                          {paper.status === "done" ? "Done (Read)" : paper.status === "reading" ? "Reading" : "To Read"}
                        </span>

                        {paper.venue && (
                          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-[2px] bg-spy-surface2 border border-spy-border text-spy-dim">
                            {paper.venue}
                          </span>
                        )}

                        {paper.date_read && (
                          <span className="text-[11px] font-mono text-spy-dim flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Read {paper.date_read}</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Link */}
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-spy-text">
                          {paper.title}
                        </h4>
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-spy-dim hover:text-spy-green p-0.5 shrink-0"
                            title="Open paper link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {paper.authors && (
                        <div className="text-xs text-spy-muted font-sans">
                          {paper.authors}
                        </div>
                      )}

                      {/* Tags */}
                      {paper.tags && paper.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {paper.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-spy-surface2 border border-spy-border text-spy-dim"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center sm:flex-col items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-spy-border">
                      {/* Status toggle buttons */}
                      <div className="flex items-center border border-spy-border rounded-[3px] overflow-hidden text-[10px] font-mono bg-spy-surface2">
                        {(["to-read", "reading", "done"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleQuickStatusChange(paper, s)}
                            className={`px-1.5 py-0.5 uppercase transition-colors ${
                              paper.status === s
                                ? "bg-spy-surface text-spy-text font-bold"
                                : "text-spy-muted hover:text-spy-text"
                            }`}
                            title={`Set status to ${s}`}
                          >
                            {s === "done" ? "Done" : s === "reading" ? "Read" : "Wait"}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingPaper(paper);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-spy-muted hover:text-spy-text rounded-[2px] border border-spy-border bg-spy-surface2"
                          title="Edit summary & takeaways"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePaper(paper.id)}
                          className="p-1 text-spy-muted hover:text-spy-red rounded-[2px] border border-spy-border bg-spy-surface2"
                          title="Delete paper"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {(paper.summary || paper.takeaway) && (
                          <button
                            onClick={() => handleToggleExpand(paper.id)}
                            className="p-1 text-spy-muted hover:text-spy-text rounded-[2px] border border-spy-border bg-spy-surface2"
                            title={isExpanded ? "Collapse notes" : "Expand notes"}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable 3-Line Summary & Key Takeaway */}
                  {(isExpanded || (!paper.summary && !paper.takeaway ? false : paper.status === "done")) && (
                    <div className="mt-3 pt-3 border-t border-spy-border space-y-2 text-xs">
                      {paper.summary && (
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] text-spy-dim uppercase tracking-wider block">
                            3-Line Synthesis
                          </span>
                          <p className="font-sans text-spy-text leading-relaxed bg-spy-surface2 border border-spy-border p-2.5 rounded-[3px] whitespace-pre-wrap">
                            {paper.summary}
                          </p>
                        </div>
                      )}

                      {paper.takeaway && (
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] text-spy-green uppercase tracking-wider flex items-center gap-1 font-bold">
                            <Quote className="w-3 h-3" />
                            <span>Key Architectural Takeaway</span>
                          </span>
                          <p className="font-sans text-spy-text font-medium bg-[#eef7f1] border border-[#cde5d4] dark:bg-spy-green/10 dark:border-spy-green/30 p-2.5 rounded-[3px] italic">
                            &quot;{paper.takeaway}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <PaperSummaryModal
        isOpen={isModalOpen}
        paperToEdit={editingPaper}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPaper(null);
        }}
        onSave={(data) => {
          if ("id" in data) {
            onUpdatePaper(data as ResearchPaper);
          } else {
            onAddPaper(data);
          }
        }}
      />
    </div>
  );
};
