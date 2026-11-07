import {
  ClassScheduleItem,
  AcademicEvent,
  Mission,
  NotificationSettings,
} from "@/types/database";

export interface NotificationAlert {
  id: string;
  type:
    | "class"
    | "tuition"
    | "morning_digest"
    | "streak_defense"
    | "exam_warning"
    | "payment_warning";
  title: string;
  message: string;
  severity: "info" | "warning" | "urgent";
  dueAt: Date;
}

/**
 * Evaluates whether a given timestamp falls within the user-defined quiet hours.
 * Handles overnight time ranges (e.g. 23:00 to 07:00).
 */
export function isQuietHours(date: Date, settings: NotificationSettings): boolean {
  if (!settings.quiet_hours_enabled) return false;

  const currentHours = date.getHours();
  const currentMinutes = date.getMinutes();
  const currentTotalMins = currentHours * 60 + currentMinutes;

  const [startH, startM] = settings.quiet_hours_start.split(":").map(Number);
  const [endH, endM] = settings.quiet_hours_end.split(":").map(Number);
  const startTotalMins = startH * 60 + startM;
  const endTotalMins = endH * 60 + endM;

  if (startTotalMins <= endTotalMins) {
    // Normal same-day range (e.g. 14:00 to 16:00)
    return currentTotalMins >= startTotalMins && currentTotalMins < endTotalMins;
  } else {
    // Overnight range (e.g. 23:00 to 07:00)
    return currentTotalMins >= startTotalMins || currentTotalMins < endTotalMins;
  }
}

/**
 * Returns all notification alerts due at the current moment given schedule, events, missions, and settings.
 */
