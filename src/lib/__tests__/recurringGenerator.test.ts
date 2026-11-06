import { describe, it, expect } from "vitest";
import {
  generateDailyAutoMissions,
  isRuleScheduledForDate,
  calculateTuitionDeadline,
} from "../recurringGenerator";
import {
  DEFAULT_TIME_BLOCKS,
  DEFAULT_ACADEMIC_EVENTS,
  DEFAULT_RECURRING_RULES,
} from "../seeds";
import { RecurringRule, Mission } from "@/types/database";

describe("recurringGenerator - Auto-Missions Engine", () => {
  it("calculates tuition deadline 2 hours before start time", () => {
    const deadline = calculateTuitionDeadline("18:00", "2026-11-09");
    expect(deadline).toBe("2026-11-09T16:00:00");

    const morningDeadline = calculateTuitionDeadline("10:30", "2026-11-09");
    expect(morningDeadline).toBe("2026-11-09T08:30:00");
  });

  it("evaluates rule schedule days correctly", () => {
    // Friday rule (day 5)
    const friRule: RecurringRule = {
      id: "rr-test-fri",
      title: "Friday Test",
      rule_type: "weekly_review",
      priority: "high",
      frequency: "weekly",
      interval: 1,
      days_of_week: [5],
      xp: 50,
      is_active: true,
    };

    const friday = new Date(2026, 10, 6); // Nov 6, 2026 is Friday
    const thursday = new Date(2026, 10, 5); // Nov 5, 2026 is Thursday

    expect(isRuleScheduledForDate(friRule, friday)).toBe(true);
    expect(isRuleScheduledForDate(friRule, thursday)).toBe(false);
  });

  it("generates review lecture missions for Saturday classes (DIP & FYDP) due 11:59 PM", () => {
    const saturday = new Date(2026, 9, 31); // Oct 31, 2026 is Saturday
    const { newMissions } = generateDailyAutoMissions({
      date: saturday,
      rules: DEFAULT_RECURRING_RULES,
      existingMissions: [],
      defaultBlocks: DEFAULT_TIME_BLOCKS,
      academicEvents: DEFAULT_ACADEMIC_EVENTS,
    });

    const reviewMissions = newMissions.filter((m) => m.title.startsWith("Review lecture:"));
    expect(reviewMissions.length).toBe(2);

    const dipRev = reviewMissions.find((m) => m.title.includes("DIP"));
    const fydpRev = reviewMissions.find((m) => m.title.includes("FYDP"));

    expect(dipRev).toBeDefined();
    expect(dipRev?.deadline).toBe("2026-10-31T23:59:00");
    expect(fydpRev).toBeDefined();
    expect(fydpRev?.deadline).toBe("2026-10-31T23:59:00");
  });

  it("does NOT generate class reviews on holidays (e.g. Nov 7 Holiday)", () => {
    const nov7 = new Date(2026, 10, 7); // Nov 7, 2026 (Holiday)
    const { newMissions } = generateDailyAutoMissions({
      date: nov7,
      rules: DEFAULT_RECURRING_RULES,
      existingMissions: [],
      defaultBlocks: DEFAULT_TIME_BLOCKS,
      academicEvents: DEFAULT_ACADEMIC_EVENTS,
    });

    const reviewMissions = newMissions.filter((m) => m.title.startsWith("Review lecture:"));
    expect(reviewMissions.length).toBe(0);
  });

  it("generates Saturday class reviews on Nov 12 online override day", () => {
    const nov12 = new Date(2026, 10, 12); // Thursday with Saturday classes online
    const { newMissions } = generateDailyAutoMissions({
      date: nov12,
      rules: DEFAULT_RECURRING_RULES,
      existingMissions: [],
      defaultBlocks: DEFAULT_TIME_BLOCKS,
      academicEvents: DEFAULT_ACADEMIC_EVENTS,
    });

    const reviewMissions = newMissions.filter((m) => m.title.startsWith("Review lecture:"));
    // Saturday classes: DIP and FYDP
    expect(reviewMissions.length).toBe(2);
    expect(reviewMissions.some((m) => m.title.includes("DIP"))).toBe(true);
    expect(reviewMissions.some((m) => m.title.includes("FYDP"))).toBe(true);

    // Also keeps Thursday tuition prep
    const tuitionMissions = newMissions.filter((m) => m.title === "Prepare tuition lesson");
    expect(tuitionMissions.length).toBe(1);
    expect(tuitionMissions[0].deadline).toBe("2026-11-12T16:00:00");
  });

  it("is strictly idempotent: second run produces 0 duplicate missions", () => {
    const monday = new Date(2026, 10, 9); // Nov 9, 2026 (Monday: tuition at 18:00)
    const run1 = generateDailyAutoMissions({
      date: monday,
      rules: DEFAULT_RECURRING_RULES,
      existingMissions: [],
      defaultBlocks: DEFAULT_TIME_BLOCKS,
      academicEvents: DEFAULT_ACADEMIC_EVENTS,
    });

    expect(run1.newMissions.length).toBeGreaterThan(0);

    // Run again with run1's newMissions in existingMissions
    const run2 = generateDailyAutoMissions({
      date: monday,
      rules: DEFAULT_RECURRING_RULES,
      existingMissions: run1.newMissions,
      defaultBlocks: DEFAULT_TIME_BLOCKS,
      academicEvents: DEFAULT_ACADEMIC_EVENTS,
    });

    expect(run2.newMissions.length).toBe(0);
  });

  it("enforces active mission cap of 5, queuing excess missions as 'locked'", () => {
    const date = new Date(2026, 10, 6); // Friday
    // Seed 4 existing active missions for today
    const existingActive: Mission[] = [1, 2, 3, 4].map((i) => ({
      id: `m-exist-${i}`,
      title: `Existing Active Mission ${i}`,
      codename: `OP-EXIST-${i}`,
      priority: "medium",
      status: "active",
      xp: 50,
      deadline: "2026-11-06T12:00:00",
      created_at: "2026-11-06T08:00:00",
    }));

    const { newMissions } = generateDailyAutoMissions({
      date,
      rules: DEFAULT_RECURRING_RULES,
      existingMissions: existingActive,
      defaultBlocks: DEFAULT_TIME_BLOCKS,
      academicEvents: DEFAULT_ACADEMIC_EVENTS,
      activeMissionCap: 5,
    });

    // Only 1 of the new missions can be 'active' to hit the cap of 5
    const newActiveCount = newMissions.filter((m) => m.status === "active").length;
    expect(newActiveCount).toBe(1);

    // Any remaining generated missions must be 'locked' (queued)
    const newLockedCount = newMissions.filter((m) => m.status === "locked").length;
    expect(newLockedCount).toBeGreaterThan(0);
  });

  it("supports custom recurring rules (interval N days)", () => {
    const customRule: RecurringRule = {
      id: "rr-custom-3d",
      title: "Clean Dev Workspace & Archive Logs",
      rule_type: "custom",
      category_id: "cat-8",
      priority: "low",
      frequency: "custom_n_days",
      interval: 3,
      time_of_day: "22:00",
      xp: 25,
      is_active: true,
    };

    const date = new Date(2026, 10, 6);
    const { newMissions } = generateDailyAutoMissions({
      date,
      rules: [customRule],
      existingMissions: [],
      defaultBlocks: DEFAULT_TIME_BLOCKS,
      academicEvents: DEFAULT_ACADEMIC_EVENTS,
    });

    // Should create if epoch day divides by 3
    if (isRuleScheduledForDate(customRule, date)) {
      expect(newMissions.length).toBe(1);
      expect(newMissions[0].title).toBe("Clean Dev Workspace & Archive Logs");
      expect(newMissions[0].deadline).toBe("2026-11-06T22:00:00");
    } else {
      expect(newMissions.length).toBe(0);
    }
  });
});

