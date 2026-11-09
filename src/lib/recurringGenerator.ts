import {
  RecurringRule,
  Mission,
  TimeBlock,
  AcademicEvent,
  CyberTopic,
  Course,
  TuitionException,
} from "@/types/database";
import { resolveDaySchedule } from "./scheduleResolver";

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface GenerateAutoMissionsParams {
  date: Date;
  rules: RecurringRule[];
  existingMissions: Mission[];
  defaultBlocks: TimeBlock[];
  academicEvents: AcademicEvent[];
  nextCyberTopicTitle?: string;
  nextCyberTopic?: CyberTopic;
  activeMissionCap?: number;
}

/**
 * Checks if a recurring rule is active and matches the day-of-week / frequency requirements for the given date.
 */
export function isRuleScheduledForDate(rule: RecurringRule, date: Date): boolean {
  if (rule.is_active === false) return false;

  const dayOfWeekIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

  if (rule.frequency === "daily") {
    // If days_of_week is specified, enforce it; otherwise, every day
    if (rule.days_of_week && rule.days_of_week.length > 0) {
      return rule.days_of_week.includes(dayOfWeekIndex);
    }
    return true;
  }

  if (rule.frequency === "weekly") {
    // Check specific days of week
    if (rule.days_of_week && rule.days_of_week.length > 0) {
      return rule.days_of_week.includes(dayOfWeekIndex);
    }
    return false;
  }

  if (rule.frequency === "custom_n_days") {
    const interval = Math.max(1, rule.interval || 1);
    // Interval check based on epoch day
    const epochDay = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    return epochDay % interval === 0;
  }

  return false;
}

/**
 * Idempotence check: ensures no duplicate mission exists for the given rule and date.
 */
export function isMissionAlreadyGenerated(
  existingMissions: Mission[],
  ruleId: string,
  dateStr: string,
  specificKey?: string
): boolean {
  return existingMissions.some((m) => {
    // Check by recurring rule id and auto generated date
    if (m.recurring_rule_id === ruleId) {
      if (m.auto_generated_date === dateStr) {
        if (!specificKey) return true;
        // If specific key is provided (e.g. course code/name in title)
        return m.title.toLowerCase().includes(specificKey.toLowerCase());
      }
      // Also check if deadline starts with the same date
      if (m.deadline && m.deadline.startsWith(dateStr)) {
        if (!specificKey) return true;
        return m.title.toLowerCase().includes(specificKey.toLowerCase());
      }
    }
    // Also guard by title + date if codename / title matches
    if (specificKey && m.title.toLowerCase().includes(specificKey.toLowerCase())) {
      if (m.deadline && m.deadline.startsWith(dateStr)) return true;
      if (m.created_at && m.created_at.startsWith(dateStr)) return true;
    }
    return false;
  });
}

/**
 * Helper to compute tuition deadline: 2 hours prior to slot start time.
 * e.g. "18:00" -> "16:00"
 */
export function calculateTuitionDeadline(tuitionStartTime: string, dateStr: string): string {
  const parts = tuitionStartTime.split(":");
  let hour = parseInt(parts[0], 10);
  const min = parts[1] || "00";

  hour = Math.max(0, hour - 2);
  const hourStr = String(hour).padStart(2, "0");
  return `${dateStr}T${hourStr}:${min}:00`;
}

/**
 * Core daily auto-missions generator. Runs on app open or scheduled trigger.
 * Fully idempotent, respects academic calendar overrides and holidays, and respects active mission cap.
 */
