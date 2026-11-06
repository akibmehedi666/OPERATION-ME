import {
  RecurringRule,
  Mission,
  TimeBlock,
  AcademicEvent,
  CyberTopic,
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

      // 2. TUITION PREP: "Prepare tuition lesson" 2 hours before tuition slot
      case "tuition_prep": {
        const tuitionBlocks = resolvedBlocks.filter((b) => b.type === "tuition");
        if (tuitionBlocks.length === 0) continue;

        if (isMissionAlreadyGenerated(existingMissions, rule.id, dateStr)) {
          continue;
        }

        const firstTuition = tuitionBlocks[0];
        const deadline = calculateTuitionDeadline(firstTuition.start_time, dateStr);

        const shouldBeActive = currentActiveTodayCount < activeMissionCap;
        if (shouldBeActive) currentActiveTodayCount++;

        const mission: Mission = {
          id: `auto-${rule.id}-${dateStr}`,
          title: "Prepare tuition lesson",
          codename: `AUTO-TUIT-${dateStr.slice(5).replace("-", "")}`,
          category_id: "cat-11", // Tuition category
          priority: "high",
          deadline,
          notes: "Review teaching materials, problem sets, and homework solutions 2 hours before session.",
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
