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
  Layers
} from "lucide-react";
import { Mission, Category, Priority } from "@/types/database";
import { 
  formatTime12, 
  formatDateWithDay 
} from "@/lib/formatters";

interface HistoryViewProps {
  missions: Mission[];
  categories: Category[];
  streak: number;
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

type RangeFilter = "today" | "week" | "month" | "all";

export const HistoryView: React.FC<HistoryViewProps> = ({
  missions,
  categories,
  streak,
}) => {
  const now = useMemo(() => new Date(), []);

  // Calendar Heatmap Month state
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null); // "YYYY-MM-DD"
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("all");
  const [categoryChip, setCategoryChip] = useState("all");

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
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun ... 6=Sat

    // Map "YYYY-MM-DD" -> count
    const completionCountMap: Record<string, number> = {};
    allCompleted.forEach((m) => {
      const d = new Date(m.completed_at!);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        completionCountMap[key] = (completionCountMap[key] || 0) + 1;
      }
    });

    return {
      daysInMonth,
      firstDayOfWeek,
      completionCountMap,
    };
  }, [currentYear, currentMonth, allCompleted]);

  // Month navigation handlers
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

  // 3. Filter completed missions by Selected Day or Range Filter and Category Chip
  const filteredCompleted = useMemo(() => {
    return allCompleted.filter((m) => {
      // 1. Category match
      if (!matchCategory(m)) return false;

      const d = new Date(m.completed_at!);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;

      // 2. Day filter if user clicked a specific day in heatmap
      if (selectedDayFilter) {
        return dateKey === selectedDayFilter;
      }

      // 3. Range filter
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
  }, [allCompleted, matchCategory, selectedDayFilter, rangeFilter, now]);

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

    // Sort date keys descending (newest first)
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

  // Month name helper
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper for priority left border
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
        return "border-l-[3px] border-l-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="clean-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              This Week
            </div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {summaryStats.thisWeek} done
            </div>
          </div>
          <div className="p-2 bg-[#141d18] border border-spy-border rounded-[4px] text-spy-green">
            <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>

        <div className="clean-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              This Month
            </div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {summaryStats.thisMonth} done
            </div>
          </div>
          <div className="p-2 bg-[#141d18] border border-spy-border rounded-[4px] text-slate-300">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="clean-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Best Streak
            </div>
            <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
              {summaryStats.bestStreak} days
            </div>
          </div>
          <div className="p-2 bg-[#141d18] border border-spy-border rounded-[4px] text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="clean-card p-4 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Top Category
            </div>
            <div className="text-sm font-mono font-bold text-slate-200 mt-0.5 truncate">
              {summaryStats.mostActiveCat}
            </div>
          </div>
          <div className="p-2 bg-[#141d18] border border-spy-border rounded-[4px] text-amber-400 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. MONTH CALENDAR HEATMAP */}
      <div className="clean-card p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-spy-border">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-spy-green" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-200">
              COMPLETION ACTIVITY // {monthNames[currentMonth]} {currentYear}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white border border-spy-border rounded-[3px] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white border border-spy-border rounded-[3px] transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[11px] font-mono text-slate-500 uppercase">
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
          {/* Leading empty spaces */}
          {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 sm:h-12 bg-transparent" />
          ))}

          {/* Days of month */}
          {Array.from({ length: calendarData.daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const yyyy = currentYear;
            const mm = String(currentMonth + 1).padStart(2, "0");
            const dd = String(dayNum).padStart(2, "0");
            const dateKey = `${yyyy}-${mm}-${dd}`;
            const count = calendarData.completionCountMap[dateKey] || 0;
            const isSelected = selectedDayFilter === dateKey;
            const isToday =
              now.getFullYear() === currentYear &&
              now.getMonth() === currentMonth &&
              now.getDate() === dayNum;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedDayFilter(null);
                  } else {
                    setSelectedDayFilter(dateKey);
                  }
                }}
                className={`h-10 sm:h-12 rounded-[4px] p-1.5 text-left border flex flex-col justify-between transition-colors relative group ${
                  isSelected
                    ? "bg-[#17231d] border-spy-green shadow-[0_0_8px_rgba(0,255,102,0.15)]"
                    : count > 0
                    ? "bg-[#141d18] border-spy-border hover:border-spy-green/50"
                    : "bg-[#0f1512] border-spy-border/50 hover:border-spy-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono ${
                      isToday
                        ? "text-spy-green font-bold"
                        : isSelected
                        ? "text-white font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {count > 0 && (
                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                      {count}
                    </span>
                  )}
                </div>

                {/* Heatmap Activity Dot / Bar */}
                {count > 0 ? (
                  <div className="flex items-center gap-1">
                    <span
                      className={`h-1.5 rounded-full inline-block ${
                        count >= 3
                          ? "w-4 bg-spy-green shadow-[0_0_6px_rgba(0,255,102,0.5)]"
                          : count === 2
                          ? "w-3 bg-spy-green/75"
                          : "w-2 bg-spy-green/45"
                      }`}
                    />
                  </div>
                ) : (
                  <div className="h-1.5" />
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
              <span className="text-white font-semibold">{selectedDayFilter}</span>
            </span>
            <button
              onClick={() => setSelectedDayFilter(null)}
              className="text-slate-400 hover:text-white flex items-center gap-1 underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear day filter</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. FILTERS: Range selector + Category chips */}
      <div className="clean-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Range selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Range:
            </span>
            {(["all", "today", "week", "month"] as RangeFilter[]).map((r) => {
              const labelMap = { all: "All Time", today: "Today", week: "This Week", month: "This Month" };
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
                      ? "bg-slate-800 text-white border-slate-700 font-semibold"
                      : "bg-[#141d18] text-slate-400 border-spy-border hover:text-slate-200"
                  }`}
                >
                  {labelMap[r]}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-slate-400">
            Total Completed: <span className="text-spy-green font-bold">{filteredCompleted.length}</span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = categoryChip === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setCategoryChip(chip.key)}
                className={`px-2.5 py-1 text-xs font-mono rounded-[3px] transition-colors border shrink-0 ${
                  isSelected
                    ? "bg-spy-green/10 text-spy-green border-spy-green/40 font-semibold"
                    : "bg-[#141d18] text-slate-400 border-spy-border hover:text-slate-200"
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
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>{group.dateFormatted}</span>
                <span className="text-slate-500">&middot;</span>
                <span className="text-slate-400 font-normal">{group.count} completed</span>
              </span>

              <div className="flex-1 h-[1px] bg-spy-border" />

              {/* Total XP earned on that day */}
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1 shrink-0 font-medium">
                <Sparkles className="w-3 h-3 text-amber-400" />
                +{group.totalXp} XP
              </span>
            </div>

            {/* List of completed missions for this date */}
            <div className="space-y-2.5">
              {group.items.map((mission) => {
                const category = categories.find((c) => c.id === mission.category_id);
                // Check if mission was completed late
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
                    {/* Left Details: Time + Title + Category + Late Tag */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Completion time in 12h format (e.g. 3:47 PM) */}
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatTime12(mission.completed_at)}
                        </span>

                        {/* Category Chip */}
                        {category && (
                          <span className="text-[11px] text-slate-300 bg-[#16201b] border border-[#23332a] px-1.5 py-0.5 rounded-[2px] inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {category.name}
                          </span>
                        )}

                        {/* Late tag if completed after deadline */}
                        {isLate && (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/20 border border-amber-800/40 px-1.5 py-0.5 rounded-[2px] font-semibold">
                            Late
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm sm:text-base font-medium text-slate-100 leading-snug truncate">
                        {mission.title}
                      </h4>
                    </div>

                    {/* Right Info: XP Earned */}
                    <div className="shrink-0 flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-950/20 border border-amber-800/30 px-2 py-1 rounded-[3px]">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      +{mission.xp || 50} XP
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {groupedByDate.length === 0 && (
          <div className="clean-card p-12 text-center text-xs text-slate-500 font-sans">
            No completed mission history found for the selected period.
          </div>
        )}
      </div>
    </div>
  );
};

