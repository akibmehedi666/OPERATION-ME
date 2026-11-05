import { 
  TimeBlock, 
  AcademicEvent, 
  DayOfWeek, 
  ResolvedTimeBlock, 
  Mission,
  Category 
} from "@/types/database";

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
    if (date.length === 10 && date.includes("-")) return date;
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekdayFromDate(date: Date | string): DayOfWeek {
  const d = typeof date === "string" ? new Date(`${date}T12:00:00`) : date;
  return DAY_JS_TO_WEEKDAY[d.getDay()] || "SAT";
}

/**
 * Returns all academic events active on a specific date (single date or within a range)
 */
export function getEventsForDate(dateInput: Date | string, events: AcademicEvent[]): AcademicEvent[] {
  const targetKey = formatDateKey(dateInput);

  return events.filter((ev) => {
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
          const mTime = m.scheduled_start.includes("T")
            ? m.scheduled_start.split("T")[1].slice(0, 5)
            : "";
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
