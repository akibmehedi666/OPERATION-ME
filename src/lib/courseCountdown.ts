import { Course, TimeBlock, AcademicEvent } from "@/types/database";
import { resolveDaySchedule } from "@/lib/scheduleResolver";
import { formatTime12 } from "@/lib/formatters";

export interface CourseCountdownInfo {
  status: "in_session" | "upcoming" | "recess";
  countdownText: string;
  nextDateText: string;
  room: string;
  isOnline: boolean;
  nextDate: Date | null;
}

export function getCourseCountdown(
  course: Course,
  defaultBlocks: TimeBlock[],
  academicEvents: AcademicEvent[],
  refDate: Date = new Date()
): CourseCountdownInfo {
  const currentTotalMinutes = refDate.getHours() * 60 + refDate.getMinutes();

  // Scan through next 14 days to find the next class
  for (let offset = 0; offset < 14; offset++) {
    const candidateDate = new Date(refDate);
    candidateDate.setDate(refDate.getDate() + offset);

    const resolved = resolveDaySchedule(candidateDate, defaultBlocks, academicEvents);

    // If day is a holiday or suspended, skip
    if (resolved.isHoliday) continue;

    // Find blocks matching this course
    const courseBlocks = resolved.blocks.filter((b) => {
      if (b.type !== "class") return false;
      if (course.category_id && b.default_category === course.category_id) return true;
      const cleanLabel = b.label.toLowerCase();
      const cleanName = course.name.toLowerCase();
      const cleanCode = course.code.toLowerCase();
      return (
        cleanLabel.includes(cleanName) ||
        cleanName.includes(cleanLabel) ||
        cleanLabel.includes(cleanCode) ||
        (cleanName.includes("dip") && cleanLabel.includes("dip")) ||
        (cleanName.includes("operating systems") && cleanLabel.includes("op. systems")) ||
        (cleanName.includes("os lab") && cleanLabel.includes("os lab")) ||
        (cleanName.includes("fydp") && cleanLabel.includes("fydp")) ||
        (cleanName.includes("economics") && cleanLabel.includes("economics")) ||
        (cleanName.includes("prob") && cleanLabel.includes("prob"))
      );
    });

    for (const block of courseBlocks) {
      const [startH, startM] = block.start_time.split(":").map(Number);
      const [endH, endM] = block.end_time.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      const classStartDate = new Date(candidateDate);
      classStartDate.setHours(startH, startM, 0, 0);

      const isToday = offset === 0;

      // 1. Is class currently in session?
      if (isToday && currentTotalMinutes >= startMinutes && currentTotalMinutes < endMinutes) {
        const remainingMinutes = endMinutes - currentTotalMinutes;
        return {
          status: "in_session",
          countdownText: `CLASS IN SESSION &middot; ${remainingMinutes}m remaining`,
          nextDateText: `Today until ${formatTime12(block.end_time)}`,
          room: block.isOnline ? "Online (Override)" : course.room ? `Room ${course.room}` : "Classroom",
          isOnline: !!block.isOnline,
          nextDate: classStartDate,
        };
      }

      // 2. Is this class upcoming?
      if (!isToday || currentTotalMinutes < startMinutes) {
        const diffMs = classStartDate.getTime() - refDate.getTime();
        const diffHours = Math.floor(diffMs / (3600 * 1000));
        const diffMinutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

        let countdownText = "";
        let nextDateText = "";

        if (isToday) {
          countdownText = `T-MINUS ${diffHours}h ${diffMinutes}m`;
          nextDateText = `Today at ${formatTime12(block.start_time)}`;
        } else if (offset === 1) {
          countdownText = `T-MINUS ${diffHours}h ${diffMinutes}m`;
          nextDateText = `Tomorrow at ${formatTime12(block.start_time)}`;
        } else {
          const dayName = candidateDate.toLocaleDateString("en-US", { weekday: "short" });
          const dateMonth = candidateDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          countdownText = `In ${offset} days (${dayName})`;
          nextDateText = `${dayName}, ${dateMonth} at ${formatTime12(block.start_time)}`;
        }

        return {
          status: "upcoming",
          countdownText,
          nextDateText,
          room: block.isOnline ? "Online (Override)" : course.room ? `Room ${course.room}` : "Classroom",
          isOnline: !!block.isOnline,
          nextDate: classStartDate,
        };
      }
    }
  }

  return {
    status: "recess",
    countdownText: "No classes scheduled in next 14 days",
    nextDateText: "Recess / Break",
    room: course.room ? `Room ${course.room}` : "Campus",
    isOnline: false,
    nextDate: null,
  };
}

