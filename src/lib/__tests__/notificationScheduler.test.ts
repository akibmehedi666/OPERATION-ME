import { describe, it, expect } from "vitest";
import {
  isQuietHours,
  getDueNotifications,
} from "../notificationScheduler";
import {
  DEFAULT_SCHEDULE,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_MISSIONS,
} from "../seeds";
import { AcademicEvent } from "@/types/database";

describe("Notification Scheduler & Alert Engine", () => {
  it("evaluates overnight quiet hours correctly", () => {
    const settings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      quiet_hours_enabled: true,
      quiet_hours_start: "23:00",
      quiet_hours_end: "07:00",
    };

    // 23:30 -> in quiet hours
    const lateNight = new Date("2026-11-07T23:30:00");
    expect(isQuietHours(lateNight, settings)).toBe(true);

    // 05:45 -> in quiet hours
    const earlyMorning = new Date("2026-11-07T05:45:00");
    expect(isQuietHours(earlyMorning, settings)).toBe(true);

    // 14:00 -> not in quiet hours
    const midday = new Date("2026-11-07T14:00:00");
    expect(isQuietHours(midday, settings)).toBe(false);
  });

  it("triggers class reminder 10 minutes before Saturday DIP class (09:50)", () => {
    // 2026-11-07 is Saturday
    const now = new Date("2026-11-07T09:40:00");

    const alerts = getDueNotifications(now, {
      schedule: DEFAULT_SCHEDULE,
      events: [],
      missions: [],
      settings: DEFAULT_NOTIFICATION_SETTINGS,
    });

    const classAlert = alerts.find((a) => a.type === "class");
    expect(classAlert).toBeDefined();
    expect(classAlert?.title).toContain("Class in 10 min: Digital Image Processing (DIP)");
  });

  it("triggers tuition reminder 45 minutes before Monday tuition (18:00)", () => {
    // 2026-11-02 is Monday
    const now = new Date("2026-11-02T17:15:00");

    const alerts = getDueNotifications(now, {
      schedule: DEFAULT_SCHEDULE,
      events: [],
      missions: [],
      settings: DEFAULT_NOTIFICATION_SETTINGS,
    });

    const tuitionAlert = alerts.find((a) => a.type === "tuition");
    expect(tuitionAlert).toBeDefined();
    expect(tuitionAlert?.title).toContain("Tuition in 45 min");
  });

  it("triggers morning intelligence briefing at 8:00 AM", () => {
    const now = new Date("2026-11-07T08:05:00");

    const alerts = getDueNotifications(now, {
      schedule: DEFAULT_SCHEDULE,
      events: [],
      missions: DEFAULT_MISSIONS,
      settings: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        morning_digest: true,
        morning_digest_time: "08:00",
      },
    });

    const digestAlert = alerts.find((a) => a.type === "morning_digest");
    expect(digestAlert).toBeDefined();
    expect(digestAlert?.title).toBe("Morning Tactical Briefing");
  });

  it("triggers streak defense alert at 8:30 PM if no missions completed today", () => {
    const now = new Date("2026-11-07T20:30:00");

    const alerts = getDueNotifications(now, {
      schedule: DEFAULT_SCHEDULE,
      events: [],
      missions: [], // 0 missions completed
      settings: DEFAULT_NOTIFICATION_SETTINGS,
    });

    const streakAlert = alerts.find((a) => a.type === "streak_defense");
    expect(streakAlert).toBeDefined();
    expect(streakAlert?.title).toBe("Streak Defense: Action Required");
  });

  it("triggers exam alert 3 days before Midterm Examination", () => {
    const now = new Date("2026-11-10T12:00:00");
    const mockEvents: AcademicEvent[] = [
      {
        id: "evt-midterms",
        title: "Midterm Examinations",
        date: "2026-11-13",
        type: "exam",
      },
    ];

    const alerts = getDueNotifications(now, {
      schedule: DEFAULT_SCHEDULE,
      events: mockEvents,
      missions: [],
      settings: DEFAULT_NOTIFICATION_SETTINGS,
    });

    const examAlert = alerts.find((a) => a.type === "exam_warning");
    expect(examAlert).toBeDefined();
    expect(examAlert?.title).toContain("Exam in 3 days: Midterm Examinations");
  });

  it("suppresses all alerts if quiet hours are active", () => {
    const now = new Date("2026-11-07T23:30:00");
    const quietSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      quiet_hours_enabled: true,
      quiet_hours_start: "23:00",
      quiet_hours_end: "07:00",
    };

    const alerts = getDueNotifications(now, {
      schedule: DEFAULT_SCHEDULE,
      events: [],
      missions: [],
      settings: quietSettings,
    });

    expect(alerts.length).toBe(0);
  });
});