export function generateDailyAutoMissions({
  date,
  rules,
  existingMissions,
  defaultBlocks,
  academicEvents,
  nextCyberTopicTitle,
  nextCyberTopic,
  activeMissionCap = 5,
}: GenerateAutoMissionsParams): {
  newMissions: Mission[];
  updatedRules: RecurringRule[];
} {
  const dateStr = toDateString(date);
  const resolved = resolveDaySchedule(date, defaultBlocks, academicEvents);
  const resolvedBlocks = resolved.blocks || [];

  const generatedMissions: Mission[] = [];
  const updatedRules = rules.map((r) => ({ ...r }));

  // Helper to count active missions for today
  let currentActiveTodayCount = existingMissions.filter(
    (m) =>
      m.status === "active" &&
      ((m.deadline && m.deadline.startsWith(dateStr)) ||
        (m.created_at && m.created_at.startsWith(dateStr)))
  ).length;

  for (const rule of updatedRules) {
    if (!rule.is_active) continue;

    switch (rule.rule_type) {
      // 1. CLASS REVIEW: Create "Review lecture: <course>" for each resolved class today
      case "class_review": {
        if (resolved.isHoliday) continue;
        const classBlocks = resolvedBlocks.filter(
          (b) => b.type === "class"
        );

        for (const block of classBlocks) {
          // Clean course name: "Economics (406)" -> "Economics"
          const courseCleanName = block.label.replace(/\s*\(\d+\)/, "").trim();

          if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr, courseCleanName)) {
            continue;
          }

          // Check if we already created one in this run
          if (
            generatedMissions.some(
              (m) => m.recurring_rule_id === rule.id && m.title.includes(courseCleanName)
            )
          ) {
            continue;
          }

          const shouldBeActive = currentActiveTodayCount < activeMissionCap;
          if (shouldBeActive) currentActiveTodayCount++;

          const mission: Mission = {
            id: `auto-${rule.id}-${dateStr}-${courseCleanName.toLowerCase().replace(/\s+/g, "-")}`,
            title: `Review lecture: ${courseCleanName}`,
            codename: `AUTO-REV-${courseCleanName.slice(0, 4).toUpperCase()}`,
            category_id: block.default_category || rule.category_id || "cat-1",
            priority: "medium",
            deadline: `${dateStr}T23:59:00`,
            notes: `Automated review for ${block.label}${block.isOnline ? " (Online Session)" : ""}. Review slides, lecture log, and key topics.`,
            status: shouldBeActive ? "active" : "locked",
            xp: rule.xp || 40,
            recurring_rule_id: rule.id,
            auto_generated_date: dateStr,
            is_auto_scheduled: true,
            created_at: new Date().toISOString(),
          };

          generatedMissions.push(mission);
        }
        rule.last_generated_date = dateStr;
        break;
      }

      // 2. TUITION PREP: "Prepare tuition lesson" in nearest free window before tuition slot
      case "tuition_prep": {
        const tuitionBlocks = resolvedBlocks.filter(
          (b) => b.type === "tuition" && !b.isCancelled && !b.isSkipped
        );
        if (tuitionBlocks.length === 0) continue;

        if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr)) {
          continue;
        }

        const firstTuition = tuitionBlocks[0];
        const deadline = calculateTuitionDeadline(firstTuition.start_time, dateStr);

        const shouldBeActive = currentActiveTodayCount < activeMissionCap;
        if (shouldBeActive) currentActiveTodayCount++;

        // Schedule in the nearest free time BEFORE the tuition slot (ending at least 15 min before tuition)
        const [tH, tM] = firstTuition.start_time.split(":").map(Number);
        const tuitionStartMin = (tH || 18) * 60 + (tM || 0);
        const prepEndMin = Math.max(9 * 60, tuitionStartMin - 15);
        const prepStartMin = prepEndMin - 45;

        const psH = Math.floor(prepStartMin / 60);
        const psM = prepStartMin % 60;
        const peH = Math.floor(prepEndMin / 60);
        const peM = prepEndMin % 60;
        const scheduledStart = `${dateStr}T${String(psH).padStart(2, "0")}:${String(psM).padStart(2, "0")}:00`;
        const scheduledEnd = `${dateStr}T${String(peH).padStart(2, "0")}:${String(peM).padStart(2, "0")}:00`;

        const mission: Mission = {
          id: `auto-${rule.id}-${dateStr}`,
          title: "Prepare tuition lesson",
          codename: `AUTO-TUIT-${dateStr.slice(5).replace("-", "")}`,
          category_id: "cat-11", // Tuition category
          priority: "high",
          deadline,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          notes: "Review teaching materials, problem sets, and homework solutions before session.",
          status: shouldBeActive ? "active" : "locked",
          xp: rule.xp || 35,
          recurring_rule_id: rule.id,
          auto_generated_date: dateStr,
          is_auto_scheduled: true,
          created_at: new Date().toISOString(),
        };

        generatedMissions.push(mission);
        rule.last_generated_date = dateStr;
        break;
      }

      // 3. DAILY CP: "Solve 1 Codeforces problem"
      case "cp_daily": {
        if (!isRuleScheduledForDate(rule, date)) continue;
        if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr)) continue;

        const time = rule.time_of_day || "21:00";
        const shouldBeActive = currentActiveTodayCount < activeMissionCap;
        if (shouldBeActive) currentActiveTodayCount++;

        const mission: Mission = {
          id: `auto-${rule.id}-${dateStr}`,
          title: "Solve 1 Codeforces problem",
          codename: `AUTO-CF-${dateStr.slice(5).replace("-", "")}`,
          category_id: "cat-10", // Codeforces category
          priority: "medium",
          deadline: `${dateStr}T${time}:00`,
          notes: "Daily competitive programming practice. Pick a problem in CP/SQL block and log verdict.",
          status: shouldBeActive ? "active" : "locked",
          xp: rule.xp || 30,
          recurring_rule_id: rule.id,
          auto_generated_date: dateStr,
          is_auto_scheduled: true,
          created_at: new Date().toISOString(),
        };

        generatedMissions.push(mission);
        rule.last_generated_date = dateStr;
        break;
      }

      // 4. CYBERSECURITY: Daily Cyber mission = next topic's lesson or hands-on task with link
      case "cyber_daily": {
        if (!isRuleScheduledForDate(rule, date)) continue;
        if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr)) continue;

        const time = rule.time_of_day || "17:30";
        const shouldBeActive = currentActiveTodayCount < activeMissionCap;
        if (shouldBeActive) currentActiveTodayCount++;

        let missionTitle = "Cybersecurity: 30-60 min";
        let missionNotes = "Progress on cybersecurity roadmap. Complete hands-on lab or reading.";

        if (nextCyberTopic) {
          if (nextCyberTopic.status === "learning" && nextCyberTopic.hands_on_task) {
            // Topic is in progress: generate the hands-on lab task!
            const platformTag = nextCyberTopic.hands_on_platform ? `[${nextCyberTopic.hands_on_platform}] ` : "";
            missionTitle = `Cyber Lab: ${platformTag}${nextCyberTopic.hands_on_task}`;
            const labUrl = nextCyberTopic.hands_on_url ? ` Lab link: ${nextCyberTopic.hands_on_url}.` : "";
            missionNotes = `Hands-on practical lab for "${nextCyberTopic.title}".${labUrl} Log your one-line takeaway upon completion.`;
          } else {
            // Topic is not started: generate the study lesson!
            missionTitle = `Cyber Lesson: ${nextCyberTopic.title}`;
            const firstLink = nextCyberTopic.learning_links?.[0]?.url;
            const linkStr = firstLink ? ` Reading: ${firstLink}.` : (nextCyberTopic.hands_on_url ? ` Lab link: ${nextCyberTopic.hands_on_url}.` : "");
            const goalStr = nextCyberTopic.goal ? ` Goal: ${nextCyberTopic.goal}.` : "";
            missionNotes = `Study topic.${goalStr}${linkStr} Next step: Complete required hands-on lab.`;
          }
        } else if (nextCyberTopicTitle) {
          missionTitle = `Cyber Lesson: ${nextCyberTopicTitle}`;
          missionNotes = `Progress on cybersecurity roadmap topic: ${nextCyberTopicTitle}. Complete hands-on lab and log takeaway.`;
        }

        const mission: Mission = {
          id: `auto-${rule.id}-${dateStr}`,
          title: missionTitle,
          codename: `AUTO-CYBER-${dateStr.slice(5).replace("-", "")}`,
          category_id: "cat-7", // Cybersecurity category
          priority: "medium",
          deadline: `${dateStr}T${time}:00`,
          notes: missionNotes,
          status: shouldBeActive ? "active" : "locked",
          xp: rule.xp || 40,
          recurring_rule_id: rule.id,
          auto_generated_date: dateStr,
          is_auto_scheduled: true,
          created_at: new Date().toISOString(),
        };

        generatedMissions.push(mission);
        rule.last_generated_date = dateStr;
        break;
      }

      // 5. WEEKLY REVIEW: Friday 3:00 PM
      case "weekly_review": {
        if (!isRuleScheduledForDate(rule, date)) continue;
        if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr)) continue;

        const time = rule.time_of_day || "15:00";
        const shouldBeActive = currentActiveTodayCount < activeMissionCap;
        if (shouldBeActive) currentActiveTodayCount++;

        const mission: Mission = {
          id: `auto-${rule.id}-${dateStr}`,
          title: "Weekly review",
          codename: `AUTO-REV-WK`,
          category_id: "cat-1",
          priority: "high",
          deadline: `${dateStr}T${time}:00`,
          notes: "Audit weekly completions, log reflections, check missed lectures, and plan next week.",
          status: shouldBeActive ? "active" : "locked",
          xp: rule.xp || 50,
          recurring_rule_id: rule.id,
          auto_generated_date: dateStr,
          is_auto_scheduled: true,
          created_at: new Date().toISOString(),
        };

        generatedMissions.push(mission);
        rule.last_generated_date = dateStr;
        break;
      }

      // 6. RESEARCH PAPER: "Read 1 research paper" (once or twice a week)
      case "paper_weekly": {
        if (!isRuleScheduledForDate(rule, date)) continue;
        if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr)) continue;

        const time = rule.time_of_day || "16:00";
        const shouldBeActive = currentActiveTodayCount < activeMissionCap;
        if (shouldBeActive) currentActiveTodayCount++;

        const mission: Mission = {
          id: `auto-${rule.id}-${dateStr}`,
          title: "Read 1 research paper",
          codename: `AUTO-PAPER-${dateStr.slice(5).replace("-", "")}`,
          category_id: "cat-9", // Research Papers category
          priority: "medium",
          deadline: `${dateStr}T${time}:00`,
          notes: "Read target paper and record 3-line summary + key takeaway in Research Papers dossier.",
          status: shouldBeActive ? "active" : "locked",
          xp: rule.xp || 60,
          recurring_rule_id: rule.id,
          auto_generated_date: dateStr,
          is_auto_scheduled: true,
          created_at: new Date().toISOString(),
        };

        generatedMissions.push(mission);
        rule.last_generated_date = dateStr;
        break;
      }

      // 7. SIDE PROJECT STEP: "Side project: one small step"
      case "project_step": {
        if (!isRuleScheduledForDate(rule, date)) continue;
        if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr)) continue;

        const time = rule.time_of_day || "18:30";
        const shouldBeActive = currentActiveTodayCount < activeMissionCap;
        if (shouldBeActive) currentActiveTodayCount++;

        const mission: Mission = {
          id: `auto-${rule.id}-${dateStr}`,
          title: "Side project: one small step",
          codename: `AUTO-PROJ-${dateStr.slice(5).replace("-", "")}`,
          category_id: "cat-8", // Side Projects category
          priority: "high",
          deadline: `${dateStr}T${time}:00`,
          notes: "Advance active side project with one committed unit of work.",
          status: shouldBeActive ? "active" : "locked",
          xp: rule.xp || 50,
          recurring_rule_id: rule.id,
          auto_generated_date: dateStr,
          is_auto_scheduled: true,
          created_at: new Date().toISOString(),
        };

        generatedMissions.push(mission);
        rule.last_generated_date = dateStr;
        break;
      }

      // 8. CUSTOM RULE: user-defined daily/weekly/every N days
      case "custom": {
        if (!isRuleScheduledForDate(rule, date)) continue;
        if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr)) continue;

        const time = rule.time_of_day || "22:00";
        const shouldBeActive = currentActiveTodayCount < activeMissionCap;
        if (shouldBeActive) currentActiveTodayCount++;

        const mission: Mission = {
          id: `auto-${rule.id}-${dateStr}`,
          title: rule.title,
          codename: `AUTO-CUST-${rule.id.slice(-4).toUpperCase()}`,
          category_id: rule.category_id || "cat-1",
          priority: rule.priority || "medium",
          deadline: `${dateStr}T${time}:00`,
          notes: `Custom recurring mission (${rule.frequency}).`,
          status: shouldBeActive ? "active" : "locked",
          xp: rule.xp || 50,
          recurring_rule_id: rule.id,
          auto_generated_date: dateStr,
          is_auto_scheduled: true,
          created_at: new Date().toISOString(),
        };

        generatedMissions.push(mission);
        rule.last_generated_date = dateStr;
        break;
      }
    }
  }

  return { newMissions: generatedMissions, updatedRules };
}