export function getDueNotifications(
  now: Date,
  options: {
    schedule: ClassScheduleItem[];
    events: AcademicEvent[];
    missions: Mission[];
    settings: NotificationSettings;
  }
): NotificationAlert[] {
  const { schedule, events, missions, settings } = options;
  const alerts: NotificationAlert[] = [];

  const inQuiet = isQuietHours(now, settings);
  if (inQuiet) return [];

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
  const currentDay = daysOfWeek[now.getDay()];
  const todayStr = now.toISOString().split("T")[0];

  const isHolidayToday = events.some((e) => {
    if (e.type !== "holiday") return false;
    if (e.end_date) return todayStr >= e.date && todayStr <= e.end_date;
    return e.date === todayStr;
  });

  const classOverrideEvent = events.find((e) => {
    if (e.type !== "class_override") return false;
    if (e.end_date) return todayStr >= e.date && todayStr <= e.end_date;
    return e.date === todayStr;
  });

  let effectiveScheduleDay: typeof currentDay = currentDay;
  if (classOverrideEvent) {
    try {
      if (classOverrideEvent.details) {
        const parsed = JSON.parse(classOverrideEvent.details);
        if (parsed.overrideWeekday) effectiveScheduleDay = parsed.overrideWeekday;
      }
    } catch {}
  }

  // 1. CLASS REMINDERS (15 minutes before class start - skips holidays, respects overrides)
  if (settings.class_reminder && !isHolidayToday) {
    const todayClasses = schedule.filter(
      (s) => s.day_of_week === effectiveScheduleDay && s.type === "class"
    );

    todayClasses.forEach((item) => {
      const [cH, cM] = item.start_time.split(":").map(Number);
      const classStart = new Date(now);
      classStart.setHours(cH, cM, 0, 0);

      const diffMs = classStart.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Trigger if class starts in 1 to 15 minutes
      if (diffMins >= 0 && diffMins <= 15) {
        alerts.push({
          id: `class-${item.id}-${todayStr}`,
          type: "class",
          title: `Class in ${diffMins === 0 ? "moments" : `${diffMins} min`}: ${item.course_name}`,
          message: `Scheduled at ${item.start_time}${item.room ? ` in Room ${item.room}` : ""}. Review past lecture notes!`,
          severity: "urgent",
          dueAt: now,
        });
      }
    });
  }

  // 2. TUITION REMINDER (1 hour before tuition slot)
  if (settings.tuition_reminder) {
    const todayTuitions = schedule.filter(
      (s) => s.day_of_week === currentDay && s.type === "tuition"
    );

    todayTuitions.forEach((item) => {
      const [tH, tM] = item.start_time.split(":").map(Number);
      const tuitionStart = new Date(now);
      tuitionStart.setHours(tH, tM, 0, 0);

      const diffMs = tuitionStart.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Trigger if tuition starts in 15 to 60 minutes
      if (diffMins >= 0 && diffMins <= 60) {
        alerts.push({
          id: `tuition-${item.id}-${todayStr}`,
          type: "tuition",
          title: `Tuition in ${diffMins} min`,
          message: `Slot starts at ${item.start_time}. Finalize exercise sets and student lesson materials.`,
          severity: "warning",
          dueAt: now,
        });
      }
    });
  }

  // 3. MORNING INTELLIGENCE DIGEST (At configured time e.g. 08:00 AM)
  if (settings.morning_digest) {
    const [digestH, digestM] = (settings.morning_digest_time || "08:00").split(":").map(Number);
    const isDigestHour = now.getHours() === digestH && Math.abs(now.getMinutes() - digestM) <= 30;

    if (isDigestHour) {
      const dayClasses = schedule.filter((s) => s.day_of_week === currentDay);
      const pendingTodayMissions = missions.filter(
        (m) => m.status !== "completed" && m.deadline?.startsWith(todayStr)
      );

      alerts.push({
        id: `digest-${todayStr}`,
        type: "morning_digest",
        title: "Morning Tactical Briefing",
        message: `${dayClasses.length} timetable slot${dayClasses.length === 1 ? "" : "s"} and ${pendingTodayMissions.length} directive${pendingTodayMissions.length === 1 ? "" : "s"} due today. Execute with precision.`,
        severity: "info",
        dueAt: now,
      });
    }
  }

  // 4. STREAK DEFENSE REMINDER (At 8:00 PM / 20:00 or later if 0 completions today)
  if (settings.streak_reminder) {
    if (now.getHours() >= 20) {
      const todayCompleted = missions.filter(
        (m) => m.status === "completed" && m.completed_at?.startsWith(todayStr)
      ).length;

      if (todayCompleted === 0) {
        alerts.push({
          id: `streak-defense-${todayStr}`,
          type: "streak_defense",
          title: "Streak Defense: Action Required",
          message: "Zero directives accomplished today. Complete at least 1 mission before midnight to defend your operational streak!",
          severity: "urgent",
          dueAt: now,
        });
      }
    }
  }

  // 5. EXAM & PAYMENT DEADLINES (3 days and 1 day before)
  if (settings.exam_reminder) {
    events.forEach((event) => {
      const eventDate = new Date(event.date);
      // Normalize to midnight for clean day difference
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const diffDays = Math.round((eventDateOnly.getTime() - nowDateOnly.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1 || diffDays === 3) {
        if (event.type === "exam") {
          alerts.push({
            id: `exam-${event.id}-${diffDays}d`,
            type: "exam_warning",
            title: `Exam in ${diffDays} day${diffDays === 1 ? "" : "s"}: ${event.title}`,
            message: `Official academic examination scheduled for ${event.date}. Intensify course study and revision.`,
            severity: diffDays === 1 ? "urgent" : "warning",
            dueAt: now,
          });
        } else if (event.type === "payment") {
          alerts.push({
            id: `payment-${event.id}-${diffDays}d`,
            type: "payment_warning",
            title: `Tuition Payment Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
            message: `${event.title} deadline is on ${event.date}. Settle financial clearance on time.`,
            severity: diffDays === 1 ? "urgent" : "warning",
            dueAt: now,
          });
        }
      }
    });
  }

  return alerts;
}

/**
 * Triggers native browser push notification if permissions are available.
 */
export function sendBrowserPush(alert: NotificationAlert): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    new Notification(alert.title, {
      body: alert.message,
      icon: "/favicon.ico",
    });
    return true;
  }

  return false;
}

