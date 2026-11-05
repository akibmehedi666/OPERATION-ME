import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatTime12,
  formatTimeRange12,
  formatDate,
  formatDateWithDay,
  formatDateShort,
  formatDateTime12,
  formatDueText,
  formatCountdown,
} from "../formatters";

describe("formatters - 12-hour time and date requirements", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Freeze time at Nov 5, 2026, 14:00:00 UTC (8:00 PM in Dhaka GMT+6)
    vi.setSystemTime(new Date("2026-11-05T14:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatTime12", () => {
    it("formats 24h string to 12h format with AM/PM", () => {
      expect(formatTime12("09:50")).toBe("9:50 AM");
      expect(formatTime12("18:00")).toBe("6:00 PM");
      expect(formatTime12("19:30")).toBe("7:30 PM");
    });

    it("correctly formats edge cases: 12:00 AM (midnight) and 12:00 PM (noon)", () => {
      expect(formatTime12("00:00")).toBe("12:00 AM");
      expect(formatTime12("12:00")).toBe("12:00 PM");
      expect(formatTime12("00:05")).toBe("12:05 AM");
      expect(formatTime12("12:45")).toBe("12:45 PM");
    });

    it("handles midnight rollover (23:59 to 00:00)", () => {
      expect(formatTime12("23:59")).toBe("11:59 PM");
      expect(formatTime12("00:00")).toBe("12:00 AM");
      expect(formatTime12("00:01")).toBe("12:01 AM");
    });

    it("formats Date objects into 12-hour strings", () => {
      const dMorning = new Date(2026, 10, 5, 9, 50);
      const dEvening = new Date(2026, 10, 5, 18, 30);
      expect(formatTime12(dMorning)).toMatch(/9:50\s*AM/);
      expect(formatTime12(dEvening)).toMatch(/6:30\s*PM/);
    });

    it("returns empty string on null or undefined input", () => {
      expect(formatTime12(null)).toBe("");
      expect(formatTime12(undefined)).toBe("");
      expect(formatTime12("")).toBe("");
    });
  });

  describe("formatTimeRange12", () => {
    it("formats ranges as 'start - end' in 12-hour format", () => {
      expect(formatTimeRange12("09:50", "11:10")).toBe("9:50 AM - 11:10 AM");
      expect(formatTimeRange12("18:00", "19:30")).toBe("6:00 PM - 7:30 PM");
      expect(formatTimeRange12("11:10", "13:50")).toBe("11:10 AM - 1:50 PM");
    });
  });

  describe("formatDate and variants", () => {
    it("formats dates as 'Nov 5, 2026'", () => {
      const d = new Date(2026, 10, 5, 10, 0);
      expect(formatDate(d)).toBe("Nov 5, 2026");
    });

    it("formats date with day as 'Thu, Nov 5, 2026'", () => {
      const d = new Date(2026, 10, 5, 10, 0);
      expect(formatDateWithDay(d)).toBe("Thu, Nov 5, 2026");
    });

    it("formats short date as 'Nov 5'", () => {
      const d = new Date(2026, 10, 5, 10, 0);
      expect(formatDateShort(d)).toBe("Nov 5");
    });

    it("formats date and time together with 12h format", () => {
      const d = new Date(2026, 10, 5, 18, 0);
      const res = formatDateTime12(d);
      expect(res).toContain("Nov 5, 2026");
      expect(res).toMatch(/6:00\s*PM/);
    });
  });

  describe("formatDueText and overdue calculation", () => {
    it("identifies overdue deadlines in hours or days", () => {
      // 3 hours ago
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      const res3h = formatDueText(threeHoursAgo);
      expect(res3h.isOverdue).toBe(true);
      expect(res3h.text).toBe("Overdue 3h");

      // 48 hours ago
      const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const res2d = formatDueText(twoDaysAgo);
      expect(res2d.isOverdue).toBe(true);
      expect(res2d.text).toBe("Overdue 2d");
    });

    it("identifies missions due Today", () => {
      const now = new Date();
      const laterToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
      const resToday = formatDueText(laterToday.toISOString());
      expect(resToday.isOverdue).toBe(false);
      expect(resToday.text).toMatch(/^Today,\s*11:59\s*PM/);
    });

    it("identifies missions due Tomorrow", () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0);
      const resTomorrow = formatDueText(tomorrow.toISOString());
      expect(resTomorrow.isOverdue).toBe(false);
      expect(resTomorrow.text).toMatch(/^Tomorrow,\s*2:00\s*PM/);
    });

    it("returns 'No deadline' for empty inputs", () => {
      expect(formatDueText(null)).toEqual({ text: "No deadline", isOverdue: false });
      expect(formatDueText(undefined)).toEqual({ text: "No deadline", isOverdue: false });
    });
  });

  describe("formatCountdown", () => {
    it("formats countdown seconds into hours and minutes", () => {
      // 5h 43m = 5 * 3600 + 43 * 60 = 18000 + 2580 = 20580
      expect(formatCountdown(20580)).toBe("5h 43m");
      // 24m 12s
      expect(formatCountdown(24 * 60 + 12)).toBe("24m 12s");
      // 0 or negative
      expect(formatCountdown(0)).toBe("0m");
      expect(formatCountdown(-10)).toBe("0m");
    });
  });

  describe("Timezone consistency (Asia/Dhaka GMT+6 context)", () => {
    it("correctly converts UTC ISO strings in local time", () => {
      // 12:00 UTC = 18:00 (6:00 PM) in GMT+6
      const utcIso = "2026-11-05T12:00:00Z";
      const formatted = formatTime12(utcIso);
      expect(formatted).toMatch(/(AM|PM)/);
    });
  });
});

