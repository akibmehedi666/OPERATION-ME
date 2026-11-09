import { 
  Mission, 
  TimeBlock, 
  TimeBlockType, 
  Category, 
  AcademicEvent,
  ResolvedTimeBlock 
} from "@/types/database";
import { 
  resolveDaySchedule, 
  getDaysOfWeek, 
  formatDateKey,
  getLocalTimeString 
} from "@/lib/scheduleResolver";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Calculates duration in minutes from "HH:MM" start to "HH:MM" end
 */
export function calculateBlockMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = (sh || 0) * 60 + (sm || 0);
  const endMin = (eh || 0) * 60 + (em || 0);
  return Math.max(0, endMin - startMin);
}

/**
 * Maps a mission to its appropriate planner flexible block type
 */
export function mapMissionToBlockType(mission: Mission, categories: Category[]): TimeBlockType {
  const cat = categories.find((c) => c.id === mission.category_id);
  const catName = cat?.name?.toLowerCase() || "";
  const catId = cat?.id || "";

  // 1. Course study blocks (OS, OS Lab, Economics, DIP, Prob & Stats)
  if (
    ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5"].includes(catId) ||
    catName.includes("operating") ||
    catName.includes("os") ||
    catName.includes("lab") ||
    catName.includes("economics") ||
    catName.includes("image") ||
    catName.includes("dip") ||
    catName.includes("probability") ||
    catName.includes("stat")
  ) {
    return "study";
  }

  // 2. Project / Career blocks (Side Projects, FYDP, Cybersecurity, Research)
  if (
    ["cat-6", "cat-7", "cat-8", "cat-9"].includes(catId) ||
    catName.includes("project") ||
    catName.includes("fydp") ||
    catName.includes("cyber") ||
    catName.includes("research")
  ) {
    return "project";
  }

  // 3. Practice blocks (Codeforces, SQL, competitive programming)
  if (
    catId === "cat-10" ||
    catName.includes("codeforces") ||
    catName.includes("cf") ||
    mission.title.toLowerCase().includes("sql") ||
    mission.title.toLowerCase().includes("codeforces")
  ) {
    return "cp";
  }

  return "study";
}

export interface BlockFillInfo {
  plannedMissions: Mission[];
  totalPlannedMinutes: number;
  blockMinutes: number;
  isOverbooked: boolean;
  overbookedMinutes: number;
  fillPercentage: number;
  displayText: string;
}

/**
 * Calculates mission load & overbooked status for a time block
 */
export function calculateBlockFill(
  block: TimeBlock | ResolvedTimeBlock,
  blockDateStr: string,
  missions: Mission[]
): BlockFillInfo {
  const blockMinutes = calculateBlockMinutes(block.start_time, block.end_time);

  // Find missions assigned to this block
  const plannedMissions = missions.filter((m) => {
    if (m.scheduled_block_id === block.id) return true;
    if (m.scheduled_start) {
      const mDate = formatDateKey(m.scheduled_start);
      if (mDate === blockDateStr) {
        const mTime = getLocalTimeString(m.scheduled_start);
        if (mTime && mTime >= block.start_time && mTime < block.end_time) {
          return true;
        }
      }
    }
    return false;
  });

  // Calculate planned minutes (sum of explicit duration or default 45 min per mission)
  const totalPlannedMinutes = plannedMissions.reduce((acc, m) => {
    return acc + (m.time_spent_minutes || 45);
  }, 0);

  const isOverbooked = totalPlannedMinutes > blockMinutes;
  const overbookedMinutes = Math.max(0, totalPlannedMinutes - blockMinutes);
  const fillPercentage = blockMinutes > 0 ? Math.min(100, Math.round((totalPlannedMinutes / blockMinutes) * 100)) : 0;

  let displayText = "";
  if (plannedMissions.length === 0) {
    displayText = "Unassigned";
  } else {
    displayText = `${plannedMissions.length} mission${plannedMissions.length > 1 ? "s" : ""} · ${totalPlannedMinutes}m planned`;
  }

  return {
    plannedMissions,
    totalPlannedMinutes,
    blockMinutes,
    isOverbooked,
    overbookedMinutes,
    fillPercentage,
    displayText,
  };
}

export interface AutoScheduleResult {
  scheduledCount: number;
  updatedMissions: Mission[];
}

/**
 * Auto-schedules unassigned active missions to the nearest free flexible blocks before deadline
 */
