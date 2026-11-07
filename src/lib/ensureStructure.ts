/**
 * OPERATION: ME - Ensure Structure Engine
 * Guarantees that all baseline structure tables are seeded into Supabase for the authenticated user.
 * Idempotent, deterministic IDs, on-conflict do nothing to preserve any user edits.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { TimeBlock } from "@/types/database";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SCHEDULE,
  DEFAULT_TIME_BLOCKS,
  DEFAULT_ACADEMIC_EVENTS,
  DEFAULT_RECURRING_RULES,
  DEFAULT_COURSES,
  DEFAULT_CYBER_TOPICS,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "@/lib/seeds";

export interface StructureCounts {
  categories: number;
  courses: number;
  class_schedule: number;
  academic_events: number;
  recurring_rules: number;
  cyber_topics: number;
  user_settings: number;
  time_blocks: number;
}

export interface EnsureStructureResult {
  success: boolean;
  existingTimeBlocksRow: TimeBlock | null;
  counts: StructureCounts;
  details: string[];
  error?: string;
}

export async function ensureStructureData(
  supabase: SupabaseClient,
  userId: string
): Promise<EnsureStructureResult> {
  const details: string[] = [];
  let existingTimeBlocksRow: TimeBlock | null = null;
  const counts: StructureCounts = {
    categories: 0,
    courses: 0,
    class_schedule: 0,
    academic_events: 0,
    recurring_rules: 0,
    cyber_topics: 0,
    user_settings: 0,
    time_blocks: 0,
  };

  try {
    // -------------------------------------------------------------
    // 1. CATEGORIES (Seed: 12 categories)
    // -------------------------------------------------------------
    const { data: existingCats, error: catErr } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (catErr) {
      console.warn("[EnsureStructure] Error checking categories:", catErr.message);
    }

    const categoriesList = existingCats || [];
    if (categoriesList.length === 0) {
      const recordsToInsert = DEFAULT_CATEGORIES.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        codename: c.codename || null,
        color: c.color || "#10b981",
        icon: c.icon || "Cpu",
      }));
      // Also add General Routine cat-12 if not present
      if (!recordsToInsert.some((c) => c.id === "cat-12")) {
        recordsToInsert.push({
          id: "cat-12",
          user_id: userId,
          name: "General Routine",
          codename: "CAT-GENERAL",
          color: "#64748b",
          icon: "Clock",
        });
      }

      const { error: insertCatErr } = await supabase
        .from("categories")
        .upsert(recordsToInsert, { onConflict: "id", ignoreDuplicates: true });

      if (insertCatErr) {
        console.error("[EnsureStructure] Failed to insert categories:", insertCatErr.message);
        details.push(`categories insert error: ${insertCatErr.message}`);
      } else {
        details.push(`Seeded ${recordsToInsert.length} categories.`);
      }
    } else {
      details.push(`Categories already present (${categoriesList.length} rows).`);
    }

    // -------------------------------------------------------------
    // 2. COURSES (Seed: 6 courses)
    // -------------------------------------------------------------
    const { data: existingCourses, error: courseErr } = await supabase
      .from("courses")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (courseErr) {
      console.warn("[EnsureStructure] Error checking courses:", courseErr.message);
    }

    const courseList = existingCourses || [];
    if (courseList.length === 0) {
      const recordsToInsert = DEFAULT_COURSES.map((c) => ({
        id: c.id,
        user_id: userId,
        code: c.code,
        name: c.name,
        section: c.section || null,
        room: c.room || null,
        category_id: c.category_id || null,
        color: c.color || "#10b981",
        class_times: c.class_times || null,
        credits: c.credits || 3.0,
        resources: c.resources || [],
      }));

      const { error: insertCourseErr } = await supabase
        .from("courses")
        .upsert(recordsToInsert, { onConflict: "id", ignoreDuplicates: true });

      if (insertCourseErr) {
        console.error("[EnsureStructure] Failed to insert courses:", insertCourseErr.message);
        details.push(`courses insert error: ${insertCourseErr.message}`);
      } else {
        details.push(`Seeded ${recordsToInsert.length} courses.`);
      }
    } else {
      details.push(`Courses already present (${courseList.length} rows).`);
    }

    // -------------------------------------------------------------
    // 3. CLASS SCHEDULE (Seed: 13 timetable items incl. tuition)
    // -------------------------------------------------------------
    const { data: existingSched, error: schedErr } = await supabase
      .from("class_schedule")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (schedErr) {
      console.warn("[EnsureStructure] Error checking class_schedule:", schedErr.message);
    }

    const schedList = existingSched || [];
    if (schedList.length === 0) {
      const recordsToInsert = DEFAULT_SCHEDULE.map((s) => ({
        id: s.id,
        user_id: userId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        course_name: s.course_name,
        room: s.room || null,
        type: s.type || "class",
      }));

      const { error: insertSchedErr } = await supabase
        .from("class_schedule")
        .upsert(recordsToInsert, { onConflict: "id", ignoreDuplicates: true });

      if (insertSchedErr) {
        console.error("[EnsureStructure] Failed to insert class_schedule:", insertSchedErr.message);
        details.push(`class_schedule insert error: ${insertSchedErr.message}`);
      } else {
        details.push(`Seeded ${recordsToInsert.length} schedule items.`);
      }
    } else {
      details.push(`Class schedule already present (${schedList.length} rows).`);
    }

    // -------------------------------------------------------------
    // 4. ACADEMIC EVENTS (Seed: 17 key dates & overrides)
    // -------------------------------------------------------------
    const { data: existingEvents, error: aeErr } = await supabase
      .from("academic_events")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (aeErr) {
      console.warn("[EnsureStructure] Error checking academic_events:", aeErr.message);
    }

    const eventList = existingEvents || [];
    if (eventList.length === 0) {
      const recordsToInsert = DEFAULT_ACADEMIC_EVENTS.map((e) => ({
        id: e.id,
        user_id: userId,
        date: e.date,
        end_date: e.end_date || null,
        title: e.title,
        type: e.type,
        details: e.details || null,
      }));

      const { error: insertAeErr } = await supabase
        .from("academic_events")
        .upsert(recordsToInsert, { onConflict: "id", ignoreDuplicates: true });

      if (insertAeErr) {
        console.error("[EnsureStructure] Failed to insert academic_events:", insertAeErr.message);
        details.push(`academic_events insert error: ${insertAeErr.message}`);
      } else {
        details.push(`Seeded ${recordsToInsert.length} academic events.`);
      }
    } else {
      details.push(`Academic events already present (${eventList.length} rows).`);
    }

    // -------------------------------------------------------------
    // 5. RECURRING RULES (Seed: 7 auto-mission directives)
    // -------------------------------------------------------------
    const { data: existingRules, error: rrErr } = await supabase
      .from("recurring_rules")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (rrErr) {
      console.warn("[EnsureStructure] Error checking recurring_rules:", rrErr.message);
    }

    const ruleList = existingRules || [];
    if (ruleList.length === 0) {
      const recordsToInsert = DEFAULT_RECURRING_RULES.map((r) => ({
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

      const { error: insertRrErr } = await supabase
        .from("recurring_rules")
        .upsert(recordsToInsert, { onConflict: "id", ignoreDuplicates: true });

      if (insertRrErr) {
        console.error("[EnsureStructure] Failed to insert recurring_rules:", insertRrErr.message);
        details.push(`recurring_rules insert error: ${insertRrErr.message}`);
      } else {
        details.push(`Seeded ${recordsToInsert.length} recurring rules.`);
      }
    } else {
      details.push(`Recurring rules already present (${ruleList.length} rows).`);
    }

    // -------------------------------------------------------------
    // 6. CYBERSECURITY ROADMAP (Seed: 28 topics with not_started)
    // -------------------------------------------------------------
    const { data: existingCyber, error: cyberErr } = await supabase
      .from("cyber_topics")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (cyberErr) {
      console.warn("[EnsureStructure] Error checking cyber_topics:", cyberErr.message);
    }

    const cyberList = existingCyber || [];
    if (cyberList.length === 0) {
      const recordsToInsert = DEFAULT_CYBER_TOPICS.map((t) => ({
        id: t.id,
        user_id: userId,
        section: t.section,
        title: t.title,
        status: "not_started" as const,
        goal: t.goal || null,
        learning_links: t.learning_links || [],
        hands_on_task: t.hands_on_task || null,
        hands_on_url: t.hands_on_url || null,
        hands_on_platform: t.hands_on_platform || null,
        hands_on_completed: false,
        takeaway: null,
        resources: t.resources || [],
        notes: null,
        time_spent_minutes: 0,
        order_index: t.order_index || 0,
        completed_at: null,
      }));

      const { error: insertCyberErr } = await supabase
        .from("cyber_topics")
        .upsert(recordsToInsert, { onConflict: "id", ignoreDuplicates: true });

      if (insertCyberErr) {
        console.warn("[EnsureStructure] Full cyber_topics upsert failed, retrying with baseline columns:", insertCyberErr.message);
        // Fallback: If extended columns (goal, learning_links, etc.) are not in the schema yet, insert core fields
        const baselineRecords = DEFAULT_CYBER_TOPICS.map((t) => ({
          id: t.id,
          user_id: userId,
          section: t.section,
          title: t.title,
          status: "not_started" as const,
          resources: t.resources || [],
          notes: null,
          time_spent_minutes: 0,
          order_index: t.order_index || 0,
          completed_at: null,
        }));
        const { error: baselineErr } = await supabase
          .from("cyber_topics")
          .upsert(baselineRecords, { onConflict: "id", ignoreDuplicates: true });

        if (baselineErr) {
          console.error("[EnsureStructure] Failed to insert baseline cyber_topics:", baselineErr.message);
          details.push(`cyber_topics insert error: ${baselineErr.message}`);
        } else {
          details.push(`Seeded ${baselineRecords.length} baseline cyber topics.`);
        }
      } else {
        details.push(`Seeded ${recordsToInsert.length} cyber topics.`);
      }
    } else {
      details.push(`Cyber topics already present (${cyberList.length} rows).`);
    }

    // -------------------------------------------------------------
    // 7. USER SETTINGS
    // -------------------------------------------------------------
    const { data: existingSettings, error: setErr } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (setErr) {
      console.warn("[EnsureStructure] Error checking user_settings:", setErr.message);
    }

    if (!existingSettings) {
      const settingsRecord = {
        id: `settings-${userId}`,
        user_id: userId,
        default_theme: "dark",
        animations_enabled: true,
        sound_enabled: true,
        cf_handle: "",
        notification_settings: DEFAULT_NOTIFICATION_SETTINGS,
      };

      const { error: insertSetErr } = await supabase
        .from("user_settings")
        .upsert(settingsRecord, { onConflict: "user_id", ignoreDuplicates: true });

      if (insertSetErr) {
        console.error("[EnsureStructure] Failed to insert user_settings:", insertSetErr.message);
        details.push(`user_settings insert error: ${insertSetErr.message}`);
      } else {
        details.push("Seeded default user settings.");
      }
    } else {
      details.push("User settings already present.");
    }

    // -------------------------------------------------------------
    // 8. TIME BLOCKS (Weekly Template: 34 default blocks)
    // -------------------------------------------------------------
    const { data: existingBlocks, error: tbErr } = await supabase
      .from("time_blocks")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (tbErr) {
      console.warn("[EnsureStructure] Error checking time_blocks:", tbErr.message);
    }

    const currentBlocks = existingBlocks || [];
    if (currentBlocks.length === 1) {
      const singleBlock = currentBlocks[0];
      existingTimeBlocksRow = singleBlock;
      console.log(
        "[EnsureStructure] Detected existing 1 row in time_blocks:",
        JSON.stringify(singleBlock)
      );
      details.push(
        `Preserved 1 existing time_block: [${singleBlock.id}] ${singleBlock.weekday} ${singleBlock.start_time}-${singleBlock.end_time} (${singleBlock.label})`
      );

      // If user_id is null, adopt it for the current user
      if (!singleBlock.user_id) {
        await supabase
          .from("time_blocks")
          .update({ user_id: userId })
          .eq("id", singleBlock.id);
      }
    } else if (currentBlocks.length > 1) {
      details.push(`Time blocks already fully seeded (${currentBlocks.length} rows).`);
    }

    // Build list of blocks to insert: skip any block matching an existing ID or matching (weekday, start, end, type)
    const existingIds = new Set(currentBlocks.map((b) => b.id));
    const isMatchingExisting = (tb: TimeBlock) => {
      if (existingIds.has(tb.id)) return true;
      return currentBlocks.some(
        (b) =>
          b.weekday === tb.weekday &&
          b.start_time === tb.start_time &&
          b.end_time === tb.end_time &&
          b.type === tb.type
      );
    };

    const blocksToInsert = DEFAULT_TIME_BLOCKS.filter((b) => !isMatchingExisting(b)).map((b) => ({
      id: b.id,
      user_id: userId,
      weekday: b.weekday,
      start_time: b.start_time,
      end_time: b.end_time,
      type: b.type,
      label: b.label,
      default_category: b.default_category || null,
      is_fixed: b.is_fixed ?? false,
      is_active: b.is_active ?? true,
      override_date: b.override_date || null,
    }));

    if (blocksToInsert.length > 0) {
      const { error: insertTbErr } = await supabase
        .from("time_blocks")
        .upsert(blocksToInsert, { onConflict: "id", ignoreDuplicates: true });

      if (insertTbErr) {
        console.error("[EnsureStructure] Failed to insert time_blocks:", insertTbErr.message);
        details.push(`time_blocks insert error: ${insertTbErr.message}`);
      } else {
        details.push(
          `Seeded ${blocksToInsert.length} missing weekly time blocks (kept ${currentBlocks.length} existing).`
        );
      }
    }

    // -------------------------------------------------------------
    // Final Verification Counts
    // -------------------------------------------------------------
    const [c1, c2, c3, c4, c5, c6, c7, c8] = await Promise.all([
      supabase.from("categories").select("*", { count: "exact", head: true }).or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("courses").select("*", { count: "exact", head: true }).or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("class_schedule").select("*", { count: "exact", head: true }).or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("academic_events").select("*", { count: "exact", head: true }).or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("recurring_rules").select("*", { count: "exact", head: true }).or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("cyber_topics").select("*", { count: "exact", head: true }).or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from("user_settings").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("time_blocks").select("*", { count: "exact", head: true }).or(`user_id.eq.${userId},user_id.is.null`),
    ]);

    counts.categories = c1.count || 0;
    counts.courses = c2.count || 0;
    counts.class_schedule = c3.count || 0;
    counts.academic_events = c4.count || 0;
    counts.recurring_rules = c5.count || 0;
    counts.cyber_topics = c6.count || 0;
    counts.user_settings = c7.count || 0;
    counts.time_blocks = c8.count || 0;

    return {
      success: true,
      existingTimeBlocksRow,
      counts,
      details,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ensure structure failed";
    console.error("[EnsureStructure] Exception:", msg);
    return {
      success: false,
      existingTimeBlocksRow,
      counts,
      details,
      error: msg,
    };
  }
}
