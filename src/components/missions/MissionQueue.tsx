"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ArrowUpDown } from "lucide-react";
import { Mission, Category, Priority } from "@/types/database";
import { MissionCard } from "@/components/ui/MissionCard";
import { getCategoryTheme } from "@/lib/categoryTheme";

interface MissionQueueProps {
  missions: Mission[];
  categories: Category[];
  accomplishingMissionId?: string | null;
  onComplete: (mission: Mission) => void;
  onEdit: (mission: Mission) => void;
  onDelete: (mission: Mission) => void;
  onSetActive: (mission: Mission) => void;
  onEditNote?: (mission: Mission) => void;
}

// Category filter chips requested by user:
// All, OS, DIP, Eco, P&S, FYDP, CP, Cyber, Projects, Research, Tuition
const CATEGORY_CHIPS = [
  { label: "All", key: "all" },
  { label: "OS", key: "os" },
  { label: "DIP", key: "dip" },
  { label: "Eco", key: "eco" },
  { label: "P&S", key: "p&s" },
  { label: "FYDP", key: "fydp" },
  { label: "CP", key: "cp" },
  { label: "Cyber", key: "cyber" },
  { label: "Projects", key: "projects" },
  { label: "Research", key: "research" },
  { label: "Tuition", key: "tuition" },
];

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const MissionQueue: React.FC<MissionQueueProps> = ({
  missions,
  categories,
  accomplishingMissionId,
  onComplete,
  onEdit,
  onDelete,
  onSetActive,
  onEditNote,
}) => {
  const [selectedChip, setSelectedChip] = useState("all");
  const [sortBy, setSortBy] = useState<"deadline" | "priority">("deadline");
  const [searchQuery, setSearchQuery] = useState("");

  // Completed is collapsed by default; others expanded
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    completed: true,
  });

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const now = new Date();

  // Helper to match category chip
  const matchCategoryChip = (m: Mission) => {
    if (selectedChip === "all") return true;
    const cat = categories.find((c) => c.id === m.category_id);
    const catName = (cat?.name || "").toLowerCase();
    const catCode = (cat?.codename || "").toLowerCase();

    switch (selectedChip) {
      case "os":
        return catName.includes("operating") || catName.includes("os") || catCode.includes("os");
      case "dip":
        return catName.includes("image") || catName.includes("dip") || catCode.includes("dip");
      case "eco":
        return catName.includes("econ") || catCode.includes("econ");
      case "p&s":
        return catName.includes("prob") || catName.includes("stat") || catCode.includes("stat");
      case "fydp":
        return catName.includes("fydp") || catCode.includes("fydp");
      case "cp":
        return catName.includes("codeforces") || catName.includes("cp") || catCode.includes("cf");
      case "cyber":
        return catName.includes("cyber") || catCode.includes("cyber");
      case "projects":
        return catName.includes("side") || catName.includes("project");
      case "research":
        return catName.includes("paper") || catName.includes("research");
      case "tuition":
        return catName.includes("tuition");
      default:
        return true;
    }
  };

  // Filter missions
  const filteredMissions = missions.filter((m) => {
    // 1. Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchCodename = m.codename?.toLowerCase().includes(q);
      const matchNotes = m.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchCodename && !matchNotes) return false;
    }

    // 2. Category chip
    return matchCategoryChip(m);
  });

  // Sort helper function
  const sortMissions = (list: Mission[]) => {
    return [...list].sort((a, b) => {
      if (sortBy === "priority") {
        const weightA = PRIORITY_ORDER[a.priority] || 1;
        const weightB = PRIORITY_ORDER[b.priority] || 1;
        if (weightB !== weightA) return weightB - weightA;
      }

      // Deadline sort
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      return 0;
    });
  };

  // Group missions into the requested 6 buckets:
  // Overdue (red) → Today → Tomorrow → This Week → Later → Completed
  const overdueList: Mission[] = [];
  const todayList: Mission[] = [];
  const tomorrowList: Mission[] = [];
  const thisWeekList: Mission[] = [];
  const laterList: Mission[] = [];
  const completedList: Mission[] = [];

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const endOfWeekDate = new Date(now);
  // Days until Sunday or 7 days out
  const daysToSunday = 7 - now.getDay();
  endOfWeekDate.setDate(now.getDate() + daysToSunday);
  endOfWeekDate.setHours(23, 59, 59, 999);

  filteredMissions.forEach((m) => {
    if (m.status === "completed") {
      completedList.push(m);
      return;
    }

    if (!m.deadline) {
      laterList.push(m);
      return;
    }

    const d = new Date(m.deadline);

    if (d < now) {
      overdueList.push(m);
      return;
    }

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      todayList.push(m);
      return;
    }

    const isTomorrow =
      d.getDate() === tomorrowDate.getDate() &&
      d.getMonth() === tomorrowDate.getMonth() &&
      d.getFullYear() === tomorrowDate.getFullYear();

    if (isTomorrow) {
      tomorrowList.push(m);
      return;
    }

    if (d <= endOfWeekDate) {
      thisWeekList.push(m);
      return;
    }

    laterList.push(m);
  });

  const groups = [
    { key: "overdue", label: "OVERDUE", list: sortMissions(overdueList), isRed: true },
    { key: "today", label: "TODAY", list: sortMissions(todayList), isRed: false },
    { key: "tomorrow", label: "TOMORROW", list: sortMissions(tomorrowList), isRed: false },
    { key: "thisWeek", label: "THIS WEEK", list: sortMissions(thisWeekList), isRed: false },
    { key: "later", label: "LATER", list: sortMissions(laterList), isRed: false },
    { key: "completed", label: "COMPLETED", list: sortMissions(completedList), isRed: false },
  ];

  return (
    <div className="space-y-5">
      {/* Search & Sort Bar */}
      <div className="clean-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-spy-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search missions by title, codename, notes..."
              className="w-full bg-spy-surface2 border border-spy-border pl-9 pr-3 py-1.5 text-xs text-spy-text placeholder:text-spy-muted focus:outline-none focus:border-spy-borderLight rounded-[3px]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
            <ArrowUpDown className="w-3.5 h-3.5 text-spy-muted" />
            <span className="text-spy-muted">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "deadline" | "priority")}
              className="bg-spy-surface2 border border-spy-border px-2.5 py-1.5 text-xs text-spy-text focus:outline-none rounded-[3px] cursor-pointer"
            >
              <option value="deadline" className="bg-spy-surface text-spy-text">Deadline (Earliest)</option>
              <option value="priority" className="bg-spy-surface text-spy-text">Priority (Highest)</option>
            </select>
          </div>
        </div>

        {/* Filter Chips by Category */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = selectedChip === chip.key;
            const catTheme = getCategoryTheme(chip.key === "all" ? null : chip.key);
            return (
              <button
                key={chip.key}
                onClick={() => setSelectedChip(chip.key)}
                className={`px-2.5 py-1 text-xs font-mono rounded-[3px] transition-all border shrink-0 ${
                  isSelected
                    ? catTheme.filterChipActiveClass
                    : "bg-[#fffdf8] text-[#6b6a63] border-[#ddd6c8] hover:text-[#1f2421] dark:bg-spy-surface2 dark:text-spy-muted dark:border-spy-border dark:hover:text-spy-text"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Collapsible Sections */}
      <div className="space-y-6">
        {groups.map((group) => {
          // If no items in group, skip rendering empty group except if search is empty
          if (group.list.length === 0) return null;

          const isCollapsed = Boolean(collapsedSections[group.key]);

          return (
            <div key={group.key} className="space-y-3">
              {/* Collapsible Section Heading: small uppercase label + count with divider */}
              <button
                type="button"
                onClick={() => toggleSection(group.key)}
                className="w-full flex items-center gap-3 text-left group/btn select-none py-1"
              >
                <span
                  className={`text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                    group.isRed ? "text-spy-red" : "text-spy-text"
                  }`}
                >
                  <span>{group.label}</span>
                  <span className="text-[11px] opacity-75">({group.list.length})</span>
                </span>

                <div className="flex-1 h-[1px] bg-spy-border group-hover/btn:bg-spy-borderLight transition-colors" />

                <ChevronDown
                  className={`w-4 h-4 text-spy-muted transition-transform duration-200 ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>

              {/* Mission Items with smooth collapsible height animation */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-2.5 overflow-hidden"
                  >
                    {group.list.map((mission) => {
                      const category = categories.find((c) => c.id === mission.category_id);
                      return (
                        <MissionCard
                          key={mission.id}
                          mission={mission}
                          category={category}
                          isAccomplishing={mission.id === accomplishingMissionId}
                          onComplete={onComplete}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onSetActive={onSetActive}
                          onEditNote={onEditNote}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredMissions.length === 0 && (
          <div className="clean-card p-12 text-center text-xs text-spy-muted font-sans">
            No missions found matching the selected filter parameters.
          </div>
        )}
      </div>
    </div>
  );
};
