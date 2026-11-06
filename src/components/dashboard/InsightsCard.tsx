"use client";

import React, { useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  FolderGit2,
  Flame,
  ArrowRight,
  Target,
} from "lucide-react";
import { Mission, LectureLog, SideProject, CfLog } from "@/types/database";

interface InsightsCardProps {
  missions: Mission[];
  lectureLogs?: LectureLog[];
  sideProjects?: SideProject[];
  streak?: number;
  cfLogs?: CfLog[];
  onNavigate?: (tab: string) => void;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({
  missions = [],
  lectureLogs = [],
  sideProjects = [],
  streak = 0,
  cfLogs = [],
  onNavigate,
}) => {
  const completedMissions = useMemo(
    () => missions.filter((m) => m.status === "completed" && m.completed_at),
    [missions]
  );

  // 1. Peak Productivity Time of Day
  const peakProductivityInsight = useMemo(() => {
    if (completedMissions.length === 0) {
      return {
        label: "Operational Velocity",
        detail: "Complete missions to uncover your peak cognitive focus hours.",
        window: "Awaiting intel",
      };
    }

    const hourBuckets: Record<string, number> = {
      morning: 0,   // 6 AM - 12 PM
      afternoon: 0, // 12 PM - 5 PM
      evening: 0,   // 5 PM - 9 PM
      night: 0,     // 9 PM - 6 AM
    };

    completedMissions.forEach((m) => {
      const hour = new Date(m.completed_at!).getHours();
      if (hour >= 6 && hour < 12) hourBuckets.morning++;
      else if (hour >= 12 && hour < 17) hourBuckets.afternoon++;
      else if (hour >= 17 && hour < 21) hourBuckets.evening++;
      else hourBuckets.night++;
    });

    const entries = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1]);
    const top = entries[0][0];

    switch (top) {
      case "morning":
        return {
          label: "Early Strike Operative",
          detail: "You execute peak directives between 6:00 AM – 12:00 PM.",
          window: "Morning Focus",
        };
      case "afternoon":
        return {
          label: "Midday Momentum",
          detail: "Maximum mission throughput occurs between 12:00 PM – 5:00 PM.",
          window: "Midday Execution",
        };
      case "evening":
        return {
          label: "Prime Evening Drive",
          detail: "High completion velocity observed between 5:00 PM – 9:00 PM.",
          window: "Evening Drive",
        };
      default:
        return {
          label: "Night Owl operative",
          detail: "Highest mission accomplishment rate logged between 9:00 PM – 2:00 AM.",
          window: "Night Deep Work",
        };
    }
  }, [completedMissions]);

  // 2. Unreviewed Lectures Count
  const unreviewedLectures = useMemo(
    () => lectureLogs.filter((l) => !l.studied),
    [lectureLogs]
  );

  // 3. Stalled Side Projects Count (inactive >= 7 days)
  const stalledProjects = useMemo(() => {
    return sideProjects.filter((p) => {
      if (p.status === "completed" || !p.last_worked_at) return false;
      const days = Math.floor(
        (Date.now() - new Date(p.last_worked_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return days >= 7;
    });
  }, [sideProjects]);

  // 4. Streak Defense Status Today
  const todayCompletedCount = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return missions.filter(
      (m) => m.status === "completed" && m.completed_at?.startsWith(todayStr)
    ).length;
  }, [missions]);

  // 5. Codeforces Daily Target Status
  const todaySolvedCfCount = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return cfLogs.filter(
      (c) => c.status === "solved" && c.solved_at?.startsWith(todayStr)
    ).length;
  }, [cfLogs]);

  return (
    <div className="clean-card p-4 sm:p-5 bg-spy-surface border-spy-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-spy-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-[4px] bg-[#fbefd5] border border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-spy-text uppercase">
              TACTICAL INTELLIGENCE & INSIGHTS
            </h3>
            <p className="text-[11px] font-sans text-spy-muted">
              Real-time cognitive velocity, momentum warnings, and study defense
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Dynamic Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Peak Velocity Card */}
        <div className="p-3 rounded-[4px] bg-spy-surface2 border border-spy-border flex items-start gap-3">
          <div className="p-2 rounded-[3px] bg-spy-surface border border-spy-border text-spy-dim mt-0.5 shrink-0">
            <TrendingUp className="w-4 h-4 text-spy-green" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase text-spy-text">
                {peakProductivityInsight.label}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-spy-surface border border-spy-border text-spy-dim">
                {peakProductivityInsight.window}
              </span>
            </div>
            <p className="text-xs text-spy-muted font-sans leading-relaxed">
              {peakProductivityInsight.detail}
            </p>
          </div>
        </div>

        {/* Streak Defense Alert */}
        <div className={`p-3 rounded-[4px] border flex items-start gap-3 ${
          todayCompletedCount === 0 && streak > 0
            ? "bg-[#fbefd5] border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-amber/10 dark:border-spy-amber/30 dark:text-spy-amber"
            : "bg-spy-surface2 border-spy-border text-spy-text"
        }`}>
          <div className="p-2 rounded-[3px] bg-spy-surface border border-spy-border text-spy-amber mt-0.5 shrink-0">
            <Flame className="w-4 h-4 text-spy-amber" />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase">
              {todayCompletedCount > 0 ? "Streak Fortified" : "Streak Under Threat"}
            </div>
            <p className="text-xs text-spy-muted font-sans leading-relaxed">
              {todayCompletedCount > 0
                ? `${todayCompletedCount} mission${todayCompletedCount > 1 ? "s" : ""} accomplished today! Streak is secured at ${streak} days.`
                : `0 missions completed today. Accomplish 1 directive before 11:59 PM to maintain your ${streak}-day streak.`}
            </p>
          </div>
        </div>

        {/* Course Lecture Review Alert */}
        <div
          onClick={() => onNavigate?.("courses")}
          className={`p-3 rounded-[4px] border flex items-start gap-3 cursor-pointer hover:border-spy-green transition-colors ${
            unreviewedLectures.length > 0
              ? "bg-[#dcf3e4]/60 border-[#b2e5c3] dark:bg-spy-surface2 dark:border-spy-border"
              : "bg-spy-surface2 border-spy-border"
          }`}
        >
          <div className="p-2 rounded-[3px] bg-spy-surface border border-spy-border text-spy-dim mt-0.5 shrink-0">
            <BookOpen className="w-4 h-4 text-[#14663a] dark:text-spy-green" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase text-spy-text">
                Academic Log Check
              </span>
              <ArrowRight className="w-3 h-3 text-spy-dim" />
            </div>
            <p className="text-xs text-spy-muted font-sans leading-relaxed">
              {unreviewedLectures.length > 0
                ? `${unreviewedLectures.length} lecture${unreviewedLectures.length > 1 ? "s" : ""} pending review in Course HQ. Retain core material before next lecture!`
                : "All current university lectures marked as studied and retained."}
            </p>
          </div>
        </div>

        {/* Side Project Stalled / CP Status Alert */}
        {stalledProjects.length > 0 ? (
          <div
            onClick={() => onNavigate?.("projects")}
            className="p-3 rounded-[4px] border border-[#f4dcaa] bg-[#fbefd5]/60 dark:bg-spy-surface2 dark:border-spy-border flex items-start gap-3 cursor-pointer hover:border-spy-amber transition-colors"
          >
            <div className="p-2 rounded-[3px] bg-spy-surface border border-spy-border text-[#9a5b00] dark:text-spy-amber mt-0.5 shrink-0">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-spy-text">
                  Stalled Build Alert
                </span>
                <ArrowRight className="w-3 h-3 text-spy-dim" />
              </div>
              <p className="text-xs text-spy-muted font-sans leading-relaxed">
                <span className="font-bold">{stalledProjects[0].name}</span> has had no commits in 7+ days. Log a 15-min session to keep context hot.
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => onNavigate?.("codeforces")}
            className="p-3 rounded-[4px] bg-spy-surface2 border border-spy-border flex items-start gap-3 cursor-pointer hover:border-spy-green transition-colors"
          >
            <div className="p-2 rounded-[3px] bg-spy-surface border border-spy-border text-spy-dim mt-0.5 shrink-0">
              <Target className="w-4 h-4 text-spy-dim" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-spy-text">
                  Competitive Programming
                </span>
                <ArrowRight className="w-3 h-3 text-spy-dim" />
              </div>
              <p className="text-xs text-spy-muted font-sans leading-relaxed">
                {todaySolvedCfCount > 0
                  ? `Daily 1/1 target reached! Solved ${todaySolvedCfCount} problem${todaySolvedCfCount > 1 ? "s" : ""} today.`
                  : "Daily solve target pending. Tackle 1 problem during your CP / SQL block."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
