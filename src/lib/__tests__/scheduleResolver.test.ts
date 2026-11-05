import { describe, it, expect } from "vitest";
import { 
  resolveDaySchedule, 
  getUpcomingAcademicEvents, 
  getUrgentAcademicNotice,
  isExamModeActive,
  getWeekStartDate,
  getDaysOfWeek,
  formatDateKey 
} from "../scheduleResolver";
import { DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS } from "../seeds";
import { formatTime12, formatTimeRange12 } from "../formatters";

describe("Schedule & Academic Override Resolver", () => {
  describe("Date Override Resolution (Nov 12 follows Saturday, Nov 7 no class, Dec 16 holiday)", () => {
    it("Nov 12, 2026 (Thursday) follows Saturday class schedule online, while keeping Thursday tuition", () => {
      // Nov 12, 2026 is a Thursday with an Online Saturday Class override
      const resolved = resolveDaySchedule("2026-11-12", DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS);

      expect(resolved.weekday).toBe("THU");
      expect(resolved.isOverridden).toBe(true);
      expect(resolved.badge).toContain("Saturday");

      // Classes on Nov 12 should be Saturday's classes (DIP and FYDP-I) labeled "Online"
      const classes = resolved.blocks.filter((b) => b.type === "class");
      expect(classes.length).toBe(2);

      const dipClass = classes.find((c) => c.label.includes("DIP"));
      expect(dipClass).toBeDefined();
      expect(dipClass?.label).toContain("Online");
      expect(dipClass?.start_time).toBe("09:50");
      expect(dipClass?.end_time).toBe("11:10");
      expect(dipClass?.isOnline).toBe(true);

      const fydpClass = classes.find((c) => c.label.includes("FYDP-I"));
      expect(fydpClass).toBeDefined();
      expect(fydpClass?.label).toContain("Online");
      expect(fydpClass?.start_time).toBe("11:10");
      expect(fydpClass?.end_time).toBe("13:50");
      expect(fydpClass?.isOnline).toBe(true);

      // Thursday's Tuition should be preserved!
      const tuition = resolved.blocks.find((b) => b.type === "tuition");
      expect(tuition).toBeDefined();
      expect(tuition?.start_time).toBe("18:00");
      expect(tuition?.end_time).toBe("19:30");
      expect(formatTimeRange12(tuition!.start_time, tuition!.end_time)).toBe("6:00 PM - 7:30 PM");
    });

    it("Nov 7, 2026 (Saturday) is a holiday -> university classes are removed", () => {
      const resolved = resolveDaySchedule("2026-11-07", DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS);

      expect(resolved.weekday).toBe("SAT");
      expect(resolved.isHoliday).toBe(true);
      expect(resolved.badge).toContain("Holiday");

      // No university classes on holiday
      const classes = resolved.blocks.filter((b) => b.type === "class");
      expect(classes.length).toBe(0);

      // Non-class blocks (project, break, study) remain
      const projectBlock = resolved.blocks.find((b) => b.type === "project");
      expect(projectBlock).toBeDefined();
    });

    it("Dec 16, 2026 (Wednesday) is a holiday (Victory Day) -> university classes are removed", () => {
      // Check Dec 16 specifically
      const victoryDay = resolveDaySchedule("2026-12-16", DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS);

      expect(victoryDay.weekday).toBe("WED");
      expect(victoryDay.isHoliday).toBe(true);
      expect(victoryDay.badge).toContain("Victory Day");

      const classes = victoryDay.blocks.filter((b) => b.type === "class");
      expect(classes.length).toBe(0);
    });

    it("Dec 5-12, 2026 is Mid-Term Exam range -> days are marked as exam", () => {
      const midExamDay1 = resolveDaySchedule("2026-12-05", DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS);
      const midExamDayMid = resolveDaySchedule("2026-12-08", DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS);
      const midExamDayEnd = resolveDaySchedule("2026-12-12", DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS);

      expect(midExamDay1.isExam).toBe(true);
      expect(midExamDayMid.isExam).toBe(true);
      expect(midExamDayEnd.isExam).toBe(true);
      expect(midExamDay1.badge).toContain("MID-TERM EXAM");
    });
  });

  describe("12-Hour Format Compliance", () => {
    it("formats start and end times in 12-hour AM/PM format everywhere", () => {
      const resolved = resolveDaySchedule("2026-11-01", DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS);
      for (const block of resolved.blocks) {
        const time12Start = formatTime12(block.start_time);
        const time12End = formatTime12(block.end_time);

        expect(time12Start).toMatch(/(AM|PM)$/);
        expect(time12End).toMatch(/(AM|PM)$/);
      }
    });
  });

  describe("Upcoming Dates & Countdown", () => {
    it("returns next academic events with countdown text relative to given date", () => {
      const referenceDate = new Date("2026-11-05T00:00:00");
      const upcoming = getUpcomingAcademicEvents(DEFAULT_ACADEMIC_EVENTS, referenceDate, 3);

      expect(upcoming.length).toBe(3);
      expect(upcoming[0].event.title).toContain("Online Saturday class");
      expect(upcoming[0].countdownText).toBe("Today");

      // Mid-term exam should be in the wider list
      const allUpcoming = getUpcomingAcademicEvents(DEFAULT_ACADEMIC_EVENTS, referenceDate, 10);
      const exam = allUpcoming.find((u) => u.event.type === "exam");
      expect(exam).toBeDefined();
      expect(exam?.countdownText).toContain("days");
    });
  });

  describe("7-Day Alert Banner", () => {
    it("detects payments or exams within 7 days", () => {
      // 5 days before Nov 22 payment
      const notice = getUrgentAcademicNotice(DEFAULT_ACADEMIC_EVENTS, new Date("2026-11-17T00:00:00"));
      expect(notice).not.toBeNull();
      expect(notice?.event.type).toBe("payment");
      expect(notice?.message).toContain("Tuition Payment");
      expect(notice?.message).toContain("in 5 days");
    });
  });

  describe("Exam Mode", () => {
    it("activates 14 days before exam and during exam", () => {
      // Dec 5 is exam start. Nov 25 is 10 days before exam
      const beforeExam = isExamModeActive(DEFAULT_ACADEMIC_EVENTS, new Date("2026-11-25T00:00:00"));
      expect(beforeExam.active).toBe(true);
      expect(beforeExam.daysUntil).toBe(10);

      // Dec 7 is during exam
      const duringExam = isExamModeActive(DEFAULT_ACADEMIC_EVENTS, new Date("2026-12-07T00:00:00"));
      expect(duringExam.active).toBe(true);
      expect(duringExam.daysUntil).toBe(0);

      // Nov 1 is 34 days before exam -> not active
      const notExam = isExamModeActive(DEFAULT_ACADEMIC_EVENTS, new Date("2026-11-01T00:00:00"));
      expect(notExam.active).toBe(false);
    });
  });

  describe("Week Bounds", () => {
    it("starts week on Saturday and returns 7 days", () => {
      // Thursday Nov 5, 2026 -> Saturday Oct 31, 2026
      const start = getWeekStartDate(new Date("2026-11-05T12:00:00"));
      expect(start.getDay()).toBe(6); // Saturday
      expect(formatDateKey(start)).toBe("2026-10-31");

      const days = getDaysOfWeek(start);
      expect(days.length).toBe(7);
      expect(days[0].getDay()).toBe(6); // SAT
      expect(days[6].getDay()).toBe(5); // FRI
    });
  });
});