export interface GenerateQuizPrepMissionsParams {
  academicEvents: AcademicEvent[];
  courses?: Course[];
  timeBlocks: TimeBlock[];
  existingMissions: Mission[];
  todayDate?: Date;
  tuitionExceptions?: TuitionException[];
}

/**
 * Creates CT / Quiz prep missions 5, 3, and 1 day before each quiz event.
 * Scheduled into that course's study window if free, otherwise the next free slot.
 * Deterministic IDs prevent duplicates on reload. Does not generate missions in the past.
 */
export function generateQuizPrepMissions({
  academicEvents,
  courses = [],
  timeBlocks,
  existingMissions,
  todayDate = new Date(),
  tuitionExceptions = [],
}: GenerateQuizPrepMissionsParams): Mission[] {
  const todayStr = toDateString(todayDate);
  const quizEvents = academicEvents.filter((e) => e.type === "quiz" || e.type === "ct");
  const newPrepMissions: Mission[] = [];

  const OFFSETS: { days: number; suffix: string; priority: "urgent" | "high" | "medium" }[] = [
    { days: 5, suffix: "revise syllabus", priority: "medium" },
    { days: 3, suffix: "practice questions", priority: "high" },
    { days: 1, suffix: "final revision", priority: "urgent" },
  ];

  for (const q of quizEvents) {
    let courseId: string | null = null;
    let courseName = "";
    if (q.details) {
      try {
        const p = JSON.parse(q.details);
        courseId = p.course_id || null;
        courseName = p.course_name || "";
      } catch {}
    }

    const matchedCourse = courses.find(
      (c) =>
        c.id === courseId ||
        q.title.toLowerCase().includes(c.name.toLowerCase()) ||
        q.title.toLowerCase().includes(c.code.toLowerCase())
    );

    const rawPrefix = q.title.replace(/\s*CT.*$/i, "").replace(/\s*Quiz.*$/i, "").trim();
    const courseLabel = matchedCourse?.name || courseName || rawPrefix || "Course";

    for (const offset of OFFSETS) {
      const qDate = new Date(`${q.date}T00:00:00`);
      const prepDate = new Date(qDate.getTime() - offset.days * 86400 * 1000);
      const prepDateStr = toDateString(prepDate);

      // Don't create prep missions in the past
      if (prepDateStr < todayStr) {
        continue;
      }

      // Deterministic ID (no duplicates on reload)
      const missionId = `auto-ct-prep-${q.id}-${offset.days}`;
      if (
        existingMissions.some((m) => m.id === missionId) ||
        newPrepMissions.some((m) => m.id === missionId)
      ) {
        continue;
      }

      const missionTitle = `${courseLabel} CT: ${offset.suffix}`;

      // Resolve schedule on prepDate to find that course's Study window if free
      const daySchedule = resolveDaySchedule(
        prepDate,
        timeBlocks,
        academicEvents,
        [...existingMissions, ...newPrepMissions],
        tuitionExceptions
      );

      // 1. Look for that course's study block
      const courseCatId = matchedCourse?.category_id;
      const studyBlock = daySchedule.blocks.find((b) => {
        if (b.type !== "study" || b.isSkipped || b.isCancelled) return false;
        if (courseCatId && b.default_category === courseCatId) return true;
        const l = b.label.toLowerCase();
        if (matchedCourse && l.includes(matchedCourse.name.toLowerCase())) return true;
        if (courseLabel && l.includes(courseLabel.toLowerCase())) return true;
        if (
          (courseLabel.toLowerCase().includes("os") || courseLabel.toLowerCase().includes("operating")) &&
          (l.includes("os") || l.includes("operating"))
        ) {
          return true;
        }
        if (
          (courseLabel.toLowerCase().includes("stat") || courseLabel.toLowerCase().includes("math")) &&
          (l.includes("math") || l.includes("stat"))
        ) {
          return true;
        }
        return false;
      });

      let chosenStart = "15:00";
      let chosenEnd = "15:45";

      const dayMissions = [...existingMissions, ...newPrepMissions].filter(
        (m) => m.scheduled_start && m.scheduled_start.startsWith(prepDateStr)
      );

      if (studyBlock) {
        const [sh, sm] = studyBlock.start_time.split(":").map(Number);
        const [eh, em] = studyBlock.end_time.split(":").map(Number);
        const bStartMin = (sh || 0) * 60 + (sm || 0);
        const bEndMin = (eh || 0) * 60 + (em || 0);

        // Check if existing mission overlaps this study window
        const isOccupied = dayMissions.some((m) => {
          const ms = new Date(m.scheduled_start!);
          const mStart = ms.getHours() * 60 + ms.getMinutes();
          const mEnd = m.scheduled_end
            ? new Date(m.scheduled_end).getHours() * 60 + new Date(m.scheduled_end).getMinutes()
            : mStart + 45;
          return Math.max(bStartMin, mStart) < Math.min(bEndMin, mEnd);
        });

        if (!isOccupied) {
          const durMin = Math.min(60, Math.max(45, bEndMin - bStartMin));
          const endH = Math.floor((bStartMin + durMin) / 60);
          const endM = (bStartMin + durMin) % 60;
          chosenStart = studyBlock.start_time;
          chosenEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
        } else {
          // Window occupied, find next free slot
          const slot = findNextFreeSlotForDate(daySchedule.blocks, dayMissions);
          chosenStart = slot.start;
          chosenEnd = slot.end;
        }
      } else {
        // No study block for this course, find next free slot
        const slot = findNextFreeSlotForDate(daySchedule.blocks, dayMissions);
        chosenStart = slot.start;
        chosenEnd = slot.end;
      }

      const mission: Mission = {
        id: missionId,
        title: missionTitle,
        codename: `CT-PREP-${offset.days}D`,
        category_id: matchedCourse?.category_id || "cat-1",
        priority: offset.priority,
        deadline: `${q.date}T23:59:00`,
        scheduled_start: `${prepDateStr}T${chosenStart}:00`,
        scheduled_end: `${prepDateStr}T${chosenEnd}:00`,
        notes: `Automated preparation directive for ${q.title} (${offset.suffix}). Scheduled ${offset.days} days before event. Associated event ID: ${q.id}`,
        status: "active",
        xp: 40,
        recurring_rule_id: q.id,
        auto_generated_date: prepDateStr,
        is_auto_scheduled: true,
        created_at: new Date().toISOString(),
      };

      newPrepMissions.push(mission);
    }
  }

  return newPrepMissions;
}

