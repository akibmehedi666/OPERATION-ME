import { 
  TimeBlock, 
  AcademicEvent, 
  DayOfWeek, 
  ResolvedTimeBlock, 
  Mission,
  Category 
} from "@/types/database";
import { formatTime12, formatCountdown } from "@/lib/formatters";

export const WEEKDAY_ORDER: DayOfWeek[] = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];

export const DAY_JS_TO_WEEKDAY: Record<number, DayOfWeek> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

export const WEEKDAY_TO_NAME: Record<DayOfWeek, string> = {
  SAT: "Saturday",
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
};

export function formatDateKey(date: Date | string): string {
  if (typeof date === "string") {
    if (date.length === 10 && date.includes("-") && !date.includes("T")) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalTimeString(dateInput: Date | string): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function getWeekdayFromDate(date: Date | string): DayOfWeek {
  const d = typeof date === "string" ? new Date(`${date}T12:00:00`) : date;
  return DAY_JS_TO_WEEKDAY[d.getDay()] || "SAT";
}

/**
 * Deduplicates academic events on the same date with the same title or type
 */
export function deduplicateAcademicEvents(events: AcademicEvent[]): AcademicEvent[] {
  const seen = new Set<string>();
  const result: AcademicEvent[] = [];
  for (const ev of events) {
    const key = `${ev.date}_${ev.end_date || ""}_${ev.type}_${ev.title.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ev);
    }
  }
  return result;
}

/**
 * Returns all academic events active on a specific date (single date or within a range)
 */
export function getEventsForDate(dateInput: Date | string, events: AcademicEvent[]): AcademicEvent[] {
  const targetKey = formatDateKey(dateInput);
  const deduplicated = deduplicateAcademicEvents(events);

  return deduplicated.filter((ev) => {
    if (ev.end_date) {
      return targetKey >= ev.date && targetKey <= ev.end_date;
    }
    return ev.date === targetKey;
  });
}

export interface DayScheduleResolution {
  dateStr: string;
  weekday: DayOfWeek;
  blocks: ResolvedTimeBlock[];
  events: AcademicEvent[];
  badge?: string;
  isHoliday: boolean;
  isExam: boolean;
  isOverridden: boolean;
}

/**
 * Resolves each day according to the specification:
 * 1. Check academic_events overrides (holiday/suspension removes university classes;
 *    class_override replaces that day's university classes with the referenced weekday's classes labeled "Online").
 * 2. Tuition, projects, study, and breaks are preserved.
 * 3. Applies single-week / custom date-specific block overrides.
 * 4. Merges scheduled missions matching each block.
 */
export function resolveDaySchedule(
  dateInput: Date | string,
  weeklyBlocks: TimeBlock[],
  academicEvents: AcademicEvent[],
  missions: Mission[] = []
): DayScheduleResolution {
  const dateStr = formatDateKey(dateInput);
  const weekday = getWeekdayFromDate(dateInput);
  const events = getEventsForDate(dateStr, academicEvents);

  let isHoliday = false;
  let isExam = false;
  let isOverridden = false;
  let badge: string | undefined = undefined;

  // Check for holiday / suspension
  const holidayEvent = events.find((e) => e.type === "holiday");
  if (holidayEvent) {
    isHoliday = true;
    badge = holidayEvent.title.includes("Holiday") ? holidayEvent.title : `Holiday: ${holidayEvent.title}`;
  }

  // Check for exam
  const examEvent = events.find((e) => e.type === "exam");
  if (examEvent) {
    isExam = true;
    badge = badge || examEvent.title;
  }

  // Check for class override (e.g. Thursday follows Saturday class schedule online)
  const classOverrideEvent = events.find((e) => e.type === "class_override");
  let overrideWeekday: DayOfWeek | null = null;
  let isOnline = false;

  if (classOverrideEvent) {
    isOverridden = true;
    try {
      if (classOverrideEvent.details) {
        const parsed = JSON.parse(classOverrideEvent.details);
        overrideWeekday = parsed.overrideWeekday || null;
        isOnline = Boolean(parsed.isOnline);
      }
    } catch {
      // Fallback: look for weekday name in title
      const found = WEEKDAY_ORDER.find((w) =>
        classOverrideEvent.title.toUpperCase().includes(w)
      );
      if (found) {
        overrideWeekday = found;
        isOnline = true;
      }
    }
    badge = classOverrideEvent.title || (overrideWeekday ? `${overrideWeekday} schedule (Online)` : "Schedule Override");
  }

  // Gather base blocks for the day
  let dayBlocks: ResolvedTimeBlock[] = [];

  if (isHoliday) {
    // Holiday: all university class blocks are removed (replaced with free time)
    dayBlocks = weeklyBlocks
      .filter((b) => b.weekday === weekday && b.type !== "class" && !b.override_date)
      .map((b) => ({
        ...b,
        date: dateStr,
        isOverridden: false,
      }));
  } else if (isOverridden && overrideWeekday) {
    // Class override: remove today's classes and substitute the referenced weekday's classes
    const nonClassBlocks = weeklyBlocks
      .filter((b) => b.weekday === weekday && b.type !== "class" && !b.override_date)
      .map((b) => ({
        ...b,
        date: dateStr,
        isOverridden: false,
      }));

    const substitutedClasses = weeklyBlocks
      .filter((b) => b.weekday === overrideWeekday && b.type === "class" && !b.override_date)
      .map((b) => {
        const cleanLabel = b.label.replace(/\s*\(Online\)/i, "");
        return {
          ...b,
          id: `override-${dateStr}-${b.id}`,
          weekday: weekday,
          label: isOnline ? `${cleanLabel} (Online)` : cleanLabel,
          isOnline: isOnline,
          isOverridden: true,
          overrideReason: classOverrideEvent?.title || "Class Override",
          date: dateStr,
        };
      });

    dayBlocks = [...nonClassBlocks, ...substitutedClasses];
  } else {
    // Normal weekly template
    dayBlocks = weeklyBlocks
      .filter((b) => b.weekday === weekday && !b.override_date)
      .map((b) => ({
        ...b,
        date: dateStr,
        isOverridden: false,
      }));
  }

  // Add date-specific single-week overrides
  const dateSpecificOverrides = weeklyBlocks
    .filter((b) => b.override_date === dateStr)
    .map((b) => ({
      ...b,
      date: dateStr,
      isOverridden: true,
      overrideReason: "Custom Date Override",
    }));

  dayBlocks = [...dayBlocks, ...dateSpecificOverrides];

  // Sort chronologically by start_time
  dayBlocks.sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Attach scheduled missions to their respective blocks
  dayBlocks = dayBlocks.map((block) => {
    const scheduledMissions = missions.filter((m) => {
      if (m.scheduled_block_id === block.id) return true;
      if (m.scheduled_start) {
        const mDate = formatDateKey(m.scheduled_start);
        if (mDate === dateStr) {
          // Check if time overlaps or falls within block
          const mTime = getLocalTimeString(m.scheduled_start);
          if (mTime && mTime >= block.start_time && mTime < block.end_time) {
            return true;
          }
        }
      }
      return false;
    });

    return {
      ...block,
      scheduledMissions,
    };
  });

  return {
    dateStr,
    weekday,
    blocks: dayBlocks,
    events,
    badge,
    isHoliday,
    isExam,
    isOverridden,
  };
}

/**
 * Calculates start of the week (Saturday) for any given reference date
 */
export function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Our week starts on Saturday (day 6).
  // Days since Saturday:
  // Sat (6) -> 0
  // Sun (0) -> 1
  // Mon (1) -> 2
  // Tue (2) -> 3
  // Wed (3) -> 4
  // Thu (4) -> 5
  // Fri (5) -> 6
  const diff = (day + 1) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the 7 days of the week starting from Saturday
 */
export function getDaysOfWeek(weekStartDate: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export interface UpcomingEventWithCountdown {
  event: AcademicEvent;
  daysRemaining: number;
  countdownText: string;
  isToday: boolean;
  isUpcoming: boolean;
}

/**
 * Returns upcoming academic events sorted by proximity, with countdown
 */
export function getUpcomingAcademicEvents(
  events: AcademicEvent[],
  currentDate: Date = new Date(),
  limit: number = 3
): UpcomingEventWithCountdown[] {
  const currentKey = formatDateKey(currentDate);

  const futureEvents = events
    .filter((e) => (e.end_date || e.date) >= currentKey)
    .sort((a, b) => a.date.localeCompare(b.date));

  const results: UpcomingEventWithCountdown[] = [];

  for (const event of futureEvents) {
    const evDate = new Date(`${event.date}T00:00:00`);
    const today = new Date(`${currentKey}T00:00:00`);
    const diffMs = evDate.getTime() - today.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let countdownText = "";
    if (days < 0) {
      countdownText = "In progress";
    } else if (days === 0) {
      countdownText = "Today";
    } else if (days === 1) {
      countdownText = "Tomorrow";
    } else {
      countdownText = `in ${days} days`;
    }

    results.push({
      event,
      daysRemaining: days,
      countdownText,
      isToday: days === 0,
      isUpcoming: days > 0,
    });

    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Returns an urgent banner alert if an exam or payment deadline is within the next 7 days
 */
export function getUrgentAcademicNotice(
  events: AcademicEvent[],
  currentDate: Date = new Date()
): { event: AcademicEvent; message: string; urgency: "critical" | "warning" } | null {
  const currentKey = formatDateKey(currentDate);
  const today = new Date(`${currentKey}T00:00:00`);

  const urgentEvent = events.find((e) => {
    if (e.type !== "exam" && e.type !== "payment" && e.type !== "deadline") return false;
    const evDate = new Date(`${e.date}T00:00:00`);
    const diffDays = Math.round((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  if (!urgentEvent) return null;

  const evDate = new Date(`${urgentEvent.date}T00:00:00`);
  const diffDays = Math.round((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let timePhrase = "";
  if (diffDays === 0) timePhrase = "TODAY";
  else if (diffDays === 1) timePhrase = "TOMORROW";
  else timePhrase = `in ${diffDays} days`;

  const urgency = diffDays <= 3 ? "critical" : "warning";
  const label = urgentEvent.type === "payment" ? "Tuition Payment" : urgentEvent.type === "exam" ? "Examination" : "Critical Deadline";

  return {
    event: urgentEvent,
    message: `${label}: ${urgentEvent.title} is due ${timePhrase}.`,
    urgency,
  };
}

/**
 * Checks if Exam Mode is active (during exam range or within 14 days before exam start)
 */
export function isExamModeActive(
  events: AcademicEvent[],
  currentDate: Date = new Date()
): { active: boolean; examEvent?: AcademicEvent; daysUntil?: number } {
  const currentKey = formatDateKey(currentDate);
  const today = new Date(`${currentKey}T00:00:00`);

  for (const e of events) {
    if (e.type === "exam") {
      const examStart = new Date(`${e.date}T00:00:00`);
      const examEnd = e.end_date ? new Date(`${e.end_date}T23:59:59`) : new Date(`${e.date}T23:59:59`);

      if (today >= examStart && today <= examEnd) {
        return { active: true, examEvent: e, daysUntil: 0 };
      }

      const diffDays = Math.round((examStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 14) {
        return { active: true, examEvent: e, daysUntil: diffDays };
      }
    }
  }

  return { active: false };
}

/**
 * Generates Exam Prep mission suggestions for active university courses
 */
export function generateExamPrepMissions(
  categories: Category[],
  existingMissions: Mission[]
): Omit<Mission, "id" | "created_at">[] {
  const academicCategories = categories.filter((c) =>
    ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5", "cat-6"].includes(c.id)
  );

  const newMissions: Omit<Mission, "id" | "created_at">[] = [];

  for (const cat of academicCategories) {
    const exists = existingMissions.some(
      (m) =>
        m.category_id === cat.id &&
        m.title.toLowerCase().includes("exam prep") &&
        m.status !== "completed"
    );

    if (!exists) {
      newMissions.push({
        title: `Exam Prep: ${cat.name} Intensive Review`,
        codename: `OP-EXAM-${cat.codename?.split("-")[1] || "PREP"}`,
        category_id: cat.id,
        priority: "urgent",
        status: "active",
        xp: 100,
        notes: `Comprehensive syllabus and problem sets review for ${cat.name}.`,
        time_spent_minutes: 90,
      });
    }
  }

  return newMissions;
}

export interface UpcomingClassInfo {
  block: ResolvedTimeBlock;
  dateStr: string;
  isToday: boolean;
  startsAt: Date;
  endsAt: Date;
  diffMinutes: number;
  countdownText: string;
}

/**
 * Finds the next real university class, intelligently skipping holidays and class cancellations.
 */
export function getNextUpcomingClass(
  referenceDate: Date,
  weeklyBlocks: TimeBlock[],
  academicEvents: AcademicEvent[],
  maxDaysAhead: number = 14
): UpcomingClassInfo | null {
  const currentTotalMin = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const currentSec = referenceDate.getSeconds();

  for (let offset = 0; offset <= maxDaysAhead; offset++) {
    const targetDate = new Date(referenceDate);
    targetDate.setDate(targetDate.getDate() + offset);
    const dateStr = formatDateKey(targetDate);

    const resolution = resolveDaySchedule(targetDate, weeklyBlocks, academicEvents);
    // If holiday/suspended: university classes do not happen! Skip to the next day!
    if (resolution.isHoliday) continue;

    const classBlocks = resolution.blocks.filter((b) => b.type === "class");
    if (classBlocks.length === 0) continue;

    for (const b of classBlocks) {
      const [sh, sm] = b.start_time.split(":").map(Number);
      const [eh, em] = b.end_time.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (offset === 0) {
        // Today: only upcoming or currently in-progress
        if (currentTotalMin < endMin) {
          const startsAt = new Date(targetDate);
          startsAt.setHours(sh, sm, 0, 0);
          const endsAt = new Date(targetDate);
          endsAt.setHours(eh, em, 0, 0);
          const diffMinutes = Math.max(0, startMin - currentTotalMin);
          let countdownText = "";
          if (currentTotalMin >= startMin) {
            countdownText = "In progress now";
          } else {
            const diffSec = (startMin - currentTotalMin) * 60 - currentSec;
            countdownText = `Next in ${formatCountdown(diffSec)}`;
          }
          return {
            block: b,
            dateStr,
            isToday: true,
            startsAt,
            endsAt,
            diffMinutes,
            countdownText,
          };
        }
      } else {
        // Future day: first class of that valid day
        const startsAt = new Date(targetDate);
        startsAt.setHours(sh, sm, 0, 0);
        const endsAt = new Date(targetDate);
        endsAt.setHours(eh, em, 0, 0);
        const diffMs = startsAt.getTime() - referenceDate.getTime();
        const diffDays = offset;
        const time12 = formatTime12(b.start_time);
        const dayName = WEEKDAY_TO_NAME[resolution.weekday] || resolution.weekday;
        const countdownText =
          diffDays === 1
            ? `Tomorrow (${dayName}) at ${time12}`
            : `${dayName} at ${time12} (in ${diffDays} days)`;

        return {
          block: b,
          dateStr,
          isToday: false,
          startsAt,
          endsAt,
          diffMinutes: Math.floor(diffMs / 60000),
          countdownText,
        };
      }
    }
  }

  return null;
}

export interface OverlapConflict {
  hasConflict: boolean;
  conflictType?: "class" | "tuition" | "mission" | "block";
  conflictName?: string;
  conflictTimeRange?: string;
}

/**
 * Checks if a requested time range overlaps with any university class, tuition, or existing mission
 */
export function checkScheduleOverlap(
  dateInput: Date | string,
  startTime: string, // "HH:MM" e.g. "10:00"
  endTime: string,   // "HH:MM" e.g. "11:30"
  weeklyBlocks: TimeBlock[],
  academicEvents: AcademicEvent[],
  existingMissions: Mission[] = [],
  ignoreMissionId?: string
): OverlapConflict {
  if (!startTime || !endTime) return { hasConflict: false };

  const dateStr = formatDateKey(dateInput);
  const resolved = resolveDaySchedule(dateStr, weeklyBlocks, academicEvents);

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = (sh || 0) * 60 + (sm || 0);
  const endMin = (eh || 0) * 60 + (em || 0);

  if (endMin <= startMin) return { hasConflict: false };

  // 1. Check classes and tuition
  for (const b of resolved.blocks) {
    if (b.type === "class" || b.type === "tuition") {
      const [bsh, bsm] = b.start_time.split(":").map(Number);
      const [beh, bem] = b.end_time.split(":").map(Number);
      const bStartMin = (bsh || 0) * 60 + (bsm || 0);
      const bEndMin = (beh || 0) * 60 + (bem || 0);

      if (startMin < bEndMin && endMin > bStartMin) {
        return {
          hasConflict: true,
          conflictType: b.type,
          conflictName: b.label,
          conflictTimeRange: `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}`,
        };
      }
    }
  }

  // 2. Check other scheduled missions
  for (const m of existingMissions) {
    if (m.id === ignoreMissionId || m.status === "completed") continue;
    if (m.scheduled_start && m.scheduled_end) {
      const mDate = formatDateKey(m.scheduled_start);
      if (mDate === dateStr) {
        const mStartStr = getLocalTimeString(m.scheduled_start);
        const mEndStr = getLocalTimeString(m.scheduled_end);
        if (mStartStr && mEndStr) {
          const [msh, msm] = mStartStr.split(":").map(Number);
          const [meh, mem] = mEndStr.split(":").map(Number);
          const mStartMin = (msh || 0) * 60 + (msm || 0);
          const mEndMin = (meh || 0) * 60 + (mem || 0);

          if (startMin < mEndMin && endMin > mStartMin) {
            return {
              hasConflict: true,
              conflictType: "mission",
              conflictName: m.title,
              conflictTimeRange: `${formatTime12(mStartStr)} - ${formatTime12(mEndStr)}`,
            };
          }
        }
      }
    }
  }

  return { hasConflict: false };
}