export function autoScheduleMissions(
  missions: Mission[],
  weeklyBlocks: TimeBlock[],
  academicEvents: AcademicEvent[],
  weekStartDate: Date,
  categories: Category[]
): AutoScheduleResult {
  const days = getDaysOfWeek(weekStartDate);

  // 1. Gather all resolved flexible blocks for the 7 days
  interface CandidateBlock {
    dateStr: string;
    block: ResolvedTimeBlock;
    blockMinutes: number;
    usedMinutes: number;
  }

  const candidateBlocks: CandidateBlock[] = [];

  for (const day of days) {
    const res = resolveDaySchedule(day, weeklyBlocks, academicEvents, missions);
    // Flexible block types only
    for (const b of res.blocks) {
      if (b.type === "study" || b.type === "project" || b.type === "cp") {
        const bMinutes = calculateBlockMinutes(b.start_time, b.end_time);
        const fill = calculateBlockFill(b, res.dateStr, missions);
        candidateBlocks.push({
          dateStr: res.dateStr,
          block: b,
          blockMinutes: bMinutes,
          usedMinutes: fill.totalPlannedMinutes,
        });
      }
    }
  }

  // 2. Identify active missions with deadline or end time that are not yet scheduled
  const unscheduledMissions = missions
    .filter((m) => m.status === "active" && (m.deadline || m.scheduled_end) && !m.scheduled_block_id)
    .sort((a, b) => {
      // Sort by priority first
      const pDiff = (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      // Soonest deadline/end first
      const aDue = (a.deadline || a.scheduled_end)!;
      const bDue = (b.deadline || b.scheduled_end)!;
      return new Date(aDue).getTime() - new Date(bDue).getTime();
    });

  let scheduledCount = 0;
  const updatedMissionsMap = new Map<string, Mission>(missions.map((m) => [m.id, { ...m }]));

  for (const mission of unscheduledMissions) {
    const targetType = mapMissionToBlockType(mission, categories);
    const missionDue = (mission.deadline || mission.scheduled_end)!;
    const missionDeadlineTime = new Date(missionDue).getTime();
    const missionEstimatedMin = mission.time_spent_minutes || 45;

    // Filter candidate blocks that match type and occur BEFORE or ON deadline
    const eligibleBlocks = candidateBlocks.filter((cand) => {
      if (cand.block.type !== targetType) return false;
      const blockStartTime = new Date(`${cand.dateStr}T${cand.block.start_time}:00`).getTime();
      return blockStartTime <= missionDeadlineTime;
    });

    if (eligibleBlocks.length === 0) continue;

    // Prefer block whose label matches course/category if study block
    const cat = categories.find((c) => c.id === mission.category_id);
    const catKeywords = [
      cat?.name?.toLowerCase() || "",
      cat?.codename?.toLowerCase() || "",
    ].filter(Boolean);

    eligibleBlocks.sort((a, b) => {
      const aMatches = catKeywords.some((kw) => a.block.label.toLowerCase().includes(kw));
      const bMatches = catKeywords.some((kw) => b.block.label.toLowerCase().includes(kw));
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      // Prefer block that has room
      const aHasSpace = a.usedMinutes + missionEstimatedMin <= a.blockMinutes;
      const bHasSpace = b.usedMinutes + missionEstimatedMin <= b.blockMinutes;
      if (aHasSpace && !bHasSpace) return -1;
      if (!aHasSpace && bHasSpace) return 1;

      // Otherwise least loaded
      return a.usedMinutes - b.usedMinutes;
    });

    const chosen = eligibleBlocks[0];
    if (chosen) {
      const updatedMission: Mission = {
        ...mission,
        scheduled_block_id: chosen.block.id,
        scheduled_start: `${chosen.dateStr}T${chosen.block.start_time}:00`,
        scheduled_end: `${chosen.dateStr}T${chosen.block.end_time}:00`,
        is_auto_scheduled: true,
      };

      updatedMissionsMap.set(mission.id, updatedMission);
      chosen.usedMinutes += missionEstimatedMin;
      scheduledCount++;
    }
  }

  return {
    scheduledCount,
    updatedMissions: Array.from(updatedMissionsMap.values()),
  };
}

/**
 * Snaps minutes to 15-minute grid (e.g. 11:08 -> 11:15, 11:03 -> 11:00)
 */
export function snapMinutesToQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

/**
 * Converts pixel Y offset in the 9 AM - 10 PM grid (13 hours total) to "HH:MM"
 */
export function gridYOffsetToTime(yFraction: number): string {
  const totalMinutes = 13 * 60; // 9 AM to 10 PM = 780 minutes
  const clampedFraction = Math.max(0, Math.min(1, yFraction));
  const exactMinutes = clampedFraction * totalMinutes;
  const snappedMinutes = snapMinutesToQuarterHour(exactMinutes);

  const startHour = 9;
  const targetTotalMin = startHour * 60 + snappedMinutes;
  const hour = Math.floor(targetTotalMin / 60);
  const min = targetTotalMin % 60;

  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

