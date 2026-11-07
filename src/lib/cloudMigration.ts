/**
 * OPERATION: ME - Cloud Migration Engine
 * Handles one-time migration of local device data to Supabase.
 * Enforces strict deduplication: skips existing missions/records and preserves local data until confirmed.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  Mission,
  TimeBlock,
  AcademicEvent,
  RecurringRule,
  Course,
  LectureLog,
  CyberTopic,
  ResearchPaper,
  SideProject,
  CodeforcesLog,
  WeeklyReview,
} from "@/types/database";
import { getCanonicalProblemKey, normalizeProblemTitle } from "@/lib/codeforcesApi";

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

export interface MigrationResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  details: {
    missions: number;
    courses: number;
    timeBlocks: number;
    projects: number;
    papers: number;
    cfLogs: number;
  };
  error?: string;
}

export const DEMO_MISSION_IDS = new Set([
  "m-001", "m-002", "m-003", "m-004", "m-005", "m-006", "m-007", "m-008",
  "e2e-hero-1", "e2e-overdue-1", "e2e-today-1", "e2e-tomorrow-1", "e2e-thisweek-1", "e2e-later-1", "e2e-comp-1", "e2e-comp-2",
]);

export const DEMO_PROJECT_IDS = new Set(["proj-1", "proj-2", "proj-3"]);
export const DEMO_PAPER_IDS = new Set(["paper-1", "paper-2", "paper-3", "paper-4"]);
export const DEMO_CF_IDS = new Set(["cf-1", "cf-2", "cf-3", "cf-4", "cf-5"]);
export const DEMO_LOG_IDS = new Set(["ll-1", "ll-2", "ll-3", "ll-4", "ll-5", "ll-6"]);

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

/**
 * Inspects localStorage to detect whether un-migrated operational data is present.
 * Strictly ignores demo/sample records and never prompts on an empty/reset state.
 */
export function checkLocalDataToMigrate(userId?: string): LocalDataSummary {
  if (typeof window === "undefined") {
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

  // If already migrated and dismissed for this user, return false
  if (userId && localStorage.getItem(`op_me_migrated_${userId}`) === "true") {
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

  const getFilteredItems = <T extends { id?: string }>(key: string, demoIdSet?: Set<string>): T[] => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return [];
      const parsed = JSON.parse(item);
      if (!Array.isArray(parsed)) return [];
      if (!demoIdSet) return parsed;
      return parsed.filter((entry) => !entry.id || !demoIdSet.has(entry.id));
    } catch {
      return [];
    }
  };

  const isUnmigrated = <T extends { user_id?: string | null }>(item: T) => {
    return !item.user_id || item.user_id === "agent-akib-local";
  };

  const userMissions = getFilteredItems<Mission>("op_me_missions", DEMO_MISSION_IDS).filter(isUnmigrated);
  const userProjects = getFilteredItems<SideProject>("op_me_side_projects", DEMO_PROJECT_IDS).filter(isUnmigrated);
  const userPapers = getFilteredItems<ResearchPaper>("op_me_papers", DEMO_PAPER_IDS).filter(isUnmigrated);
  const userCfLogs = getFilteredItems<CodeforcesLog>("op_me_cf_logs", DEMO_CF_IDS).filter(isUnmigrated);
  const userLectureLogs = getFilteredItems<LectureLog>("op_me_lecture_logs", DEMO_LOG_IDS).filter(isUnmigrated);
  const userCourses = getFilteredItems<Course>("op_me_courses").filter(isUnmigrated);
  const userTimeBlocks = getFilteredItems<TimeBlock>("op_me_time_blocks").filter(isUnmigrated);

  // Only prompt migration if the user has actual created operational content
  const userCreatedItemsCount =
    userMissions.length +
    userProjects.length +
    userPapers.length +
    userCfLogs.length +
    userLectureLogs.length;

  const totalItems =
    userCreatedItemsCount + userCourses.length + userTimeBlocks.length;

  return {
    hasData: userCreatedItemsCount > 0,
    missionCount: userMissions.length,
    courseCount: userCourses.length,
    timeBlockCount: userTimeBlocks.length,
    projectCount: userProjects.length,
    paperCount: userPapers.length,
    cfCount: userCfLogs.length,
    lectureLogCount: userLectureLogs.length,
    totalItems: userCreatedItemsCount > 0 ? totalItems : 0,
  };
}

