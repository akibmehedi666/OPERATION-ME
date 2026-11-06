import { CodeforcesLog } from "@/types/database";

export interface CodeforcesUserProfile {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  avatar?: string;
  titlePhoto?: string;
  contribution?: number;
  friendOfCount?: number;
}

export interface CodeforcesSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds?: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    type?: string;
    points?: number;
    rating?: number;
    tags: string[];
  };
  author?: {
    contestId?: number;
    members: { handle: string }[];
    participantType: string;
    ghost: boolean;
    room?: number;
    startTimeSeconds?: number;
  };
  programmingLanguage?: string;
  verdict?: string;
  testset?: string;
  passedTestCount: number;
  timeConsumedMillis?: number;
  memoryConsumedBytes?: number;
}

export interface ParsedCodeforcesProblem {
  key: string;
  name: string;
  contestId?: number;
  index: string;
  rating?: number;
  tags: string[];
  status: "solved" | "tried";
  isGym: boolean;
  firstAcTimeSeconds?: number;
  latestAttemptSeconds?: number;
  lastVerdict?: string;
  problemUrl?: string;
}

/**
 * Normalizes Codeforces avatar/image URLs:
 * - Prefixes "https:" if protocol-relative ("//userpic.codeforces.org/...")
 * - Upgrades "http://" to "https://"
 */
export function normalizeCodeforcesAvatarUrl(url?: string): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice(7)}`;
  }
  return trimmed;
}

/**
 * Fetch public profile details for a Codeforces handle.
 */
export async function fetchCodeforcesProfile(
  handle: string
): Promise<CodeforcesUserProfile | null> {
  if (!handle || !handle.trim()) return null;

  try {
    const res = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle.trim())}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === "OK" && Array.isArray(data.result) && data.result.length > 0) {
      const u = data.result[0];
      return {
        handle: u.handle,
        rating: u.rating,
        maxRating: u.maxRating,
        rank: u.rank,
        maxRank: u.maxRank,
        avatar: normalizeCodeforcesAvatarUrl(u.avatar),
        titlePhoto: normalizeCodeforcesAvatarUrl(u.titlePhoto),
        contribution: u.contribution,
        friendOfCount: u.friendOfCount,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch the FULL submission history for a user.
 * Queries Codeforces API without pagination limits to retrieve complete submission records,
 * and falls back to chunked pagination if the platform mandates paging.
 */
export async function fetchCodeforcesSubmissions(
  handle: string,
  retries = 2
): Promise<CodeforcesSubmission[]> {
  const cleanHandle = handle.trim();
  if (!cleanHandle) return [];

  // Attempt 1: Fetch all submissions directly without from/count limits
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(cleanHandle)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Codeforces API responded with HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.status !== "OK") {
        throw new Error(data.comment || "Codeforces API error fetching submissions");
      }
      const all = Array.isArray(data.result) ? data.result : [];
      console.log(`[Codeforces Sync] Fetched ${all.length} total submissions for handle "${cleanHandle}"`);
      return all;
    } catch (err: unknown) {
      attempt++;
      if (attempt > retries) {
        console.warn(`[Codeforces Sync] Direct full fetch failed, attempting paged fallback...`, err);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Attempt 2: Paged fallback if direct unconstrained call was blocked/truncated
  const pageSize = 10000;
  let from = 1;
  const pagedSubmissions: CodeforcesSubmission[] = [];

  while (true) {
    let pagedAttempt = 0;
    let success = false;
    let lastError: Error | null = null;
    let batchResult: CodeforcesSubmission[] = [];

    while (pagedAttempt <= retries && !success) {
      try {
        const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(
          cleanHandle
        )}&from=${from}&count=${pageSize}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Codeforces API responded with HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.status !== "OK") {
          throw new Error(data.comment || "Codeforces API error fetching submissions");
        }
        batchResult = Array.isArray(data.result) ? data.result : [];
        success = true;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        pagedAttempt++;
        if (pagedAttempt <= retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (!success) {
      throw lastError || new Error("Failed to fetch Codeforces submissions after retries");
    }

    pagedSubmissions.push(...batchResult);

    if (batchResult.length < pageSize || pagedSubmissions.length >= 100000) {
      break;
    }

    from += batchResult.length;
  }

  console.log(`[Codeforces Sync] Fetched ${pagedSubmissions.length} submissions via pagination for "${cleanHandle}"`);
  return pagedSubmissions;
}

/**
 * Extract contestId-index key from Codeforces problem URLs
 */
export function extractProblemKeyFromUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:contest|problemset\/problem|gym)\/(\d+)\/(?:problem\/)?([A-Za-z0-9]+)/i);
  if (m) {
    return `${m[1]}-${m[2].toUpperCase()}`;
  }
  return null;
}

/**
 * Group raw submissions into unique problems:
 * - A problem is solved if at least ONE submission has verdict === "OK"
 * - Deduplicated strictly by contestId + problem index (not by name)
 * - Includes contest, practice, virtual, and gym problems
 * - Flags gym problems (contestId >= 100000 or participantType === 'GYM')
 * - Problems without a rating are preserved with rating: undefined
 */
export function parseSubmissionsToProblems(
  submissions: CodeforcesSubmission[]
): Map<string, ParsedCodeforcesProblem> {
  const problems = new Map<string, ParsedCodeforcesProblem>();

  for (const sub of submissions) {
    if (!sub.problem) continue;
    const contestId = sub.problem.contestId || sub.contestId;
    const index = (sub.problem.index || "").trim().toUpperCase();
    const name = (sub.problem.name || "").trim();
    if (!name && !index) continue;

    // Deduplicate strictly by contestId + problem index
    const key = contestId && index
      ? `${contestId}-${index}`
      : `prob-${index || name.toLowerCase()}`;

    const isGym = Boolean((contestId && contestId >= 100000) || sub.author?.participantType === "GYM");

    let existing = problems.get(key);
    if (!existing) {
      const url = contestId && index
        ? isGym
          ? `https://codeforces.com/gym/${contestId}/problem/${index}`
          : `https://codeforces.com/contest/${contestId}/problem/${index}`
        : undefined;

      existing = {
        key,
        name: name || `${contestId}${index}`,
        contestId,
        index,
        rating: sub.problem.rating,
        tags: Array.isArray(sub.problem.tags) ? sub.problem.tags : [],
        status: "tried",
        isGym,
        problemUrl: url,
      };
      problems.set(key, existing);
    } else {
      if (!existing.rating && sub.problem.rating) existing.rating = sub.problem.rating;
      if (existing.tags.length === 0 && Array.isArray(sub.problem.tags) && sub.problem.tags.length > 0) {
        existing.tags = sub.problem.tags;
      }
      if (isGym) existing.isGym = true;
    }

    const isOk = sub.verdict === "OK";
    if (isOk) {
      existing.status = "solved";
      if (!existing.firstAcTimeSeconds || sub.creationTimeSeconds < existing.firstAcTimeSeconds) {
        existing.firstAcTimeSeconds = sub.creationTimeSeconds;
      }
    } else {
      if (!existing.latestAttemptSeconds || sub.creationTimeSeconds > existing.latestAttemptSeconds) {
        existing.latestAttemptSeconds = sub.creationTimeSeconds;
        existing.lastVerdict = sub.verdict;
      }
    }
  }

  return problems;
}

