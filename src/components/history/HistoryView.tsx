"use client";

import React, { useState, useMemo, useCallback } from "react";
import { 
  Calendar as CalendarIcon, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  X,
  Layers,
  Search,
  FileText,
  Edit3
} from "lucide-react";
import { Mission, Category, Priority } from "@/types/database";
import { 
  formatTime12, 
  formatDateWithDay 
} from "@/lib/formatters";
import { getCategoryTheme } from "@/lib/categoryTheme";

interface HistoryViewProps {
  missions: Mission[];
  categories: Category[];
  streak: number;
  onEditNote?: (mission: Mission) => void;
}

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

type RangeFilter = "all" | "today" | "week" | "month";

export const HistoryView: React.FC<HistoryViewProps> = ({
  missions,
  categories,
  streak,
  onEditNote,
}) => {
  const now = useMemo(() => new Date(), []);

  // Calendar Heatmap Month state
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null); // "YYYY-MM-DD"
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("all");
  const [categoryChip, setCategoryChip] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter completed missions only
  const allCompleted = useMemo(() => {
    return missions.filter((m) => m.status === "completed" && m.completed_at);
  }, [missions]);

  // 1. Calculate Summary Stats
  const summaryStats = useMemo(() => {
    const today = new Date();

    // Start of this week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const completedThisWeek = allCompleted.filter((m) => {
      const cd = new Date(m.completed_at!);
      return cd >= startOfWeek;
    }).length;

    const completedThisMonth = allCompleted.filter((m) => {
      const cd = new Date(m.completed_at!);
      return cd >= startOfMonth;
    }).length;

    // Most active category
    const catCounts: Record<string, number> = {};
    allCompleted.forEach((m) => {
      if (m.category_id) {
        catCounts[m.category_id] = (catCounts[m.category_id] || 0) + 1;
      }
    });

    let topCatName = "None yet";
    let maxCatCount = 0;
    Object.entries(catCounts).forEach(([catId, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        const catObj = categories.find((c) => c.id === catId);
        topCatName = catObj ? `${catObj.name} (${count})` : `Category (${count})`;
      }
    });

    return {
      thisWeek: completedThisWeek,
      thisMonth: completedThisMonth,
      bestStreak: Math.max(streak, 5),
      mostActiveCat: topCatName,
    };
  }, [allCompleted, categories, streak]);

  // 2. Calendar Heatmap Mapping for current visible month
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    const completionMap: Record<string, { count: number; xp: number }> = {};
    allCompleted.forEach((m) => {
      const d = new Date(m.completed_at!);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        const prev = completionMap[key] || { count: 0, xp: 0 };
        completionMap[key] = {
          count: prev.count + 1,
          xp: prev.xp + (m.xp || 50),
        };
      }
    });

    return {
      daysInMonth,
      firstDayOfWeek,
      completionMap,
    };
  }, [currentYear, currentMonth, allCompleted]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Helper to match category chip
  const matchCategory = useCallback((m: Mission) => {
    if (categoryChip === "all") return true;
    const cat = categories.find((c) => c.id === m.category_id);
    const catName = (cat?.name || "").toLowerCase();
    const catCode = (cat?.codename || "").toLowerCase();

    switch (categoryChip) {
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
  }, [categoryChip, categories]);

  // 3. Filter completed missions by Search, Selected Day / Range, and Category Chip
  const filteredCompleted = useMemo(() => {
    return allCompleted.filter((m) => {
      // Search query (checks title, codename, and completion_note!)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchCodename = m.codename?.toLowerCase().includes(q);
        const matchNote = m.completion_note?.toLowerCase().includes(q);
        const matchBrief = m.notes?.toLowerCase().includes(q);
        if (!matchTitle && !matchCodename && !matchNote && !matchBrief) return false;
      }

      // Category match
      if (!matchCategory(m)) return false;

      const d = new Date(m.completed_at!);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;

      // Selected day from heatmap
      if (selectedDayFilter) {
        return dateKey === selectedDayFilter;
      }

      // Range filter
      if (rangeFilter === "today") {
        const isToday =
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
        return isToday;
      }

      if (rangeFilter === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return d >= startOfWeek;
      }

      if (rangeFilter === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= startOfMonth;
      }

      return true;
    });
  }, [allCompleted, searchQuery, matchCategory, selectedDayFilter, rangeFilter, now]);

  // 4. Group missions by date key ("YYYY-MM-DD"), sorted newest date first
  const groupedByDate = useMemo(() => {
    const map: Record<string, Mission[]> = {};

    filteredCompleted.forEach((m) => {
      const d = new Date(m.completed_at!);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });

    const sortedKeys = Object.keys(map).sort((a, b) => b.localeCompare(a));

    return sortedKeys.map((key) => {
      const items = map[key].sort(
        (a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
      );
      const totalXp = items.reduce((acc, curr) => acc + (curr.xp || 50), 0);
      const sampleDate = new Date(items[0].completed_at!);

      return {
        dateKey: key,
        dateFormatted: formatDateWithDay(sampleDate),
        count: items.length,
        totalXp,
        items,
      };
    });
  }, [filteredCompleted]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getPriorityBorderClass = (p: Priority) => {
    switch (p) {
      case "urgent":
        return "border-l-[3px] border-l-spy-red";
      case "high":
        return "border-l-[3px] border-l-spy-amber";
      case "medium":
        return "border-l-[3px] border-l-spy-green";
      case "low":
      default:
        return "border-l-[3px] border-l-spy-borderLight";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY STATS ROW (Blue, Purple, Orange, Gold) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* This Week (Blue) */}
        <div className="clean-card p-4 flex items-center justify-between bg-[#eef4fd] border-[#d0e1f9] dark:bg-spy-surface dark:border-spy-border">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#1d4f9f] dark:text-spy-muted">
              This Week
            </div>
            <div className="text-lg font-mono font-bold text-[#1d4f9f] dark:text-spy-text mt-0.5">
              {summaryStats.thisWeek} done
            </div>
          </div>
          <div className="p-2 bg-[#e4eefc] border border-[#c6ddf9] rounded-[4px] text-[#1d4f9f] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green">
            <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>

        {/* This Month (Purple) */}
        <div className="clean-card p-4 flex items-center justify-between bg-[#f6f0fb] border-[#e3d4f5] dark:bg-spy-surface dark:border-spy-border">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#6b2fa0] dark:text-spy-muted">
              This Month
            </div>
            <div className="text-lg font-mono font-bold text-[#6b2fa0] dark:text-spy-text mt-0.5">
              {summaryStats.thisMonth} done
            </div>
          </div>
          <div className="p-2 bg-[#f0e6fa] border border-[#dfcbf5] rounded-[4px] text-[#6b2fa0] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-text">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Best Streak (Orange) */}
        <div className="clean-card p-4 flex items-center justify-between bg-[#fdf2ea] border-[#fcd7c0] dark:bg-spy-surface dark:border-spy-border">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#a8500f] dark:text-spy-muted">
              Best Streak
            </div>
            <div className="text-lg font-mono font-bold text-[#a8500f] dark:text-spy-amber mt-0.5">
              {summaryStats.bestStreak} days
            </div>
          </div>
          <div className="p-2 bg-[#fdeadb] border border-[#facfb7] rounded-[4px] text-[#a8500f] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Top Category (Gold) */}
        <div className="clean-card p-4 flex items-center justify-between bg-[#fcf7e6] border-[#f6e9b8] dark:bg-spy-surface dark:border-spy-border">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-mono uppercase tracking-wider text-[#8a6a00] dark:text-spy-muted">
              Top Category
            </div>
            <div className="text-sm font-mono font-bold text-[#8a6a00] dark:text-spy-text mt-0.5 truncate">
              {summaryStats.mostActiveCat}
            </div>
          </div>
          <div className="p-2 bg-[#fbf3cc] border border-[#f5e499] rounded-[4px] text-[#8a6a00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. MONTH CALENDAR HEATMAP */}
      <div className="clean-card p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-spy-border">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-spy-green" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-spy-text">
              COMPLETION ACTIVITY // {monthNames[currentMonth]} {currentYear}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-spy-muted hover:text-spy-text border border-spy-border rounded-[3px] transition-colors bg-spy-surface2"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-spy-muted hover:text-spy-text border border-spy-border rounded-[3px] transition-colors bg-spy-surface2"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[11px] font-mono text-spy-dim uppercase">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 sm:h-12 bg-transparent" />
          ))}

          {Array.from({ length: calendarData.daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const yyyy = currentYear;
            const mm = String(currentMonth + 1).padStart(2, "0");
            const dd = String(dayNum).padStart(2, "0");
            const dateKey = `${yyyy}-${mm}-${dd}`;
            const dayData = calendarData.completionMap[dateKey] || { count: 0, xp: 0 };
            const count = dayData.count;
            const xp = dayData.xp;
            const isSelected = selectedDayFilter === dateKey;
            const isToday =
              now.getFullYear() === currentYear &&
              now.getMonth() === currentMonth &&
              now.getDate() === dayNum;

            const getHeatmapColorClass = () => {
              if (count >= 4) {
                return "bg-[#1f7a4d] border-[#18633e] text-white dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green";
              }
              if (count >= 2) {
                return "bg-[#8fceaa] border-[#6fb98f] text-[#1f2421] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-text";
              }
              if (count === 1) {
                return "bg-[#cfe8d8] border-[#a9d7b9] text-[#1f2421] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-text";
              }
              return "bg-spy-surface border-spy-border text-spy-muted hover:border-spy-borderLight dark:bg-spy-surface dark:border-spy-border";
            };

            return (
              <button
                key={dateKey}
                type="button"
                title={count > 0 ? `${count} completed - ${xp} XP` : "No missions completed"}
                onClick={() => {
                  if (isSelected) {
                    setSelectedDayFilter(null);
                  } else {
                    setSelectedDayFilter(dateKey);
                  }
                }}
                className={`h-11 sm:h-13 rounded-[4px] p-1.5 text-left border flex flex-col justify-between transition-all relative group ${getHeatmapColorClass()} ${
                  isToday
                    ? "ring-2 ring-[#1f7a4d] dark:ring-spy-green ring-offset-1 ring-offset-spy-surface z-10 font-bold"
                    : ""
                } ${isSelected ? "ring-2 ring-[#1d4f9f] shadow-sm" : ""}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono ${
                      count >= 4
                        ? "text-white font-bold"
                        : isToday
                        ? "text-[#14663a] dark:text-spy-green font-bold underline"
                        : count > 0
                        ? "text-[#1f2421] dark:text-spy-text font-bold"
                        : "text-spy-muted"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {count > 0 && (
                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        count >= 4 ? "text-white/90" : "text-[#14663a] dark:text-spy-green"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </div>

                {count > 0 ? (
                  <div
                    className={`text-[9px] font-mono truncate ${
                      count >= 4 ? "text-white/80" : "text-[#14663a] dark:text-spy-dim"
                    }`}
                  >
                    +{xp} XP
                  </div>
                ) : (
                  <div className="h-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Active Notice */}
        {selectedDayFilter && (
          <div className="mt-3 pt-3 border-t border-spy-border flex items-center justify-between text-xs font-mono">
            <span className="text-spy-green flex items-center gap-1.5">
              <span>Filtering for:</span>
              <span className="text-spy-text font-semibold">{selectedDayFilter}</span>
            </span>
            <button
              onClick={() => setSelectedDayFilter(null)}
              className="text-spy-muted hover:text-spy-text flex items-center gap-1 underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear day filter</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. FILTERS: Search box (searches notes too) + Range selector + Category chips */}
      <div className="clean-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box (searches titles & completion notes) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-spy-dim absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history, directives, or debrief notes..."
              className="w-full bg-spy-surface2 border border-spy-border pl-9 pr-3 py-1.5 text-xs text-spy-text placeholder:text-spy-dim focus:outline-none focus:border-spy-green rounded-[3px]"
            />
          </div>

          {/* Range selector */}
          <div className="flex items-center gap-1 text-xs font-mono shrink-0">
            <span className="text-spy-muted mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Range:
            </span>
            {(["all", "today", "week", "month"] as RangeFilter[]).map((r) => {
              const labelMap = { all: "All", today: "Today", week: "Week", month: "Month" };
              const isSelected = rangeFilter === r && !selectedDayFilter;
              return (
                <button
                  key={r}
                  onClick={() => {
                    setSelectedDayFilter(null);
                    setRangeFilter(r);
                  }}
                  className={`px-2.5 py-1 rounded-[3px] border transition-colors ${
                    isSelected
                      ? "bg-spy-green text-spy-contrast border-spy-green font-bold"
                      : "bg-spy-surface2 text-spy-muted border-spy-border hover:text-spy-text"
                  }`}
                >
                  {labelMap[r]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = categoryChip === chip.key;
            const catTheme = getCategoryTheme(chip.key === "all" ? null : chip.key);
            return (
              <button
                key={chip.key}
                onClick={() => setCategoryChip(chip.key)}
                className={`px-2.5 py-1 text-xs font-mono rounded-[3px] transition-all border shrink-0 ${
                  isSelected
                    ? catTheme.filterChipActiveClass
                    : "bg-[#fffdf8] text-[#6b6a63] border-[#ddd6c8] hover:text-[#1f2421] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder dark:hover:border-spy-borderLight"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. TIMELINE GROUPED BY DATE (Newest first) */}
      <div className="space-y-6">
        {groupedByDate.map((group) => (
          <div key={group.dateKey} className="space-y-3">
            {/* Date heading format: "Thu, Nov 5, 2026 - 3 completed" with total XP */}
            <div className="flex items-center gap-3 py-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-spy-text flex items-center gap-2">
                <span>{group.dateFormatted}</span>
                <span className="text-spy-dim">&middot;</span>
                <span className="text-spy-muted font-normal">{group.count} completed</span>
              </span>

              <div className="flex-1 h-[1px] bg-spy-border" />

              {/* Total XP earned on that day */}
              <span className="text-xs font-mono text-spy-amber flex items-center gap-1 shrink-0 font-medium">
                <Sparkles className="w-3 h-3 text-spy-amber" />
                +{group.totalXp} XP
              </span>
            </div>

            {/* List of completed missions for this date */}
            <div className="space-y-2.5">
              {group.items.map((mission) => {
                const category = categories.find((c) => c.id === mission.category_id);
                const catTheme = getCategoryTheme(category?.name || category?.codename);
                const isLate =
                  mission.deadline &&
                  mission.completed_at &&
                  new Date(mission.completed_at) > new Date(mission.deadline);

                return (
                  <div
                    key={mission.id}
                    className={`clean-card p-3.5 sm:p-4 transition-colors flex items-center justify-between gap-3 ${getPriorityBorderClass(
                      mission.priority
                    )}`}
                  >
                    {/* Icon tile taking category color */}
                    <div
                      className={`p-2 rounded-[4px] border shrink-0 ${catTheme.iconTileClass}`}
                      title={category?.name || "Completed"}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>

                    {/* Left Details: Time + Title + Category + Late Tag + Completion Note */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Completion time in 12h format (e.g. 3:47 PM) */}
                        <span className="text-xs font-mono text-spy-muted flex items-center gap-1">
                          <Clock className="w-3 h-3 text-spy-dim" />
                          {formatTime12(mission.completed_at)}
                        </span>

                        {/* Category Chip */}
                        {category && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-[3px] border inline-flex items-center gap-1.5 font-medium ${catTheme.chipClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${catTheme.dotClass}`} />
                            {category.name}
                          </span>
                        )}

                        {/* Late tag if completed after deadline */}
                        {isLate && (
                          <span className="text-[10px] font-mono text-spy-amber bg-spy-amberMuted border border-spy-amber/30 px-1.5 py-0.5 rounded-[2px] font-semibold">
                            Late
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm sm:text-base font-medium text-spy-text leading-snug truncate">
                        {mission.title}
                      </h4>

                      {/* Debrief Note & Time Spent under entry */}
                      {(mission.completion_note || mission.time_spent_minutes) && (
                        <div className="mt-1.5 text-xs text-spy-muted flex items-center gap-1.5 font-sans bg-spy-surface2 border border-spy-border px-2.5 py-1 rounded-[3px] w-fit max-w-full">
                          <FileText className="w-3.5 h-3.5 text-spy-green shrink-0" />
                          <div className="truncate">
                            {mission.time_spent_minutes && (
                              <span className="font-semibold text-spy-green font-mono mr-1">
                                {mission.time_spent_minutes} min &middot;
                              </span>
                            )}
                            <span className="text-spy-text">{mission.completion_note}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Info: XP Earned + Edit Note Button */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {onEditNote && (
                        <button
                          onClick={() => onEditNote(mission)}
                          className="p-1.5 text-spy-muted hover:text-spy-text border border-transparent hover:border-spy-border rounded-[3px] transition-colors"
                          title={mission.completion_note ? "Edit Debrief Note" : "Add Debrief Note"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-spy-amber bg-spy-amberMuted border border-spy-border px-2 py-1 rounded-[3px]">
                        <Sparkles className="w-3 h-3 text-spy-amber" />
                        +{mission.xp || 50} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {groupedByDate.length === 0 && (
          <div className="clean-card p-12 text-center text-xs text-spy-dim font-sans">
            No completed mission history found for the selected period.
          </div>
        )}
      </div>
    </div>
  );
};
