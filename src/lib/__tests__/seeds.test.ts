import { describe, it, expect } from "vitest";
import { DEFAULT_CATEGORIES, DEFAULT_SCHEDULE, INITIAL_STARTER_MISSIONS } from "../seeds";

describe("seeds - routine & categories requirement verification", () => {
  it("contains all 11 required seed categories", () => {
    const expectedCategories = [
      "Operating Systems",
      "OS Lab",
      "Economics",
      "Digital Image Processing",
      "Probability & Statistics",
      "FYDP",
      "Cybersecurity",
      "Side Projects",
      "Research Papers",
      "Codeforces",
      "Tuition",
    ];

    expect(DEFAULT_CATEGORIES).toHaveLength(11);
    const categoryNames = DEFAULT_CATEGORIES.map((c) => c.name);
    expectedCategories.forEach((cat) => {
      expect(categoryNames).toContain(cat);
    });
  });

  describe("class & tuition schedule verification", () => {
    it("SAT schedule: DIP (425) 09:50-11:10 and FYDP-I (626) 11:10-13:50", () => {
      const sat = DEFAULT_SCHEDULE.filter((s) => s.day_of_week === "SAT");
      expect(sat).toHaveLength(2);
      expect(sat[0]).toMatchObject({
        course_name: expect.stringContaining("DIP"),
        room: "425",
        start_time: "09:50",
        end_time: "11:10",
        type: "class",
      });
      expect(sat[1]).toMatchObject({
        course_name: expect.stringContaining("FYDP"),
        room: "626",
        start_time: "11:10",
        end_time: "13:50",
        type: "class",
      });
    });

    it("SUN schedule: Economics (406) 09:50, OS (406) 11:10, Prob & Stats (630) 12:30-13:50", () => {
      const sun = DEFAULT_SCHEDULE.filter((s) => s.day_of_week === "SUN");
      expect(sun).toHaveLength(3);
      expect(sun[0]).toMatchObject({
        course_name: "Economics",
        room: "406",
        start_time: "09:50",
        type: "class",
      });
      expect(sun[1]).toMatchObject({
        course_name: "Operating Systems",
        room: "406",
        start_time: "11:10",
        type: "class",
      });
      expect(sun[2]).toMatchObject({
        course_name: "Probability & Statistics",
        room: "630",
        start_time: "12:30",
        end_time: "13:50",
        type: "class",
      });
    });

    it("TUE schedule: DIP (425) 09:50, OS Lab (827) 11:10-13:50", () => {
      const tue = DEFAULT_SCHEDULE.filter((s) => s.day_of_week === "TUE");
      expect(tue).toHaveLength(2);
      expect(tue[0]).toMatchObject({
        course_name: expect.stringContaining("DIP"),
        room: "425",
        start_time: "09:50",
        type: "class",
      });
      expect(tue[1]).toMatchObject({
        course_name: "OS Lab",
        room: "827",
        start_time: "11:10",
        end_time: "13:50",
        type: "class",
      });
    });

    it("WED schedule: Economics (406) 09:50, OS (406) 11:10, Prob & Stats (630) 12:30-13:50", () => {
      const wed = DEFAULT_SCHEDULE.filter((s) => s.day_of_week === "WED");
      expect(wed).toHaveLength(3);
      expect(wed[0]).toMatchObject({
        course_name: "Economics",
        room: "406",
        start_time: "09:50",
        type: "class",
      });
      expect(wed[1]).toMatchObject({
        course_name: "Operating Systems",
        room: "406",
        start_time: "11:10",
        type: "class",
      });
      expect(wed[2]).toMatchObject({
        course_name: "Probability & Statistics",
        room: "630",
        start_time: "12:30",
        end_time: "13:50",
        type: "class",
      });
    });

    it("MON, THU, FRI schedule: Tuition (I teach) 18:00-19:30 and NO classes", () => {
      ["MON", "THU", "FRI"].forEach((day) => {
        const items = DEFAULT_SCHEDULE.filter((s) => s.day_of_week === day);
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
          course_name: expect.stringContaining("Tuition"),
          start_time: "18:00",
          end_time: "19:30",
          type: "tuition",
        });
        // Verify NO academic classes exist on Mon, Thu, Fri
        const classes = items.filter((s) => s.type === "class");
        expect(classes).toHaveLength(0);
      });
    });
  });

  describe("INITIAL_STARTER_MISSIONS verification", () => {
    it("has starter missions with required fields and valid priorities", () => {
      expect(INITIAL_STARTER_MISSIONS.length).toBeGreaterThan(0);
      INITIAL_STARTER_MISSIONS.forEach((m) => {
        expect(m.id).toBeDefined();
        expect(m.title).toBeTruthy();
        expect(m.codename).toBeTruthy();
        expect(["urgent", "high", "medium", "low"]).toContain(m.priority);
        expect(["active", "locked", "completed"]).toContain(m.status);
        expect(m.xp).toBeGreaterThan(0);
      });
    });
  });
});