/**
 * Normalizes a problem title for deduplication:
 * Strips contest prefixes ("A - ", "1. "), trailing indices (" (770A)"),
 * and non-alphanumeric characters, returning lowercase string.
 */
export function normalizeProblemTitle(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^(?:[a-z0-9]+\s*[-–.]\s*)/i, "")
    .replace(/\s*\([a-z0-9]+\)$/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Deduplicates existing logs array:
 * - Checks contestId+index from URL or problem_name prefix
 * - Merges entries with identical normalized name + rating + date
 * - Preserves manual entries, notes, and XP
 */
export function deduplicateExistingLogs(logs: CodeforcesLog[]): CodeforcesLog[] {
  const seenContestKeys = new Set<string>();
  const seenNameDateRating = new Set<string>();
  const result: CodeforcesLog[] = [];

  for (const log of logs) {
    const keyFromUrl = extractProblemKeyFromUrl(log.problem_url);
    const prefixMatch = log.problem_name?.match(/(?:^|\b)(\d+)\s*([A-Za-z0-9]+)\b/);
    const detectedKey = keyFromUrl || (prefixMatch ? `${prefixMatch[1]}-${prefixMatch[2].toUpperCase()}` : null);

    const normName = normalizeProblemTitle(log.problem_name || "");
    const dateStr = log.date || (log.created_at ? log.created_at.slice(0, 10) : "");
    const identityKey = normName && dateStr ? `${normName}|${log.rating || 0}|${dateStr}` : null;

    if (detectedKey && seenContestKeys.has(detectedKey)) {
      continue;
    }
    if (identityKey && seenNameDateRating.has(identityKey)) {
      continue;
    }

    if (detectedKey) seenContestKeys.add(detectedKey);
    if (identityKey) seenNameDateRating.add(identityKey);
    result.push(log);
  }

  return result;
}

/**
 * Deduplicate against existing logs:
 * - Deduplicates by contestId + problem index
 * - Merges entries with identical problem name + date + rating from different contests
 * - Preserves all manual entries and notes
 * - Imported problems start with xp: 0
 */
export function deduplicateAndFormatNewLogs(
  parsedProblems: Map<string, ParsedCodeforcesProblem>,
  existingLogs: CodeforcesLog[],
  handle: string
): {
  newLogs: CodeforcesLog[];
  totalUniqueProblems: number;
  newCount: number;
  totalSolvedCount: number;
  unratedSolvedCount: number;
} {
  const existingKeys = new Set<string>();
  const existingNameDateRating = new Set<string>();

  for (const log of existingLogs) {
    const keyFromUrl = extractProblemKeyFromUrl(log.problem_url);
    if (keyFromUrl) {
      existingKeys.add(keyFromUrl);
    }

    const prefixMatch = log.problem_name.match(/(?:^|\b)(\d+)\s*([A-Za-z0-9]+)\b/);
    if (prefixMatch) {
      existingKeys.add(`${prefixMatch[1]}-${prefixMatch[2].toUpperCase()}`);
    }

    const normName = normalizeProblemTitle(log.problem_name || "");
    const dateStr = log.date || (log.created_at ? log.created_at.slice(0, 10) : "");
    if (normName && dateStr) {
      existingNameDateRating.add(`${normName}|${log.rating || 0}|${dateStr}`);
    }
  }

  const newLogs: CodeforcesLog[] = [];
  const totalUniqueProblems = parsedProblems.size;

  let totalSolvedCount = 0;
  let unratedSolvedCount = 0;

  for (const prob of Array.from(parsedProblems.values())) {
    if (prob.status === "solved") {
      totalSolvedCount++;
      if (!prob.rating || prob.rating <= 0) {
        unratedSolvedCount++;
      }
    }

    const dateStr = prob.status === "solved" && prob.firstAcTimeSeconds
      ? new Date(prob.firstAcTimeSeconds * 1000).toISOString().split("T")[0]
      : prob.latestAttemptSeconds
      ? new Date(prob.latestAttemptSeconds * 1000).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const normName = normalizeProblemTitle(prob.name || "");
    const identityKey = normName && dateStr ? `${normName}|${prob.rating || 0}|${dateStr}` : null;

    // Deduplicate by contestId+index AND merge entries with same name + date + rating
    const isDuplicateKey = existingKeys.has(prob.key) || (identityKey !== null && existingNameDateRating.has(identityKey));
    if (isDuplicateKey) {
      continue;
    }

    // Register into existing tracking so multiple matches within the same batch also merge
    existingKeys.add(prob.key);
    if (identityKey) existingNameDateRating.add(identityKey);

    const solvedAt = prob.status === "solved" && prob.firstAcTimeSeconds
      ? new Date(prob.firstAcTimeSeconds * 1000).toISOString()
      : undefined;

    const newLog: CodeforcesLog = {
      id: `cf-sync-${prob.contestId || "p"}-${prob.index || "x"}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      handle: handle.trim(),
      problem_name: prob.name,
      problem_url: prob.problemUrl,
      rating: prob.rating,
      verdict: prob.status === "solved" ? "OK" : prob.lastVerdict || "FAILED",
      tags: prob.tags,
      status: prob.status,
      is_gym: prob.isGym,
      time_taken_minutes: undefined,
      date: dateStr,
      notes: undefined,
      solved_at: solvedAt,
      xp: 0,
      created_at: solvedAt || new Date().toISOString(),
    };

    newLogs.push(newLog);
  }

  return {
    newLogs,
    totalUniqueProblems,
    newCount: newLogs.length,
    totalSolvedCount,
    unratedSolvedCount,
  };
}

/**
 * Format relative or absolute last synced timestamp
 */
export function formatLastSyncedTime(timestamp: number): string {
  if (!timestamp) return "Never";
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const d = new Date(timestamp);
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
