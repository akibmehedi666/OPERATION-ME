/**
 * OPERATION: ME - Unified 12-Hour Time & Date Formatting Helpers
 */

/**
 * Converts a "HH:MM" 24h string or Date/ISO string to 12-hour format e.g. "9:50 AM", "6:00 PM"
 */
export function formatTime12(input: string | Date | null | undefined): string {
  if (!input) return "";

  if (input instanceof Date) {
    return input.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Handle "HH:MM" or "HH:MM:SS" string directly
  if (typeof input === "string" && input.includes(":") && !input.includes("T")) {
    const parts = input.split(":");
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || "00";
    if (isNaN(hours)) return input;

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12; // 0:00 -> 12:00 AM, 12:00 -> 12:00 PM
    return `${hours}:${minutes.padStart(2, "0")} ${ampm}`;
  }

  // Handle ISO string or parseable date string
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(input);
  }
}

/**
 * Formats a time range e.g. "9:50 AM - 11:10 AM" or "6:00 PM - 7:30 PM"
 */
export function formatTimeRange12(startTime: string, endTime: string): string {
  const start = formatTime12(startTime);
  const end = formatTime12(endTime);
  return `${start} - ${end}`;
}

/**
 * Formats a date as "Nov 6, 2026"
 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "";
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Formats a date as "Nov 6"
 */
export function formatDateShort(input: string | Date | null | undefined): string {
  if (!input) return "";
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Formats date and time: e.g. "Nov 6, 2026, 9:50 AM"
 */
export function formatDateTime12(input: string | Date | null | undefined): string {
  if (!input) return "";
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return "";
    return `${formatDate(d)}, ${formatTime12(d)}`;
  } catch {
    return "";
  }
}

/**
 * Formats due time for mission cards:
 * Returns e.g. "Overdue 3h", "Today, 6:00 PM", "Tomorrow, 11:59 PM", or "Nov 8, 2026, 2:00 PM"
 */
export function formatDueText(deadlineStr: string | null | undefined): {
  text: string;
  isOverdue: boolean;
} {
  if (!deadlineStr) return { text: "No deadline", isOverdue: false };

  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return { text: "Invalid date", isOverdue: false };

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    if (overdueHours < 24) {
      return { text: `Overdue ${overdueHours}h`, isOverdue: true };
    }
    const overdueDays = Math.round(overdueHours / 24);
    return { text: `Overdue ${overdueDays}d`, isOverdue: true };
  }

  // Check if today
  const isToday =
    deadline.getDate() === now.getDate() &&
    deadline.getMonth() === now.getMonth() &&
    deadline.getFullYear() === now.getFullYear();

  if (isToday) {
    return { text: `Today, ${formatTime12(deadline)}`, isOverdue: false };
  }

  // Check if tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    deadline.getDate() === tomorrow.getDate() &&
    deadline.getMonth() === tomorrow.getMonth() &&
    deadline.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) {
    return { text: `Tomorrow, ${formatTime12(deadline)}`, isOverdue: false };
  }

  return { text: `${formatDate(deadline)}, ${formatTime12(deadline)}`, isOverdue: false };
}

/**
 * Formats countdown seconds e.g. "5h 43m" or "24m 12s"
 */
export function formatCountdown(diffSeconds: number): string {
  if (diffSeconds <= 0) return "0m";
  const h = Math.floor(diffSeconds / 3600);
  const m = Math.floor((diffSeconds % 3600) / 60);
  const s = diffSeconds % 60;

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
}
