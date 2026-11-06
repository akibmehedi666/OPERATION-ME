/**
 * OPERATION: ME - Data Backup & Export Utility
 * Exports all local data as structured JSON for backup prior to cloud migration.
 */

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

/**
 * Reads all data from localStorage and returns a clean structured export object.
 */
export function collectLocalDataForExport(): ExportedAgencyData {
  if (typeof window === "undefined") {
    throw new Error("Cannot export data on the server");
  }

  const parseOrFallback = <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    agent: "Agent Akib",
    missions: parseOrFallback("op_me_missions", []),
    categories: parseOrFallback("op_me_categories", []),
    schedule: parseOrFallback("op_me_schedule", []),
    timeBlocks: parseOrFallback("op_me_time_blocks", []),
    academicEvents: parseOrFallback("op_me_academic_events", []),
    recurringRules: parseOrFallback("op_me_recurring_rules", []),
    courses: parseOrFallback("op_me_courses", []),
    lectureLogs: parseOrFallback("op_me_lecture_logs", []),
    cyberTopics: parseOrFallback("op_me_cyber_topics", []),
    papers: parseOrFallback("op_me_papers", []),
    sideProjects: parseOrFallback("op_me_side_projects", []),
    cfLogs: parseOrFallback("op_me_cf_logs", []),
    weeklyReviews: parseOrFallback("op_me_weekly_reviews", []),
    notificationSettings: parseOrFallback("op_me_notifications", {}),
    xp: Number(localStorage.getItem("op_me_xp") || "0"),
    streak: Number(localStorage.getItem("op_me_streak") || "0"),
    themePreference: localStorage.getItem("op_me_theme_preference") || "dark",
    animationsEnabled: localStorage.getItem("op_me_animations_enabled") !== "false",
    cfHandle: localStorage.getItem("op_me_cf_handle") || "",
  };
}

/**
 * Downloads the collected data as a JSON file in the browser.
 */
export function triggerDataExportDownload(): { success: boolean; filename: string; itemCount: number } {
  try {
    const data = collectLocalDataForExport();
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `operation-me-backup-${dateStr}.json`;
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

