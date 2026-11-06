import { describe, it, expect } from "vitest";
import { 
  mapMissionToBlockType, 
  calculateBlockFill, 
  autoScheduleMissions,
  calculateBlockMinutes 
} from "../plannerScheduler";
import { DEFAULT_CATEGORIES, DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS } from "../seeds";
import { Mission, TimeBlock } from "@/types/database";

describe("Planner Mission Auto-Scheduler & Fill Engine", () => {
  const sampleMissions: Mission[] = [
    {
      id: "m-os",
      title: "Operating Systems Page Table Lab",
      codename: "OP-OS-1",
      category_id: "cat-1", // OS
      priority: "urgent",
      status: "active",
      deadline: "2026-11-08T18:00:00.000Z",
      time_spent_minutes: 60,
      xp: 60,
      created_at: new Date().toISOString(),
    },
    {
      id: "m-proj",
      title: "FYDP Architecture Blueprint",
      codename: "OP-FYDP-1",
      category_id: "cat-6", // FYDP
      priority: "high",
      status: "active",
      deadline: "2026-11-09T20:00:00.000Z",
      time_spent_minutes: 90,
      xp: 75,
      created_at: new Date().toISOString(),
    },
    {
      id: "m-cf",
      title: "Codeforces Contest Prep",
      codename: "OP-CF-1",
      category_id: "cat-10", // Codeforces
      priority: "medium",
      status: "active",
      deadline: "2026-11-10T22:00:00.000Z",
      time_spent_minutes: 60,
      xp: 40,
      created_at: new Date().toISOString(),
    },
  ];

  describe("Category to Block Type Mapping", () => {
    it("maps course missions to study blocks", () => {
      const osMission = sampleMissions[0];
      expect(mapMissionToBlockType(osMission, DEFAULT_CATEGORIES)).toBe("study");

      const dipMission: Mission = {
        ...sampleMissions[0],
        category_id: "cat-4", // DIP
      };
      expect(mapMissionToBlockType(dipMission, DEFAULT_CATEGORIES)).toBe("study");
    });

    it("maps side projects, FYDP, and research missions to project blocks", () => {
      const fydpMission = sampleMissions[1];
      expect(mapMissionToBlockType(fydpMission, DEFAULT_CATEGORIES)).toBe("project");

      const sideMission: Mission = {
        ...sampleMissions[1],
        category_id: "cat-8", // Side Projects
      };
      expect(mapMissionToBlockType(sideMission, DEFAULT_CATEGORIES)).toBe("project");
    });

    it("maps Codeforces and SQL practice to cp blocks", () => {
      const cfMission = sampleMissions[2];
      expect(mapMissionToBlockType(cfMission, DEFAULT_CATEGORIES)).toBe("cp");
    });
  });

  describe("Block Fill Calculation & Overbooked Warning", () => {
    const testBlock: TimeBlock = {
      id: "test-tb-1",
      weekday: "SAT",
      start_time: "20:00",
      end_time: "21:00", // 60 minutes
      type: "study",
      label: "Revise DIP/FYDP",
      is_fixed: false,
    };

    it("calculates normal fill without warning when within block duration", () => {
      const missionA: Mission = {
        ...sampleMissions[0],
        scheduled_block_id: testBlock.id,
        time_spent_minutes: 45,
      };

      const fill = calculateBlockFill(testBlock, "2026-11-07", [missionA]);
      expect(fill.plannedMissions.length).toBe(1);
      expect(fill.totalPlannedMinutes).toBe(45);
      expect(fill.blockMinutes).toBe(60);
      expect(fill.isOverbooked).toBe(false);
      expect(fill.overbookedMinutes).toBe(0);
      expect(fill.displayText).toContain("1 mission");
    });

    it("warns in amber when planned minutes exceed block duration (Overbooked)", () => {
      const missionA: Mission = {
        ...sampleMissions[0],
        scheduled_block_id: testBlock.id,
        time_spent_minutes: 45,
      };
      const missionB: Mission = {
        ...sampleMissions[1],
        scheduled_block_id: testBlock.id,
        time_spent_minutes: 45,
      };

      // 45 + 45 = 90 mins planned into a 60 min block -> Overbooked by 30 mins
      const fill = calculateBlockFill(testBlock, "2026-11-07", [missionA, missionB]);
      expect(fill.plannedMissions.length).toBe(2);
      expect(fill.totalPlannedMinutes).toBe(90);
      expect(fill.blockMinutes).toBe(60);
      expect(fill.isOverbooked).toBe(true);
      expect(fill.overbookedMinutes).toBe(30);
      expect(fill.displayText).toContain("2 missions · 90m planned");
    });
  });

  describe("Auto-Scheduler", () => {
    it("places unscheduled missions into matching flexible blocks before deadline", () => {
      const weekStart = new Date("2026-11-07T00:00:00");
      const result = autoScheduleMissions(
        sampleMissions,
        DEFAULT_TIME_BLOCKS,
        DEFAULT_ACADEMIC_EVENTS,
        weekStart,
        DEFAULT_CATEGORIES
      );

      expect(result.scheduledCount).toBeGreaterThan(0);

      // Verify each scheduled mission has block id and auto scheduled tag
      const updated = result.updatedMissions;
      const scheduledOs = updated.find((m) => m.id === "m-os");
      expect(scheduledOs?.scheduled_block_id).toBeDefined();
      expect(scheduledOs?.is_auto_scheduled).toBe(true);

      const scheduledProj = updated.find((m) => m.id === "m-proj");
      expect(scheduledProj?.scheduled_block_id).toBeDefined();
      expect(scheduledProj?.is_auto_scheduled).toBe(true);
    });
  });

  describe("Block Duration Calculation", () => {
    it("computes accurate minutes from 24h start/end times", () => {
      expect(calculateBlockMinutes("09:50", "11:10")).toBe(80);
      expect(calculateBlockMinutes("11:10", "13:50")).toBe(160);
      expect(calculateBlockMinutes("18:00", "19:30")).toBe(90);
    });
  });
});

