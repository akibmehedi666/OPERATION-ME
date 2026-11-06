"use client";

import React, { useState, useMemo } from "react";
import {
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Terminal,
  Lock,
  Globe,
  Binary,
  Flag,
  Wrench,
  Search,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ShieldAlert,
  X,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import { CyberTopic, CyberTopicStatus } from "@/types/database";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

interface CyberRoadmapViewProps {
  topics: CyberTopic[];
  onUpdateTopicStatus: (
    id: string,
    status: CyberTopicStatus,
    notes?: string,
    timeSpentMinutes?: number,
    takeaway?: string,
    handsOnCompleted?: boolean
  ) => void;
  onAddTopic?: (topic: Omit<CyberTopic, "id">) => void;
}

export const SECTIONS = [
  {
    name: "Foundations (Linux, Networking, Python/Bash scripting)",
    shortName: "Foundations",
    aliases: ["foundations", "networking basics", "linux security", "networking"],
    icon: <Terminal className="w-4 h-4 text-emerald-500" />,
    badge: "Core Prerequisite",
  },
  {
    name: "Cryptography basics",
    shortName: "Cryptography",
    aliases: ["cryptography basics", "cryptography", "crypto"],
    icon: <Lock className="w-4 h-4 text-amber-500" />,
    badge: "Essential Math & Ciphers",
  },
  {
    name: "Web Security & OWASP Top 10",
    shortName: "Web Security",
    aliases: ["web security & owasp top 10", "web security / owasp", "web security", "owasp"],
    icon: <Globe className="w-4 h-4 text-teal-400" />,
    badge: "OWASP Top 10",
  },
  {
    name: "Tools (Nmap, Burp Suite, Wireshark, Metasploit)",
    shortName: "Tools",
    aliases: ["tools (nmap, burp suite, wireshark, metasploit)", "tools & recon", "tools"],
    icon: <Wrench className="w-4 h-4 text-blue-400" />,
    badge: "Industry Tooling",
  },
  {
    name: "CTF Practice (ongoing, unlockable from the start)",
    shortName: "CTF Practice",
    aliases: ["ctf practice (ongoing, unlockable from the start)", "ctf practice", "ctf"],
    icon: <Flag className="w-4 h-4 text-orange-500" />,
    badge: "Unlocked From Start · Ongoing",
    isOngoing: true,
  },
  {
    name: "Advanced (Reverse Engineering, Binary Exploitation, Privilege Escalation)",
    shortName: "Advanced",
    aliases: ["advanced (reverse engineering, binary exploitation, privilege escalation)", "reverse engineering", "advanced"],
    icon: <Binary className="w-4 h-4 text-purple-400" />,
    badge: "Deep Exploitation",
  },
];

export const CyberRoadmapView: React.FC<CyberRoadmapViewProps> = ({
  topics,
  onUpdateTopicStatus,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Foundations (Linux, Networking, Python/Bash scripting)": true,
    "Cryptography basics": true,
    "Web Security & OWASP Top 10": true,
    "Tools (Nmap, Burp Suite, Wireshark, Metasploit)": true,
    "CTF Practice (ongoing, unlockable from the start)": true,
    "Advanced (Reverse Engineering, Binary Exploitation, Privilege Escalation)": false,
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Inline Note Editor state
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTime, setEditTime] = useState<number>(0);

  // Completion Modal State (Required Hands-On + One-Line Takeaway)
  const [completionTopic, setCompletionTopic] = useState<CyberTopic | null>(null);
  const [completionHandsOnDone, setCompletionHandsOnDone] = useState(false);
  const [completionTakeaway, setCompletionTakeaway] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionTimeMinutes, setCompletionTimeMinutes] = useState<number>(45);

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Progress metrics
  const doneCount = useMemo(() => topics.filter((t) => t.status === "done").length, [topics]);
  const learningCount = useMemo(() => topics.filter((t) => t.status === "learning").length, [topics]);
  const totalCount = topics.length;
  const overallPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const totalTimeSpentMinutes = useMemo(() => {
    return topics.reduce((acc, t) => acc + (t.time_spent_minutes || 0), 0);
  }, [topics]);

  // Next suggested topic
  const nextSuggestedTopic = useMemo(() => {
    return (
      topics.find((t) => t.status === "learning") ||
      topics.find((t) => t.status === "not_started") ||
      null
    );
  }, [topics]);

  const handleStartEdit = (topic: CyberTopic) => {
    setEditingTopicId(topic.id);
    setEditNotes(topic.notes || "");
    setEditTime(topic.time_spent_minutes || 0);
  };

  const handleSaveEdit = (topic: CyberTopic) => {
    onUpdateTopicStatus(
      topic.id,
      topic.status,
      editNotes,
      editTime,
      topic.takeaway,
      topic.hands_on_completed
    );
    setEditingTopicId(null);
  };

  // Status Change Flow: Marking as "done" requires Hands-on task & One-line takeaway
  const handleStatusChange = (topic: CyberTopic, newStatus: CyberTopicStatus) => {
    if (newStatus === "done") {
      if (topic.hands_on_completed && topic.takeaway && topic.takeaway.trim().length > 0) {
        // Already satisfied requirements, mark done directly
        onUpdateTopicStatus(
          topic.id,
          "done",
          topic.notes,
          topic.time_spent_minutes,
          topic.takeaway,
          true
        );
      } else {
        // Open completion modal to log hands-on task & takeaway
        setCompletionTopic(topic);
        setCompletionHandsOnDone(!!topic.hands_on_completed);
        setCompletionTakeaway(topic.takeaway || "");
        setCompletionNotes(topic.notes || "");
        setCompletionTimeMinutes(topic.time_spent_minutes || 45);
      }
    } else {
      // Transition to "not_started" or "learning"
      onUpdateTopicStatus(
        topic.id,
        newStatus,
        topic.notes,
        topic.time_spent_minutes,
        topic.takeaway,
        topic.hands_on_completed
      );
    }
  };

  const handleConfirmCompletion = () => {
    if (!completionTopic) return;
    if (!completionHandsOnDone || !completionTakeaway.trim()) return;

    onUpdateTopicStatus(
      completionTopic.id,
      "done",
      completionNotes.trim() ? completionNotes : completionTopic.notes,
      completionTimeMinutes,
      completionTakeaway.trim(),
      true
    );
    setCompletionTopic(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. ROADMAP OVERALL PROGRESS HEADER */}
      <div className="clean-card p-5 sm:p-6 border-l-[4px] border-l-[#14663a] dark:border-l-spy-green">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#14663a] dark:text-spy-green" />
              <h2 className="text-lg sm:text-xl font-bold font-mono text-spy-text tracking-tight">
                CYBERSECURITY TACTICAL ROADMAP
              </h2>
            </div>
            <p className="text-xs text-spy-muted font-sans max-w-xl">
              Rigorous hands-on offensive & defensive security curriculum. Every topic mandates practical lab exploitation (TryHackMe, PortSwigger, OverTheWire, picoCTF) and a recorded technical takeaway.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 font-mono text-right">
            <div>
              <div className="text-[10px] text-spy-dim uppercase tracking-wider">Total Time</div>
              <div className="text-sm font-bold text-spy-text">
                {Math.floor(totalTimeSpentMinutes / 60)}h {totalTimeSpentMinutes % 60}m
              </div>
            </div>
            <div className="h-8 w-px bg-spy-border" />
            <div>
              <div className="text-[10px] text-spy-dim uppercase tracking-wider">Mastered</div>
              <div className="text-sm font-bold text-spy-green">
                {doneCount} / {totalCount} ({overallPct}%)
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <ProgressBar
          value={overallPct}
          variant="green"
          size="md"
          label={
            <span className="flex items-center gap-1.5 font-mono text-xs text-spy-text font-bold">
              <span>Overall Roadmap Mastery</span>
              <span className="text-spy-green">({overallPct}%)</span>
            </span>
          }
          sublabel={
            <span className="text-xs font-mono text-spy-muted">
              {doneCount} done &middot; {learningCount} in progress &middot; {totalCount - doneCount - learningCount} remaining
            </span>
          }
        />
      </div>

      {/* 2. LEGAL PRACTICE ONLY BANNER */}
      <div className="flex items-start sm:items-center gap-2.5 p-3 rounded-[4px] bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-300 text-xs">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
        <div className="font-sans leading-relaxed">
          <strong className="font-mono uppercase tracking-wider text-[11px] text-amber-700 dark:text-amber-400 mr-1.5">
            Legal practice only:
          </strong>
          All attack techniques, port scans, and exploitation labs must be executed exclusively against authorized targets, sandboxes, and dedicated challenge platforms (TryHackMe, PortSwigger Web Security Academy, OverTheWire, picoCTF, CryptoHack). Unauthorized scanning or unauthorized testing against public or private third-party systems is illegal.
        </div>
      </div>

      {/* 3. NEXT RECOMMENDED OBJECTIVE BANNER */}
      {nextSuggestedTopic && (
        <div className="clean-card p-4 bg-[#eef7f1] border-[#cde5d4] dark:bg-spy-surface dark:border-spy-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2 rounded-[4px] bg-[#dcf3e4] border border-[#b9e7c8] text-[#14663a] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="w-4 h-4 text-spy-amber" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#14663a] dark:text-spy-green font-bold">
                Next Recommended Objective &middot; {nextSuggestedTopic.section}
              </div>
              <div className="text-sm font-semibold text-spy-text truncate">
                {nextSuggestedTopic.title}
              </div>
              {nextSuggestedTopic.hands_on_task && (
                <div className="text-xs text-spy-muted flex items-center gap-1.5 flex-wrap">
                  <FlaskConical className="w-3.5 h-3.5 text-spy-dim shrink-0" />
                  <span className="truncate max-w-md">Lab: {nextSuggestedTopic.hands_on_task}</span>
                  {nextSuggestedTopic.hands_on_url && (
                    <a
                      href={nextSuggestedTopic.hands_on_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[#14663a] dark:text-spy-green hover:underline font-mono text-[11px]"
                    >
                      <span>Open Lab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {nextSuggestedTopic.status !== "learning" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(nextSuggestedTopic, "learning")}
              >
                Mark In Progress
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(nextSuggestedTopic, "done")}
            >
              Mark Mastered (Done)
            </Button>
          </div>
        </div>
      )}

      {/* 4. SEARCH FILTER */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-spy-dim" />
        <input
          type="text"
          placeholder="Filter topics by keyword, tool, lab, or section (e.g. Nmap, XSS, Bandit, Wireshark)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-spy-surface border border-spy-border rounded-[4px] pl-9 pr-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green"
        />
      </div>

      {/* 5. SECTIONS LIST */}
      <div className="space-y-4">
        {SECTIONS.map((sec) => {
          const sectionTopics = topics.filter((t) => {
            const topicSec = (t.section || "").toLowerCase().trim();
            const matchesSection =
              topicSec === sec.name.toLowerCase().trim() ||
              sec.aliases.some((alias) => topicSec.includes(alias));

            if (!matchesSection) return false;

            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              return (
                t.title.toLowerCase().includes(q) ||
                (t.goal || "").toLowerCase().includes(q) ||
                (t.hands_on_task || "").toLowerCase().includes(q) ||
                (t.notes || "").toLowerCase().includes(q) ||
                (t.takeaway || "").toLowerCase().includes(q)
              );
            }
            return true;
          });

          if (sectionTopics.length === 0 && searchQuery.trim()) return null;

          const secDone = sectionTopics.filter((t) => t.status === "done").length;
          const secTotal = sectionTopics.length;
          const secPct = secTotal > 0 ? Math.round((secDone / secTotal) * 100) : 0;
          const isExpanded = searchQuery.trim() ? true : !!expandedSections[sec.name];

          return (
            <div key={sec.name} className="clean-card overflow-hidden">
              {/* Section Header Accordion Toggle */}
              <button
                type="button"
                onClick={() => toggleSection(sec.name)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left bg-spy-surface2/60 hover:bg-spy-surface2 transition-colors border-b border-spy-border"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-[3px] bg-spy-surface border border-spy-border shrink-0">
                    {sec.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs sm:text-sm text-spy-text block truncate">
                        {sec.name}
                      </span>
                      {/* Secondary badge for compatibility with legacy queries and visual clarity */}
                      {sec.name.includes("Foundations") && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Networking Basics
                        </span>
                      )}
                      {sec.isOngoing && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold animate-pulse">
                          Unlockable From Start
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-spy-dim">
                      {secDone} / {secTotal} topics mastered ({secPct}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 w-full bg-spy-surface rounded-full overflow-hidden border border-spy-border">
                      <div
                        className="h-full bg-spy-green transition-all duration-300"
                        style={{ width: `${secPct}%` }}
                      />
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-spy-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-spy-muted" />
                  )}
                </div>
              </button>

              {/* Topics in Section */}
              {isExpanded && (
                <div className="divide-y divide-spy-border">
                  {sectionTopics.map((topic) => {
                    const isEditing = editingTopicId === topic.id;

                    return (
                      <div
                        key={topic.id}
                        className="p-3.5 sm:p-4 space-y-3 hover:bg-spy-surface2/40 transition-colors"
                      >
                        {/* Topic Header: Title, Order, Time, and Status Pills */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-spy-text">
                                {topic.title}
                              </span>
                              {topic.time_spent_minutes ? (
                                <span className="text-[10px] font-mono text-spy-dim flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{topic.time_spent_minutes}m</span>
                                </span>
                              ) : null}
                              {topic.hands_on_completed && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Lab Completed
                                </span>
                              )}
                            </div>

                            {/* Short Goal */}
                            {topic.goal && (
                              <p className="text-xs text-spy-muted font-sans leading-relaxed">
                                <span className="font-mono text-spy-dim font-bold text-[11px] uppercase mr-1">
                                  Goal:
                                </span>
                                {topic.goal}
                              </p>
                            )}
                          </div>

                          {/* Status Pill Switcher */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(["not_started", "learning", "done"] as CyberTopicStatus[]).map((st) => {
                              const isActive = topic.status === st;
                              const label =
                                st === "done" ? "Done" : st === "learning" ? "Learning" : "Not Started";
                              return (
                                <button
                                  key={st}
                                  onClick={() => handleStatusChange(topic, st)}
                                  className={`px-2.5 py-1 rounded-[3px] border text-[11px] font-mono transition-all ${isActive
                                      ? st === "done"
                                        ? "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green font-bold shadow-sm"
                                        : st === "learning"
                                          ? "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber font-bold shadow-sm"
                                          : "bg-spy-surface border-spy-border text-spy-text font-bold"
                                      : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
                                    }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Learning Links & Required Hands-On Lab Task Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                          {/* 1. Learning Links */}
                          <div className="p-2.5 rounded-[4px] bg-spy-surface border border-spy-border space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-spy-dim font-bold">
                              <BookOpen className="w-3 h-3 text-spy-green" />
                              <span>Learning Links</span>
                            </div>
                            {topic.learning_links && topic.learning_links.length > 0 ? (
                              <div className="space-y-1">
                                {topic.learning_links.map((link, idx) => (
                                  <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-spy-surface2 text-xs text-spy-text group transition-colors"
                                  >
                                    <span className="truncate group-hover:text-spy-green transition-colors">
                                      {link.title}
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-spy-dim group-hover:text-spy-green shrink-0" />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-spy-dim italic">
                                Standard syllabus documentation and official guides.
                              </div>
                            )}
                          </div>

                          {/* 2. Required Hands-On Task Box */}
                          <div
                            className={`p-2.5 rounded-[4px] border space-y-1.5 transition-colors ${topic.hands_on_completed
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-spy-surface border-spy-border"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-spy-dim font-bold">
                                <FlaskConical className="w-3 h-3 text-spy-amber" />
                                <span>Required Hands-On Lab</span>
                              </div>
                              {topic.hands_on_platform && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-spy-surface2 border border-spy-border text-spy-dim">
                                  {topic.hands_on_platform}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-spy-text font-sans">
                              {topic.hands_on_task || "Complete practical lab simulation."}
                            </p>

                            {topic.hands_on_url && (
                              <div className="pt-1 flex items-center justify-between">
                                <a
                                  href={topic.hands_on_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#14663a] dark:text-spy-green hover:underline font-semibold"
                                >
                                  <span>Launch Lab Platform</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>

                                <span className="text-[10px] font-mono text-spy-dim">
                                  {topic.hands_on_completed ? "✓ Verified Done" : "Mandatory for Done"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Completed Takeaway Display */}
                        {topic.takeaway && (
                          <div className="p-2.5 rounded-[4px] bg-[#eef7f1] border border-[#cde5d4] dark:bg-spy-surface2/60 dark:border-spy-border flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-spy-green shrink-0 mt-0.5" />
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#14663a] dark:text-spy-green font-bold block">
                                Technical Takeaway Logged:
                              </span>
                              <p className="text-xs text-spy-text font-sans italic">
                                &ldquo;{topic.takeaway}&rdquo;
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Inline Notes & Resources Editor */}
                        {isEditing ? (
                          <div className="p-2.5 bg-spy-surface2 border border-spy-border rounded-[4px] space-y-2 mt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono text-spy-dim mb-0.5">
                                  Time Spent (min)
                                </label>
                                <input
                                  type="number"
                                  value={editTime}
                                  onChange={(e) => setEditTime(parseInt(e.target.value) || 0)}
                                  className="w-full bg-spy-surface border border-spy-border rounded-[3px] px-2 py-1 text-xs text-spy-text font-mono"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-spy-dim mb-0.5">
                                Notes & Observations
                              </label>
                              <textarea
                                rows={2}
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="w-full bg-spy-surface border border-spy-border rounded-[3px] p-2 text-xs text-spy-text font-sans"
                                placeholder="Key observations, attack vectors, or defense rules..."
                              />
                            </div>
                            <div className="flex justify-end gap-1.5">
                              <Button variant="stealth" size="sm" onClick={() => setEditingTopicId(null)}>
                                Cancel
                              </Button>
                              <Button variant="primary" size="sm" onClick={() => handleSaveEdit(topic)}>
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-spy-muted pt-1">
                            {topic.notes ? (
                              <p className="font-sans text-[11px] text-spy-dim italic truncate flex-1 pr-2">
                                &quot;{topic.notes}&quot;
                              </p>
                            ) : (
                              <span className="text-[10px] font-mono text-spy-dim">No extra notes</span>
                            )}
                            <button
                              onClick={() => handleStartEdit(topic)}
                              className="text-[11px] font-mono text-spy-dim hover:text-spy-green underline shrink-0"
                            >
                              {topic.notes ? "Edit Notes" : "+ Add Note"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. REQUIRED COMPLETION MODAL */}
      {completionTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-spy-surface border border-spy-border rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-spy-surface2 border-b border-spy-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-spy-green" />
                <h3 className="font-mono text-xs sm:text-sm font-bold text-spy-text uppercase tracking-wider">
                  Log Hands-On Lab & Mark Complete
                </h3>
              </div>
              <button
                onClick={() => setCompletionTopic(null)}
                className="text-spy-dim hover:text-spy-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Topic info */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-spy-dim">
                  {completionTopic.section}
                </span>
                <h4 className="text-sm font-bold text-spy-text font-mono">
                  {completionTopic.title}
                </h4>
                {completionTopic.goal && (
                  <p className="text-xs text-spy-muted font-sans">
                    {completionTopic.goal}
                  </p>
                )}
              </div>

              {/* Hands-On Lab Verification Requirement */}
              <div className="p-3.5 rounded-[4px] bg-spy-surface2 border border-spy-border space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-spy-text">
                  <span className="flex items-center gap-1 text-spy-amber">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Mandatory Lab Task:</span>
                  </span>
                  {completionTopic.hands_on_platform && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-spy-surface border border-spy-border text-spy-dim">
                      {completionTopic.hands_on_platform}
                    </span>
                  )}
                </div>

                <p className="text-xs text-spy-text font-sans">
                  {completionTopic.hands_on_task}
                </p>

                {completionTopic.hands_on_url && (
                  <a
                    href={completionTopic.hands_on_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#14663a] dark:text-spy-green hover:underline font-semibold"
                  >
                    <span>Open Challenge in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <label className="flex items-center gap-2 pt-2 border-t border-spy-border/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={completionHandsOnDone}
                    onChange={(e) => setCompletionHandsOnDone(e.target.checked)}
                    className="w-4 h-4 rounded border-spy-border text-spy-green focus:ring-spy-green"
                  />
                  <span className="text-xs font-mono text-spy-text font-semibold">
                    I have completed this hands-on lab
                  </span>
                </label>
              </div>

              {/* Required Takeaway */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-spy-text">
                  One-Line Takeaway <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={completionTakeaway}
                  onChange={(e) => setCompletionTakeaway(e.target.value)}
                  placeholder="What was the key mechanism, exploit vector, or defense learned?"
                  className="w-full bg-spy-surface border border-spy-border rounded-[4px] p-2.5 text-xs text-spy-text font-sans focus:outline-none focus:border-spy-green"
                />
                <span className="text-[10px] font-mono text-spy-dim block">
                  Required: Write at least one key takeaway before marking this topic as completed.
                </span>
              </div>

              {/* Time spent */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-spy-dim mb-1">
                    Time Spent (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={completionTimeMinutes}
                    onChange={(e) => setCompletionTimeMinutes(parseInt(e.target.value) || 0)}
                    className="w-full bg-spy-surface border border-spy-border rounded-[4px] px-2.5 py-1.5 text-xs text-spy-text font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-spy-surface2 border-t border-spy-border flex items-center justify-end gap-2">
              <Button
                variant="stealth"
                size="sm"
                onClick={() => setCompletionTopic(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!completionHandsOnDone || !completionTakeaway.trim()}
                onClick={handleConfirmCompletion}
              >
                Confirm Completion & Award Mastery
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
