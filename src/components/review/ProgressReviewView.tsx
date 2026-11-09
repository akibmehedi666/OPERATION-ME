"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  Save,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Mission,
  Category,
  WeeklyReview,
  LectureLog,
  CfLog,
  ResearchPaper,
  SideProject,
} from "@/types/database";
import { getCategoryTheme } from "@/lib/categoryTheme";
import { Button } from "@/components/ui/Button";

interface ProgressReviewViewProps {
  missions: Mission[];
  categories: Category[];
  totalXp: number;
  streak: number;
  lectureLogs?: LectureLog[];
  cfLogs?: CfLog[];
  researchPapers?: ResearchPaper[];
  sideProjects?: SideProject[];
  weeklyReviews?: WeeklyReview[];
  onSaveWeeklyReview: (review: Omit<WeeklyReview, "id" | "created_at">) => void;
}

export const ProgressReviewView: React.FC<ProgressReviewViewProps> = ({
  missions = [],
  categories = [],
  totalXp = 0,
  streak = 0,
  lectureLogs = [],
  cfLogs = [],
  researchPapers = [],
  weeklyReviews = [],
  onSaveWeeklyReview,
}) => {
  // 1. CALCULATE THIS WEEK'S METRICS (Sat to Fri week)
  const { now, startOfWeek, weekStartStr } = useMemo(() => {
    const n = new Date();
    const dayOfWeek = n.getDay(); // 0 is Sun, 6 is Sat
    // In our SAT-FRI schedule:
    const daysSinceSat = (dayOfWeek + 1) % 7;
    const start = new Date(n);
    start.setDate(n.getDate() - daysSinceSat);
    start.setHours(0, 0, 0, 0);
    return {
      now: n,
      startOfWeek: start,
      weekStartStr: start.toISOString().split("T")[0],
    };
  }, []);

  const thisWeekCompletedMissions = useMemo(() => {
    return missions.filter((m) => {
      if (m.status !== "completed" || !m.completed_at) return false;
      return new Date(m.completed_at) >= startOfWeek;
    });
  }, [missions, startOfWeek]);

  const thisWeekOverdueCount = useMemo(() => {
    return missions.filter((m) => {
      const dueTime = m.deadline || m.scheduled_end;
      if (m.status === "completed" || !dueTime) return false;
      return new Date(dueTime) < now;
    }).length;
  }, [missions, now]);

  const thisWeekTimeSpentMinutes = useMemo(() => {
    return thisWeekCompletedMissions.reduce((acc, m) => acc + (m.time_spent_minutes || 30), 0);
  }, [thisWeekCompletedMissions]);

  const thisWeekCfSolved = useMemo(() => {
    return cfLogs.filter((c) => {
      if (c.status !== "solved" || !c.solved_at) return false;
      return new Date(c.solved_at) >= startOfWeek;
    }).length;
  }, [cfLogs, startOfWeek]);

  const thisWeekPapersRead = useMemo(() => {
    return researchPapers.filter((p) => {
      if (p.status !== "done" || !p.date_read) return false;
      return new Date(p.date_read) >= startOfWeek;
    }).length;
  }, [researchPapers, startOfWeek]);

  const thisWeekUnstudiedLectures = useMemo(() => {
    return lectureLogs.filter((l) => !l.studied).length;
  }, [lectureLogs]);

  // Find existing review for this week
  const currentWeekReview = useMemo(() => {
    return weeklyReviews.find((r) => r.week_start_date === weekStartStr);
  }, [weeklyReviews, weekStartStr]);

  // Form states for weekly review
  const [whatWentWell, setWhatWentWell] = useState("");
  const [whatToFix, setWhatToFix] = useState("");
  const [nextWeekFocus, setNextWeekFocus] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPastReviewsExpanded, setIsPastReviewsExpanded] = useState(false);

  // Sync form inputs when current week review is loaded/fetched
  React.useEffect(() => {
    if (currentWeekReview) {
      setWhatWentWell(currentWeekReview.what_went_well || "");
      setWhatToFix(currentWeekReview.what_to_fix || "");
      setNextWeekFocus(currentWeekReview.next_week_focus || "");
    }
  }, [currentWeekReview]);

  // 2. CATEGORY COMPLETION BREAKDOWN
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catMissions = missions.filter((m) => m.category_id === cat.id);
      const completed = catMissions.filter((m) => m.status === "completed").length;
      const total = catMissions.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const theme = getCategoryTheme(cat.name || cat.id);

      return {
        ...cat,
        total,
        completed,
        percentage,
        theme,
      };
    });
  }, [categories, missions]);

  // 3. TIME DISTRIBUTION (COURSES, CP, CYBER, PROJECTS)
  const distributionData = useMemo(() => {
    let courseMinutes = 0;
    let cpMinutes = 0;
    let cyberMinutes = 0;
    let projectMinutes = 0;

    missions.forEach((m) => {
      const mins = m.time_spent_minutes || 30;
      if (m.category_id === "cat-10" || m.title.toLowerCase().includes("codeforces")) {
        cpMinutes += mins;
      } else if (m.category_id === "cat-8" || m.title.toLowerCase().includes("cyber")) {
        cyberMinutes += mins;
      } else if (m.category_id === "cat-6" || m.title.toLowerCase().includes("project")) {
        projectMinutes += mins;
      } else {
        courseMinutes += mins;
      }
    });

    const total = courseMinutes + cpMinutes + cyberMinutes + projectMinutes;
    return {
      total: total || 1,
      slices: [
        { label: "University Courses", minutes: courseMinutes, color: "#1d4f9f", hex: "#3b82f6" },
        { label: "CP & SQL Practice", minutes: cpMinutes, color: "#0f6b66", hex: "#14b8a6" },
        { label: "Cybersecurity", minutes: cyberMinutes, color: "#14663a", hex: "#22c55e" },
        { label: "Side Projects", minutes: projectMinutes, color: "#a3245a", hex: "#ec4899" },
      ],
    };
  }, [missions]);

  // 4. XP SPARKLINE (Past 7 Days Cumulative)
  const xpSparklineData = useMemo(() => {
    // Generate 7 days labels
    const points: { day: string; xp: number }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const dayMissions = missions.filter(
        (m) => m.status === "completed" && m.completed_at?.startsWith(dStr)
      );
      const earnedToday = dayMissions.reduce((acc, m) => acc + (m.xp || 50), 0);
      points.push({
        day: dayNames[d.getDay()],
        xp: earnedToday,
      });
    }

    const maxXp = Math.max(...points.map((p) => p.xp), 150);
    return { points, maxXp };
  }, [missions]);

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWeeklyReview({
      week_start_date: weekStartStr,
      completed_count: thisWeekCompletedMissions.length,
      overdue_count: thisWeekOverdueCount,
      time_spent_minutes: thisWeekTimeSpentMinutes,
      cf_solved_count: thisWeekCfSolved,
      papers_read_count: thisWeekPapersRead,
      lectures_missed_count: thisWeekUnstudiedLectures,
      what_went_well: whatWentWell.trim() || undefined,
      what_to_fix: whatToFix.trim() || undefined,
      next_week_focus: nextWeekFocus.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP METRICS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total XP */}
        <div className="clean-card p-3.5 sm:p-4 bg-spy-surface border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
              Cumulative XP
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-spy-green">
              {totalXp} <span className="text-xs font-sans font-normal text-spy-dim">XP</span>
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#dcf3e4] border border-[#a4dab3] text-[#14663a] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Current Active Streak */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#fbefd5] border-[#f4dcaa] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9a5b00] dark:text-spy-muted">
              Operational Streak
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#9a5b00] dark:text-spy-amber">
              {streak} <span className="text-xs font-sans font-normal opacity-80">days</span>
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#f8e3ba] border border-[#f1cd85] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Weekly Directives Completed */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#e4eefc] border-[#c6ddf9] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#1d4f9f] dark:text-spy-muted">
              Week Accomplished
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#1d4f9f] dark:text-blue-400">
              {thisWeekCompletedMissions.length} <span className="text-xs font-sans font-normal opacity-80">done</span>
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#cfe2fb] border border-[#b4d4f9] text-[#1d4f9f] dark:bg-spy-surface2 dark:border-spy-border dark:text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Time Invested This Week */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#f0e6fa] border-[#ded0f7] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6b2fa0] dark:text-spy-muted">
              Tactical Flight Time
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#6b2fa0] dark:text-purple-400">
              {Math.round(thisWeekTimeSpentMinutes / 60 * 10) / 10} <span className="text-xs font-sans font-normal opacity-80">hrs</span>
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#e3d1f8] border border-[#cbb0f2] text-[#6b2fa0] dark:bg-spy-surface2 dark:border-spy-border dark:text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. CHARTS ROW: XP Progression Sparkline & Time Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* XP Progression Line Chart */}
        <div className="clean-card p-4 sm:p-5 bg-spy-surface border-spy-border space-y-3">
          <div className="flex items-center justify-between border-b border-spy-border pb-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-spy-green" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-spy-text">
                7-Day Velocity & XP Growth
              </h3>
            </div>
            <span className="text-[11px] font-mono text-spy-muted">
              Total: {totalXp} XP
            </span>
          </div>

          <div className="pt-2">
            <div className="h-44 w-full flex items-end gap-2 sm:gap-4 pt-6 px-2">
              {xpSparklineData.points.map((pt, idx) => {
                const heightPercent = Math.max(8, Math.round((pt.xp / xpSparklineData.maxXp) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-spy-muted group-hover:text-spy-green transition-colors">
                      {pt.xp > 0 ? `+${pt.xp}` : "0"}
                    </span>
                    <div className="w-full bg-spy-surface2 rounded-t-[3px] overflow-hidden flex items-end h-32">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-[#1f7a4d] dark:bg-spy-green rounded-t-[2px] transition-all duration-500 group-hover:opacity-80"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-spy-dim uppercase tracking-wider">
                      {pt.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Distribution Donut / Proportional Segments */}
        <div className="clean-card p-4 sm:p-5 bg-spy-surface border-spy-border space-y-3">
          <div className="flex items-center justify-between border-b border-spy-border pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-spy-amber" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-spy-text">
                Mission Time Distribution
              </h3>
            </div>
            <span className="text-[11px] font-mono text-spy-muted">
              {Math.round(distributionData.total / 60)} hrs total
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {distributionData.slices.map((slice, idx) => {
              const percent = Math.round((slice.minutes / distributionData.total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-spy-text flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: slice.hex }}
                      />
                      <span>{slice.label}</span>
                    </span>
                    <span className="text-spy-muted">
                      {Math.round(slice.minutes / 60 * 10) / 10}h ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-spy-surface2 rounded-full overflow-hidden border border-spy-border">
                    <div
                      style={{
                        width: `${percent}%`,
                        backgroundColor: slice.hex,
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY COMPLETION RATES (11 Categories) */}
      <div className="clean-card p-4 sm:p-5 bg-spy-surface border-spy-border space-y-4">
        <div className="flex items-center justify-between border-b border-spy-border pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-spy-green" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-spy-text">
              Directives Completion By Domain
            </h3>
          </div>
          <span className="text-[11px] font-mono text-spy-muted">
            {categories.length} Operational Categories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryStats.map((cat) => {
            return (
              <div
                key={cat.id}
                className="p-3 rounded-[4px] bg-spy-surface2 border border-spy-border space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      backgroundColor: cat.theme.bgLight,
                      color: cat.theme.textLight,
                    }}
                    className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-[2px] border border-black/10 dark:border-white/10 dark:bg-spy-surface dark:text-spy-text"
                  >
                    {cat.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-spy-text">
                    {cat.percentage}%
                  </span>
                </div>

                <div className="h-1.5 w-full bg-spy-surface rounded-full overflow-hidden border border-spy-border">
                  <div
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color || "#1f7a4d",
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-spy-dim">
                  <span>{cat.completed} accomplished</span>
                  <span>{cat.total} total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. WEEKLY REVIEW FORM & RETROSPECTIVE */}
      <div className="clean-card p-4 sm:p-5 bg-spy-surface border-spy-border space-y-4">
        <div className="flex items-center justify-between border-b border-spy-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[4px] bg-[#fbefd5] border border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-spy-text uppercase">
                FRIDAY TACTICAL RETROSPECTIVE
              </h3>
              <p className="text-[11px] font-sans text-spy-muted">
                Synthesize weekly outputs, course retention, and lock in next week&apos;s operational focus
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-spy-amber font-bold">
            Week of {weekStartStr}
          </span>
        </div>

        {/* Auto-Calculated Week Performance Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-[3px] bg-spy-surface2 border border-spy-border">
            <span className="text-[10px] text-spy-muted uppercase block">Completed</span>
            <span className="font-bold text-spy-green text-sm">{thisWeekCompletedMissions.length}</span>
          </div>
          <div className="p-2.5 rounded-[3px] bg-spy-surface2 border border-spy-border">
            <span className="text-[10px] text-spy-muted uppercase block">Overdue</span>
            <span className={`font-bold text-sm ${thisWeekOverdueCount > 0 ? "text-spy-red" : "text-spy-text"}`}>
              {thisWeekOverdueCount}
            </span>
          </div>
          <div className="p-2.5 rounded-[3px] bg-spy-surface2 border border-spy-border">
            <span className="text-[10px] text-spy-muted uppercase block">CP Solves</span>
            <span className="font-bold text-spy-amber text-sm">{thisWeekCfSolved}</span>
          </div>
          <div className="p-2.5 rounded-[3px] bg-spy-surface2 border border-spy-border">
            <span className="text-[10px] text-spy-muted uppercase block">Papers Read</span>
            <span className="font-bold text-purple-400 text-sm">{thisWeekPapersRead}</span>
          </div>
          <div className="p-2.5 rounded-[3px] bg-spy-surface2 border border-spy-border">
            <span className="text-[10px] text-spy-muted uppercase block">Lectures Missed</span>
            <span className={`font-bold text-sm ${thisWeekUnstudiedLectures > 0 ? "text-spy-red" : "text-spy-green"}`}>
              {thisWeekUnstudiedLectures}
            </span>
          </div>
        </div>

        {/* Retrospective Form */}
        <form onSubmit={handleSaveReview} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-spy-green font-bold uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>What went exceptionally well this week? (Tactical Wins)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cleared all xv6 kernel homework, maintained 7-day Codeforces streak, completed economics midterms prep..."
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-spy-amber font-bold uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>What friction or bottlenecks emerged? (Tactical Fixes)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Delayed review on Prob & Stat lectures 4-5, allowed side project to pause for 7+ days..."
              value={whatToFix}
              onChange={(e) => setWhatToFix(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-amber resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-blue-500 dark:text-blue-400 font-bold uppercase flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>Next Week&apos;s Primary Tactical Focus (Max 3 Directives)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 1. Submit FYDP literature review, 2. Hit 1400 rating milestone on Codeforces, 3. Deploy Phase 2..."
              value={nextWeekFocus}
              onChange={(e) => setNextWeekFocus(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-2 text-xs text-spy-text focus:outline-none focus:border-blue-400 resize-none font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs font-mono text-spy-green font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>WEEKLY REVIEW RECORDED TO DOSSIER</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-spy-muted">
                Reviews are permanently logged into your security dossier.
              </span>
            )}

            <Button variant="primary" size="sm" type="submit">
              <Save className="w-3.5 h-3.5" />
              <span>Log Weekly Review</span>
            </Button>
          </div>
        </form>

        {/* Past Reviews Archive */}
        {weeklyReviews.length > 0 && (
          <div className="pt-4 border-t border-spy-border space-y-3">
            <button
              onClick={() => setIsPastReviewsExpanded(!isPastReviewsExpanded)}
              className="flex items-center justify-between w-full text-xs font-mono text-spy-muted hover:text-spy-text"
            >
              <span className="uppercase font-bold">Past Weekly Reviews ({weeklyReviews.length})</span>
              {isPastReviewsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isPastReviewsExpanded && (
              <div className="space-y-3 pt-2">
                {weeklyReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-[4px] bg-spy-surface2 border border-spy-border space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-spy-dim border-b border-spy-border pb-1">
                      <span className="font-bold text-spy-text">Week of {rev.week_start_date}</span>
                      <span>
                        {rev.completed_count} completed • {rev.cf_solved_count} CP solved • {rev.papers_read_count} papers
                      </span>
                    </div>
                    {rev.what_went_well && (
                      <div>
                        <span className="text-spy-green font-bold uppercase text-[10px] block">Wins</span>
                        <p className="text-spy-text font-sans">{rev.what_went_well}</p>
                      </div>
                    )}
                    {rev.what_to_fix && (
                      <div>
                        <span className="text-spy-amber font-bold uppercase text-[10px] block">Fixes</span>
                        <p className="text-spy-text font-sans">{rev.what_to_fix}</p>
                      </div>
                    )}
                    {rev.next_week_focus && (
                      <div>
                        <span className="text-blue-400 font-bold uppercase text-[10px] block">Focus</span>
                        <p className="text-spy-text font-mono">{rev.next_week_focus}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