function findNextFreeSlotForDate(
  blocks: { start_time: string; end_time: string; type: string; isSkipped?: boolean; isCancelled?: boolean }[],
  dayMissions: Mission[]
): { start: string; end: string } {
  // Candidate start minutes from 10:00 to 20:30 every 30 minutes
  const candidates: number[] = [
    10 * 60,
    10 * 60 + 30,
    11 * 60,
    14 * 60,
    14 * 60 + 30,
    15 * 60,
    15 * 60 + 30,
    16 * 60,
    16 * 60 + 30,
    19 * 60 + 30,
    20 * 60,
    20 * 60 + 30,
  ];

  for (const candStart of candidates) {
    const candEnd = candStart + 45;

    // Check conflict with fixed class/tuition blocks
    const blockConflict = blocks.some((b) => {
      if (b.isSkipped || b.isCancelled) return false;
      if (b.type !== "class" && b.type !== "tuition") return false;
      const [sh, sm] = b.start_time.split(":").map(Number);
      const [eh, em] = b.end_time.split(":").map(Number);
      const bs = (sh || 0) * 60 + (sm || 0);
      const be = (eh || 0) * 60 + (em || 0);
      return Math.max(candStart, bs) < Math.min(candEnd, be);
    });
    if (blockConflict) continue;

    // Check conflict with existing missions
    const missionConflict = dayMissions.some((m) => {
      if (!m.scheduled_start) return false;
      const ms = new Date(m.scheduled_start);
      const s = ms.getHours() * 60 + ms.getMinutes();
      const e = m.scheduled_end
        ? new Date(m.scheduled_end).getHours() * 60 + new Date(m.scheduled_end).getMinutes()
        : s + 45;
      return Math.max(candStart, s) < Math.min(candEnd, e);
    });
    if (missionConflict) continue;

    const shh = Math.floor(candStart / 60);
    const smm = candStart % 60;
    const ehh = Math.floor(candEnd / 60);
    const emm = candEnd % 60;
    return {
      start: `${String(shh).padStart(2, "0")}:${String(smm).padStart(2, "0")}`,
      end: `${String(ehh).padStart(2, "0")}:${String(emm).padStart(2, "0")}`,
    };
  }

  return { start: "15:00", end: "15:45" };
}
