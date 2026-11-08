/**
 * OPERATION: ME - Data Backup & Export Utility
 * Exports all cloud data as structured JSON for offline backup directly from Supabase.
 */

import { getSupabaseClient } from "./data/client";
import { isSupabaseConfigured } from "./supabase/config";

export interface ExportedAgencyData {
  version: string;
  exportedAt: string;
  agent: string;
  missions: unknown[];
  categories: unknown[];
  schedule: unknown[];
  timeBlocks: unknown[];
  academicEvents: unknown[];
  recurringRules: unknown[];
  courses: unknown[];
  lectureLogs: unknown[];
  cyberTopics: unknown[];
  papers: unknown[];
  sideProjects: unknown[];
  cfLogs: unknown[];
  weeklyReviews: unknown[];
  notificationSettings: unknown;
  xp: number;
  streak: number;
  themePreference: string;
  animationsEnabled: boolean;
  cfHandle: string;
}

export async function collectCloudDataForExport(
  fallbackState?: Partial<ExportedAgencyData>
): Promise<ExportedAgencyData> {
  const result: ExportedAgencyData = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    agent: "Agent Akib",
    missions: fallbackState?.missions || [],
    categories: fallbackState?.categories || [],
    schedule: fallbackState?.schedule || [],
    timeBlocks: fallbackState?.timeBlocks || [],
    academicEvents: fallbackState?.academicEvents || [],
    recurringRules: fallbackState?.recurringRules || [],
    courses: fallbackState?.courses || [],
    lectureLogs: fallbackState?.lectureLogs || [],
    cyberTopics: fallbackState?.cyberTopics || [],
    papers: fallbackState?.papers || [],
    sideProjects: fallbackState?.sideProjects || [],
    cfLogs: fallbackState?.cfLogs || [],
    weeklyReviews: fallbackState?.weeklyReviews || [],
    notificationSettings: fallbackState?.notificationSettings || {},
    xp: fallbackState?.xp ?? 0,
    streak: fallbackState?.streak ?? 0,
    themePreference: fallbackState?.themePreference || "dark",
    animationsEnabled: fallbackState?.animationsEnabled ?? true,
    cfHandle: fallbackState?.cfHandle || "",
  };

  if (!isSupabaseConfigured()) {
    return result;
  }

  try {
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return result;

    const [
      { data: missions },
      { data: categories },
      { data: schedule },
      { data: timeBlocks },
      { data: academicEvents },
      { data: recurringRules },
      { data: courses },
      { data: lectureLogs },
      { data: cyberTopics },
      { data: papers },
      { data: sideProjects },
      { data: cfLogs },
      { data: weeklyReviews },
      { data: xpEvents },
      { data: streakRow },
      { data: settingsRow },
    ] = await Promise.all([
      supabase.from("missions").select("*").eq("user_id", userId),
      supabase.from("categories").select("*").or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("class_schedule").select("*").or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("time_blocks").select("*").or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("academic_events").select("*").or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("recurring_rules").select("*").or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("courses").select("*").or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("lecture_logs").select("*").eq("user_id", userId),
      supabase.from("cyber_topics").select("*").or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("papers").select("*").eq("user_id", userId),
      supabase.from("side_projects").select("*").eq("user_id", userId),
      supabase.from("cf_log").select("*").eq("user_id", userId),
      supabase.from("weekly_reviews").select("*").eq("user_id", userId),
      supabase.from("xp_events").select("amount").eq("user_id", userId),
      supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (missions) result.missions = missions;
    if (categories) result.categories = categories;
    if (schedule) result.schedule = schedule;
    if (timeBlocks) result.timeBlocks = timeBlocks;
    if (academicEvents) result.academicEvents = academicEvents;
    if (recurringRules) result.recurringRules = recurringRules;
    if (courses) result.courses = courses;
    if (lectureLogs) result.lectureLogs = lectureLogs;
    if (cyberTopics) result.cyberTopics = cyberTopics;
    if (papers) result.papers = papers;
    if (sideProjects) result.sideProjects = sideProjects;
    if (cfLogs) result.cfLogs = cfLogs;
    if (weeklyReviews) result.weeklyReviews = weeklyReviews;
    if (xpEvents) {
      result.xp = xpEvents.reduce((sum: number, r: { amount?: number | null }) => sum + (r.amount || 0), 0);
    }
    if (streakRow) {
      result.streak = streakRow.current_streak || 0;
    }
    if (settingsRow) {
      result.themePreference = settingsRow.default_theme || "dark";
      result.animationsEnabled = settingsRow.animations_enabled ?? true;
      result.cfHandle = settingsRow.cf_handle || "";
      result.notificationSettings = settingsRow.notification_settings || {};
    }
  } catch (err) {
    console.error("Failed to collect cloud data for export:", err);
  }

  return result;
}

export async function triggerDataExportDownload(
  fallbackState?: Partial<ExportedAgencyData>
): Promise<{ success: boolean; filename: string; itemCount: number }> {
  try {
    const data = await collectCloudDataForExport(fallbackState);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `operation-me-cloud-backup-${dateStr}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const itemCount =
      data.missions.length +
      data.courses.length +
      data.timeBlocks.length +
      data.sideProjects.length +
      data.papers.length +
      data.cfLogs.length;

    return { success: true, filename, itemCount };
  } catch (err) {
    console.error("Failed to export data:", err);
    return { success: false, filename: "", itemCount: 0 };
  }
}

// Backward compatibility function for synchronous local/cached data inspection
export function collectLocalDataForExport(): ExportedAgencyData {
  return {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    agent: "Agent Akib",
    missions: [],
    categories: [],
    schedule: [],
    timeBlocks: [],
    academicEvents: [],
    recurringRules: [],
    courses: [],
    lectureLogs: [],
    cyberTopics: [],
    papers: [],
    sideProjects: [],
    cfLogs: [],
    weeklyReviews: [],
    notificationSettings: {},
    xp: 0,
    streak: 0,
    themePreference: "dark",
    animationsEnabled: true,
    cfHandle: "",
  };
}