/**
 * Migrates local data into the authenticated user's Supabase cloud account.
 * Deduplicates by ID and unique key attributes so existing cloud rows are never overwritten or duplicated.
 * DOES NOT delete localStorage data.
 */
export async function migrateLocalDataToSupabase(
  supabase: SupabaseClient,
  userId: string
): Promise<MigrationResult> {
  if (!supabase || !userId) {
    return {
      success: false,
      importedCount: 0,
      skippedCount: 0,
      details: { missions: 0, courses: 0, timeBlocks: 0, projects: 0, papers: 0, cfLogs: 0 },
      error: "Supabase client or User ID unavailable.",
    };
  }

  let importedCount = 0;
  let skippedCount = 0;
  const details = { missions: 0, courses: 0, timeBlocks: 0, projects: 0, papers: 0, cfLogs: 0 };

  const getLocalArray = <T>(key: string): T[] => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  };

  try {
    // 1. MISSIONS
    const localMissions = getLocalArray<Mission>("op_me_missions");
    if (localMissions.length > 0) {
      const { data: cloudMissions } = await supabase
        .from("missions")
        .select("id, title")
        .eq("user_id", userId);

      const existingIds = new Set((cloudMissions || []).map((m) => m.id));
      const existingTitles = new Set(
        (cloudMissions || []).map((m) => m.title.trim().toLowerCase())
      );

      const toInsert = localMissions
        .filter((m) => {
          if (DEMO_MISSION_IDS.has(m.id)) {
            skippedCount++;
            return false;
          }
          if (existingIds.has(m.id) || existingTitles.has(m.title.trim().toLowerCase())) {
            skippedCount++;
            return false;
          }
          return true;
        })
        .map((m) => ({
          id: m.id,
          user_id: userId,
          title: m.title,
          codename: m.codename,
          category_id: m.category_id || null,
          priority: m.priority || "medium",
          deadline: m.deadline || null,
          notes: m.notes || null,
          status: m.status || "active",
          xp: m.xp || 50,
          recurring_rule_id: m.recurring_rule_id || null,
          auto_generated_date: m.auto_generated_date || null,
          course_id: m.course_id || null,
          project_id: m.project_id || null,
          paper_id: m.paper_id || null,
          cf_log_id: m.cf_log_id || null,
          scheduled_start: m.scheduled_start || null,
          scheduled_end: m.scheduled_end || null,
          scheduled_block_id: m.scheduled_block_id || null,
          is_auto_scheduled: m.is_auto_scheduled || false,
          created_at: m.created_at || new Date().toISOString(),
          completed_at: m.completed_at || null,
          completion_note: m.completion_note || null,
          time_spent_minutes: m.time_spent_minutes || null,
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("missions").insert(toInsert);
        if (!error) {
          importedCount += toInsert.length;
          details.missions = toInsert.length;
        }
      }
    }

    // 2. COURSES
    const localCourses = getLocalArray<Course>("op_me_courses");
    if (localCourses.length > 0) {
      const { data: cloudCourses } = await supabase
        .from("courses")
        .select("id, code")
        .eq("user_id", userId);

      const existingCourseCodes = new Set(
        (cloudCourses || []).map((c) => c.code.trim().toUpperCase())
      );
      const existingCourseIds = new Set((cloudCourses || []).map((c) => c.id));

      const toInsert = localCourses
        .filter((c) => {
          if (existingCourseIds.has(c.id) || existingCourseCodes.has(c.code.trim().toUpperCase())) {
            skippedCount++;
            return false;
          }
          return true;
        })
        .map((c) => ({
          id: c.id,
          user_id: userId,
          code: c.code,
          name: c.name,
          section: c.section || null,
          room: c.room || null,
          category_id: c.category_id || null,
          color: c.color || null,
          class_times: c.class_times || null,
          credits: c.credits || 3.0,
          resources: c.resources || [],
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("courses").insert(toInsert);
        if (!error) {
          importedCount += toInsert.length;
          details.courses = toInsert.length;
        }
      }
    }

    // 3. TIME BLOCKS
    const localTimeBlocks = getLocalArray<TimeBlock>("op_me_time_blocks");
    if (localTimeBlocks.length > 0) {
      const { data: cloudTB } = await supabase
        .from("time_blocks")
        .select("id")
        .eq("user_id", userId);

      const existingIds = new Set((cloudTB || []).map((t) => t.id));
      const toInsert = localTimeBlocks
        .filter((tb) => {
          if (existingIds.has(tb.id)) {
            skippedCount++;
            return false;
          }
          return true;
        })
        .map((tb) => ({
          id: tb.id,
          user_id: userId,
          weekday: tb.weekday,
          start_time: tb.start_time,
          end_time: tb.end_time,
          type: tb.type,
          label: tb.label,
          default_category: tb.default_category || null,
          is_fixed: tb.is_fixed || false,
          is_active: tb.is_active ?? true,
          override_date: tb.override_date || null,
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("time_blocks").insert(toInsert);
        if (!error) {
          importedCount += toInsert.length;
          details.timeBlocks = toInsert.length;
        }
      }
    }

    // 4. SIDE PROJECTS
    const localProjects = getLocalArray<SideProject>("op_me_side_projects");
    if (localProjects.length > 0) {
      const { data: cloudProjects } = await supabase
        .from("side_projects")
        .select("id, name")
        .eq("user_id", userId);

      const existingIds = new Set((cloudProjects || []).map((p) => p.id));
      const existingNames = new Set(
        (cloudProjects || []).map((p) => p.name.trim().toLowerCase())
      );

      const toInsert = localProjects
        .filter((p) => {
          if (DEMO_PROJECT_IDS.has(p.id)) {
            skippedCount++;
            return false;
          }
          if (existingIds.has(p.id) || existingNames.has(p.name.trim().toLowerCase())) {
            skippedCount++;
            return false;
          }
          return true;
        })
        .map((p) => ({
          id: p.id,
          user_id: userId,
          name: p.name,
          description: p.description || null,
          status: p.status || "active",
          next_step: p.next_step || null,
          last_worked_at: p.last_worked_at || null,
          repo_url: p.repo_url || null,
          live_url: p.live_url || null,
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("side_projects").insert(toInsert);
        if (!error) {
          importedCount += toInsert.length;
          details.projects = toInsert.length;
        }
      }
    }

    // 5. RESEARCH PAPERS
    const localPapers = getLocalArray<ResearchPaper>("op_me_papers");
    if (localPapers.length > 0) {
      const { data: cloudPapers } = await supabase
        .from("papers")
        .select("id, title")
        .eq("user_id", userId);

      const existingIds = new Set((cloudPapers || []).map((p) => p.id));
      const existingTitles = new Set(
        (cloudPapers || []).map((p) => p.title.trim().toLowerCase())
      );

      const toInsert = localPapers
        .filter((p) => {
          if (DEMO_PAPER_IDS.has(p.id)) {
            skippedCount++;
            return false;
          }
          if (existingIds.has(p.id) || existingTitles.has(p.title.trim().toLowerCase())) {
            skippedCount++;
            return false;
          }
          return true;
        })
        .map((p) => ({
          id: p.id,
          user_id: userId,
          title: p.title,
          authors: p.authors || null,
          venue: p.venue || null,
          status: p.status || "to-read",
          notes: p.notes || null,
          url: p.url || null,
          tags: p.tags || [],
          summary: p.summary || null,
          takeaway: p.takeaway || null,
          date_read: p.date_read || null,
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("papers").insert(toInsert);
        if (!error) {
          importedCount += toInsert.length;
          details.papers = toInsert.length;
        }
      }
    }

    // 6. CODEFORCES LOGS
    const localCf = getLocalArray<CodeforcesLog>("op_me_cf_logs");
    if (localCf.length > 0) {
      const { data: cloudCf } = await supabase
        .from("cf_log")
        .select("id, problem_name, problem_url, problem_key")
        .eq("user_id", userId);

      const existingKeys = new Set(
        (cloudCf || []).map((c: Partial<CodeforcesLog>) => c.problem_key || getCanonicalProblemKey(c))
      );
      const existingNames = new Set(
        (cloudCf || []).map((c: Partial<CodeforcesLog>) => normalizeProblemTitle(c.problem_name || ""))
      );

      const seenKeysInBatch = new Set<string>();

      const toInsert = localCf
        .filter((c) => {
          if (DEMO_CF_IDS.has(c.id)) {
            skippedCount++;
            return false;
          }
          const key = c.problem_key || getCanonicalProblemKey(c);
          const normName = normalizeProblemTitle(c.problem_name || "");
          if (existingKeys.has(key) || (normName && existingNames.has(normName)) || seenKeysInBatch.has(key)) {
            skippedCount++;
            return false;
          }
          seenKeysInBatch.add(key);
          return true;
        })
        .map((c) => {
          const problemKey = c.problem_key || getCanonicalProblemKey(c);
          return {
            id: c.id || problemKey,
            problem_key: problemKey,
            user_id: userId,
            handle: c.handle || null,
            problem_name: c.problem_name,
            problem_url: c.problem_url || null,
            rating: c.rating || null,
            verdict: c.verdict || "OK",
            tags: c.tags || [],
            status: c.status || "solved",
            time_taken_minutes: c.time_taken_minutes || null,
            date: c.date || new Date().toISOString().slice(0, 10),
            notes: c.notes || null,
            solved_at: c.solved_at || new Date().toISOString(),
            xp: c.notes ? (c.xp ?? 0) : 0,
          };
        });

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from("cf_log")
          .upsert(toInsert, { onConflict: "user_id,problem_key" });
        if (!error) {
          importedCount += toInsert.length;
          details.cfLogs = toInsert.length;
        } else {
          const { error: idError } = await supabase
            .from("cf_log")
            .upsert(toInsert, { onConflict: "id" });
          if (!idError) {
            importedCount += toInsert.length;
            details.cfLogs = toInsert.length;
          }
        }
      }
    }

    // 7. LECTURE LOGS
    const localLectureLogs = getLocalArray<LectureLog>("op_me_lecture_logs");
    if (localLectureLogs.length > 0) {
      const { data: cloudLogs } = await supabase
        .from("lecture_logs")
        .select("id")
        .eq("user_id", userId);

      const existingIds = new Set((cloudLogs || []).map((l) => l.id));
      const toInsert = localLectureLogs
        .filter((l) => {
          if (DEMO_LOG_IDS.has(l.id)) {
            skippedCount++;
            return false;
          }
          return !existingIds.has(l.id);
        })
        .map((l) => ({
          id: l.id,
          user_id: userId,
          course_name: l.course_name,
          course_id: l.course_id || null,
          date: l.date,
          topic: l.topic || null,
          notes: l.notes || null,
          studied: l.studied ?? false,
          lecture_number: l.lecture_number || null,
        }));

      if (toInsert.length > 0) {
        await supabase.from("lecture_logs").insert(toInsert);
      }
    }

    // 8. ACADEMIC EVENTS
    const localEvents = getLocalArray<AcademicEvent>("op_me_academic_events");
    if (localEvents.length > 0) {
      const { data: cloudEvents } = await supabase
        .from("academic_events")
        .select("id")
        .eq("user_id", userId);

      const existingIds = new Set((cloudEvents || []).map((e) => e.id));
      const toInsert = localEvents
        .filter((e) => !existingIds.has(e.id))
        .map((e) => ({
          id: e.id,
          user_id: userId,
          date: e.date,
          end_date: e.end_date || null,
          title: e.title,
          type: e.type,
          details: e.details || null,
        }));

      if (toInsert.length > 0) {
        await supabase.from("academic_events").insert(toInsert);
      }
    }

    // 9. RECURRING RULES
    const localRules = getLocalArray<RecurringRule>("op_me_recurring_rules");
    if (localRules.length > 0) {
      const { data: cloudRules } = await supabase
        .from("recurring_rules")
        .select("id")
        .eq("user_id", userId);

      const existingIds = new Set((cloudRules || []).map((r) => r.id));
      const toInsert = localRules
        .filter((r) => !existingIds.has(r.id))
        .map((r) => ({
          id: r.id,
          user_id: userId,
          title: r.title,
          rule_type: r.rule_type,
          category_id: r.category_id || null,
          priority: r.priority,
          frequency: r.frequency,
          interval: r.interval || 1,
          days_of_week: r.days_of_week || [],
          time_of_day: r.time_of_day || null,
          xp: r.xp,
          is_active: r.is_active,
          config: r.config || {},
          last_generated_date: r.last_generated_date || null,
        }));

      if (toInsert.length > 0) {
        await supabase.from("recurring_rules").insert(toInsert);
      }
    }

    // 10. CYBER TOPICS
    const localTopics = getLocalArray<CyberTopic>("op_me_cyber_topics");
    if (localTopics.length > 0) {
      const { data: cloudTopics } = await supabase
        .from("cyber_topics")
        .select("id")
        .eq("user_id", userId);

      const existingIds = new Set((cloudTopics || []).map((t) => t.id));
      const toInsert = localTopics
        .filter((t) => !existingIds.has(t.id))
        .map((t) => ({
          id: t.id,
          user_id: userId,
          section: t.section,
          title: t.title,
          status: t.status,
          resources: t.resources || [],
          notes: t.notes || null,
          time_spent_minutes: t.time_spent_minutes || 0,
          order_index: t.order_index || 0,
          completed_at: t.completed_at || null,
        }));

      if (toInsert.length > 0) {
        await supabase.from("cyber_topics").insert(toInsert);
      }
    }

    // 11. WEEKLY REVIEWS
    const localReviews = getLocalArray<WeeklyReview>("op_me_weekly_reviews");
    if (localReviews.length > 0) {
      const { data: cloudReviews } = await supabase
        .from("weekly_reviews")
        .select("id")
        .eq("user_id", userId);

      const existingIds = new Set((cloudReviews || []).map((r) => r.id));
      const toInsert = localReviews
        .filter((r) => !existingIds.has(r.id))
        .map((r) => ({
          id: r.id,
          user_id: userId,
          week_start_date: r.week_start_date,
          completed_count: r.completed_count || 0,
          overdue_count: r.overdue_count || 0,
          time_spent_minutes: r.time_spent_minutes || 0,
          cf_solved_count: r.cf_solved_count || 0,
          papers_read_count: r.papers_read_count || 0,
          lectures_missed_count: r.lectures_missed_count || 0,
          what_went_well: r.what_went_well || null,
          what_to_fix: r.what_to_fix || null,
          next_week_focus: r.next_week_focus || null,
        }));

      if (toInsert.length > 0) {
        await supabase.from("weekly_reviews").insert(toInsert);
      }
    }

    // Mark user migration flag in localStorage so they are not prompted again
    localStorage.setItem(`op_me_migrated_${userId}`, "true");

    return {
      success: true,
      importedCount,
      skippedCount,
      details,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Migration failed";
    console.error("Migration error:", err);
    return {
      success: false,
      importedCount,
      skippedCount,
      details,
      error: message,
    };
  }
}

/**
 * Deletes operational progress localStorage keys ONLY when user explicitly confirms.
 * NEVER deletes structure tables: courses, time blocks, academic events, recurring rules, cyber roadmap, categories.
 * Preserves user's UI theme and animation preferences.
 */
export function clearMigratedLocalData(userId?: string): void {
  if (typeof window === "undefined") return;

  // STRICT RULE: Only clear operational progress data. Never delete structure tables.
  const keysToDelete = [
    "op_me_missions",
    "op_me_lecture_logs",
    "op_me_papers",
    "op_me_side_projects",
    "op_me_cf_logs",
    "op_me_weekly_reviews",
  ];

  keysToDelete.forEach((key) => localStorage.removeItem(key));

  if (userId) {
    localStorage.setItem(`op_me_migrated_${userId}`, "true");
    localStorage.setItem(`op_me_local_cleared_${userId}`, "true");
  }
}

