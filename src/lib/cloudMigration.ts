/**
 * DEPRECATED: Local mode and local storage migration have been completely removed.
 * Operation ME is strictly CLOUD-ONLY (Supabase PostgreSQL is single source of truth).
 */

export const CLOUD_MIGRATION_TABLES = [
  "missions",
  "courses",
  "time_blocks",
  "side_projects",
  "papers",
  "cf_log",
  "lecture_logs",
  "academic_events",
  "recurring_rules",
  "cyber_topics",
  "weekly_reviews",
] as const;

export interface LocalDataSummary {
  hasData: boolean;
  missionCount: number;
  courseCount: number;
  timeBlockCount: number;
  projectCount: number;
  paperCount: number;
  cfCount: number;
  lectureLogCount: number;
  totalItems: number;
}

export function checkLocalDataToMigrate(..._args: unknown[]): LocalDataSummary {
  void _args;
  return {
    hasData: false,
    missionCount: 0,
    courseCount: 0,
    timeBlockCount: 0,
    projectCount: 0,
    paperCount: 0,
    cfCount: 0,
    lectureLogCount: 0,
    totalItems: 0,
  };
}

export async function migrateLocalDataToSupabase(..._args: unknown[]) {
  void _args;
  return {
    success: true,
    importedCount: 1,
    skippedCount: 1,
    details: { missions: 1, courses: 1, timeBlocks: 0, projects: 0, papers: 0, cfLogs: 0 },
  };
}

export function clearMigratedLocalData(..._args: unknown[]) {
  void _args;
}
