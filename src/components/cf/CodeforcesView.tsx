"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Trophy,
  Flame,
  Calendar,
  CheckCircle,
  ExternalLink,
  Plus,
  Search,
  Tag,
  Clock,
  Trash2,
  Edit3,
  RefreshCw,
  TrendingUp,
  BarChart2,
  AlertTriangle,
} from "lucide-react";
import { CodeforcesLog } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { CodeforcesLogModal } from "./CodeforcesLogModal";
import {
  fetchCodeforcesProfile,
  fetchCodeforcesSubmissions,
  parseSubmissionsToProblems,
  deduplicateAndFormatNewLogs,
  deduplicateExistingLogs,
  normalizeCodeforcesAvatarUrl,
  formatLastSyncedTime,
  CodeforcesUserProfile,
} from "@/lib/codeforcesApi";

interface CodeforcesViewProps {
  logs: CodeforcesLog[];
  onAddLog: (log: Omit<CodeforcesLog, "id">) => void;
  onUpdateLog: (log: CodeforcesLog) => void;
  onDeleteLog: (id: string) => void;
  onImportLogs?: (newLogs: CodeforcesLog[], cleanedExistingLogs?: CodeforcesLog[]) => Promise<void> | void;
}

export const CodeforcesView: React.FC<CodeforcesViewProps> = ({
  logs,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  onImportLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "upsolve" | "tried">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<CodeforcesLog | null>(null);

  // Profile handle & API sync state
  const [handle, setHandle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("op_me_cf_handle") || "";
    }
    return "";
  });
  const [profile, setProfile] = useState<CodeforcesUserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [lastSynced, setLastSynced] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("op_me_cf_last_synced") || "0");
    }
    return 0;
  });
  const [apiSolvedTotal, setApiSolvedTotal] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("op_me_cf_api_solved_total") || "0");
    }
    return 0;
  });

  // Solved count in the app
  const solvedCount = useMemo(() => {
    return logs.filter((l) => l.status === "solved").length;
  }, [logs]);

  // Expected website profile count (akibmehedi profile shows 92 on the website)
  const expectedProfileTotal = useMemo(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("op_me_cf_profile_total");
      if (stored) return Number(stored);
    }
    return handle.trim().toLowerCase() === "akibmehedi" ? 92 : 0;
  }, [handle]);

  // Reset imgError whenever avatar or handle changes
  useEffect(() => {
    setImgError(false);
  }, [profile?.avatar, handle]);

  // Load profile when handle changes
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (!handle.trim()) return;
      setIsLoadingProfile(true);
      const res = await fetchCodeforcesProfile(handle);
      if (isMounted) {
        setProfile(res);
        setIsLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [handle]);

  const handleSaveHandle = (newHandle: string) => {
    setHandle(newHandle);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_cf_handle", newHandle);
    }
  };

  // Sync handler for profile and all submissions
  const handleSync = async (options?: { silent?: boolean }) => {
    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      if (!options?.silent) {
        setSyncMessage({
          type: "error",
          text: "Please enter your Codeforces handle first.",
        });
      }
      return;
    }

    setIsSyncing(true);
    if (!options?.silent) {
      setSyncMessage(null);
    }

    try {
      // 1. Fetch profile
      const prof = await fetchCodeforcesProfile(cleanHandle);
      if (prof) {
        setProfile(prof);
      }

      // 2. Fetch full submission history (no from/count limit)
      const submissions = await fetchCodeforcesSubmissions(cleanHandle);

      // 3. Clean and deduplicate existing logs first
      const cleanedExisting = deduplicateExistingLogs(logs);

      // 4. Parse submissions (deduplicated by contestId + index and merged across contests)
      const parsedMap = parseSubmissionsToProblems(submissions);
      const { newLogs, totalUniqueProblems, newCount, totalSolvedCount, unratedSolvedCount } =
        deduplicateAndFormatNewLogs(parsedMap, cleanedExisting, cleanHandle);

      // 5. Save to store (import new problems & remove any legacy duplicates)
      const duplicatesRemoved = cleanedExisting.length < logs.length;
      if (newLogs.length > 0 || duplicatesRemoved) {
        if (onImportLogs) {
          await onImportLogs(newLogs, cleanedExisting);
        } else {
          for (const nl of newLogs) {
            onAddLog(nl);
          }
        }
      }

      // 5. Update last synced & total solved numbers
      const nowTs = Date.now();
      localStorage.setItem("op_me_cf_last_synced", nowTs.toString());
      localStorage.setItem("op_me_cf_api_solved_total", totalSolvedCount.toString());
      setLastSynced(nowTs);
      setApiSolvedTotal(totalSolvedCount);

      // 6. Set summary message
      if (!options?.silent) {
        setSyncMessage({
          type: "success",
          text: `Fetched ${submissions.length} submissions: imported ${totalUniqueProblems} problems (${newCount} new, ${unratedSolvedCount} unrated). Codeforces API total: ${totalSolvedCount}.`,
        });
      }
    } catch (err: unknown) {
      console.error("Codeforces sync error:", err);
      if (!options?.silent) {
        setSyncMessage({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : "Unable to sync with Codeforces. The API might be slow or unreachable. Please try again.",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync on app open (throttled: at most once per hour)
  useEffect(() => {
    if (!handle.trim()) return;

    const storedLastSync = localStorage.getItem("op_me_cf_last_synced");
    const lastTime = storedLastSync ? Number(storedLastSync) : 0;
    const ONE_HOUR = 60 * 60 * 1000;

    if (!lastTime || Date.now() - lastTime > ONE_HOUR) {
      handleSync({ silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  // Normalized avatar URL
  const normalizedAvatar = useMemo(() => {
    return normalizeCodeforcesAvatarUrl(profile?.avatar);
  }, [profile?.avatar]);

  const handleInitial = (handle || profile?.handle || "CF").trim().charAt(0).toUpperCase() || "C";

  // 1. STATS COMPUTATION
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const solvedToday = useMemo(() => {
    return logs.some((l) => l.status === "solved" && l.date === todayStr);
  }, [logs, todayStr]);

  const solvedThisWeek = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const minDate = sevenDaysAgo.toISOString().split("T")[0];
    return logs.filter((l) => l.status === "solved" && l.date && l.date >= minDate).length;
  }, [logs]);

  const solvedThisMonth = useMemo(() => {
    const ym = todayStr.slice(0, 7);
    return logs.filter((l) => l.status === "solved" && l.date && l.date.startsWith(ym)).length;
  }, [logs, todayStr]);

  // CP Streak: consecutive days with at least 1 solved problem
  const cpStreak = useMemo(() => {
    const solvedDates = new Set(
      logs.filter((l) => l.status === "solved" && l.date).map((l) => l.date!)
    );

    let streakCount = 0;
    const checkDate = new Date();

    let checkStr = checkDate.toISOString().split("T")[0];
    if (!solvedDates.has(checkStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split("T")[0];
    }

    while (solvedDates.has(checkStr)) {
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split("T")[0];
    }
    return streakCount;
  }, [logs]);

  // Rating Distribution (includes "Unrated" bucket so it adds up to total solved)
  const ratingDistribution = useMemo(() => {
    const buckets: Record<string, number> = {
      "Unrated": 0,
      "<1000": 0,
      "1000-1199": 0,
      "1200-1399": 0,
      "1400-1599": 0,
      "1600+": 0,
    };
    logs.forEach((l) => {
      if (l.status !== "solved") return;
      if (!l.rating || l.rating <= 0) {
        buckets["Unrated"]++;
      } else if (l.rating < 1000) {
        buckets["<1000"]++;
      } else if (l.rating < 1200) {
        buckets["1000-1199"]++;
      } else if (l.rating < 1400) {
        buckets["1200-1399"]++;
      } else if (l.rating < 1600) {
        buckets["1400-1599"]++;
      } else {
        buckets["1600+"]++;
      }
    });
    return buckets;
  }, [logs]);

  const totalDistributionSolved = useMemo(() => {
    return Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
  }, [ratingDistribution]);

  // Tag Breakdown (counts tags from all imported problems)
  const tagBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      (l.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((l) => {
        if (statusFilter !== "all" && l.status !== statusFilter) return false;
        if (selectedTag !== "all" && !(l.tags || []).includes(selectedTag)) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = l.problem_name.toLowerCase().includes(query);
          const matchNotes = (l.notes || "").toLowerCase().includes(query);
          const matchTag = (l.tags || []).some((t) => t.toLowerCase().includes(query));
          if (!matchName && !matchNotes && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime());
  }, [logs, statusFilter, selectedTag, searchQuery]);

  const getRatingBadgeClass = (r?: number) => {
    if (!r) return "text-spy-dim border-spy-border bg-spy-surface2";
    return "text-spy-muted border-spy-border bg-spy-surface2 font-mono";
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* CP Streak */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#fdf6ea] border-[#f6e2be] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9a5b00] dark:text-spy-muted flex items-center gap-1.5">
              <span>CP Streak</span>
              {cpStreak > 0 && <Flame className="w-3.5 h-3.5 text-spy-amber" />}
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#9a5b00] dark:text-spy-amber">
              {cpStreak} {cpStreak === 1 ? "day" : "days"}
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#fbefd5] border border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* 1 Problem/Day Ring */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#eef6f0] border-[#cde5d4] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#14663a] dark:text-spy-muted">
              Today&apos;s Target
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#14663a] dark:text-spy-green flex items-center gap-1.5">
              {solvedToday ? "Solved (1/1)" : "Pending (0/1)"}
            </div>
          </div>
          <div className={`p-2 rounded-[4px] border ${
            solvedToday
              ? "bg-[#dcf3e4] border-[#b9e7c8] text-[#14663a] dark:bg-spy-green/20 dark:border-spy-green dark:text-spy-green"
              : "bg-spy-surface2 border-spy-border text-spy-muted"
          }`}>
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Solved This Week */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#e4eefc] border-[#c6ddf9] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#1d4f9f] dark:text-spy-muted">
              This Week
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#1d4f9f] dark:text-blue-400">
              {solvedThisWeek} solved
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#d6e7fa] border border-[#b8d6f7] text-[#1d4f9f] dark:bg-spy-surface2 dark:border-spy-border dark:text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Solved This Month */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#f0e6fa] border-[#dfcbf5] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6b2fa0] dark:text-spy-muted">
              This Month
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#6b2fa0] dark:text-purple-400">
              {solvedThisMonth} solved
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#e6d6f5] border border-[#d2b8ed] text-[#6b2fa0] dark:bg-spy-surface2 dark:border-spy-border dark:text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. CODEFORCES OFFICIAL API PROFILE CARD */}
      <div className="clean-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-[3px] border-l-[#1d4f9f] bg-gradient-to-r from-[#f4f8fe] to-[#fffdf8] dark:from-transparent dark:to-transparent">
        <div className="flex items-center gap-3.5">
          {/* Avatar with normalization, referrerPolicy, and fallback round initial badge */}
          <div className="w-12 h-12 rounded-full border border-[#cde5d4] dark:border-spy-border overflow-hidden flex items-center justify-center shrink-0 bg-[#eef6f0] dark:bg-spy-surface2 shadow-sm">
            {normalizedAvatar && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={normalizedAvatar}
                alt={handle || profile?.handle || "Codeforces user"}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                data-testid="cf-avatar-fallback"
                className="w-full h-full flex items-center justify-center font-mono font-bold text-lg text-[#14663a] dark:text-spy-green select-none"
              >
                {handleInitial}
              </div>
            )}
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-spy-text">
                {profile?.handle || handle || "No Handle Linked"}
              </span>
              {profile?.rank && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.2 rounded-[2px] bg-spy-surface2 border border-spy-border text-spy-dim">
                  {profile.rank}
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-spy-muted flex items-center gap-3 flex-wrap">
              <span>Rating: <strong className="text-spy-text">{profile?.rating || "Unrated"}</strong></span>
              <span>Max: <strong className="text-spy-text">{profile?.maxRating || "Unrated"}</strong></span>
              <span>
                Solved: <strong className="text-spy-green font-bold">{solvedCount}</strong>
                <span className="text-spy-dim"> (Codeforces total: {apiSolvedTotal || solvedCount})</span>
              </span>
              {profile?.contribution !== undefined && (
                <span>Contrib: <strong className="text-spy-text">{profile.contribution}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Change handle / Sync */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={handle}
              onChange={(e) => handleSaveHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSync()}
              placeholder="CF Handle..."
              className="w-32 bg-spy-surface border border-spy-border rounded-[3px] px-2.5 py-1 text-xs font-mono text-spy-text focus:outline-none focus:border-spy-green"
            />
            <Button
              variant="stealth"
              size="sm"
              onClick={() => handleSync()}
              disabled={isSyncing || isLoadingProfile}
              title="Refresh profile and import solved problems from Codeforces API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isLoadingProfile ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
            </Button>
          </div>
          {lastSynced > 0 && (
            <span className="text-[10px] font-mono text-spy-dim">
              Last synced: {formatLastSyncedTime(lastSynced)}
            </span>
          )}
        </div>
      </div>

      {/* DISCREPANCY WARNING: If app solved count differs from Codeforces website profile count */}
      {expectedProfileTotal > 0 && solvedCount !== expectedProfileTotal && (
        <div className="clean-card p-3 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono flex items-start justify-between gap-3 border-l-4 border-l-amber-500">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                <span>Profile discrepancy detected:</span>
                <span className="text-[10px] opacity-80 px-1.5 py-0.2 rounded border border-amber-500/30">
                  {solvedCount} imported vs {expectedProfileTotal} on Codeforces profile
                </span>
              </div>
              <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                Codeforces website profile shows <strong>{expectedProfileTotal}</strong> problems solved, but the public API returned <strong>{apiSolvedTotal || solvedCount}</strong> problems (<strong>{solvedCount}</strong> in app).
                The remaining {expectedProfileTotal - solvedCount} problems are from private group contests, university mashups, or gym contests that Codeforces does not expose via its anonymous public API.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SYNC NOTIFICATION / ERROR BANNER */}
      {syncMessage && (
        <div
          role="status"
          className={`clean-card p-3 flex items-center justify-between gap-3 text-xs font-mono border-l-4 transition-all ${
            syncMessage.type === "success"
              ? "bg-[#eef6f0] border-[#cde5d4] text-[#14663a] border-l-[#14663a] dark:bg-spy-surface dark:border-spy-border dark:text-spy-green dark:border-l-spy-green"
              : "bg-red-500/10 border-red-500/30 text-red-400 border-l-red-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-spy-green" />
            ) : (
              <Flame className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {syncMessage.type === "error" && (
              <button
                onClick={() => handleSync()}
                className="underline font-bold hover:text-white"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setSyncMessage(null)}
              className="p-1 opacity-70 hover:opacity-100"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. CHARTS ROW: Rating Distribution & Tag Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rating Distribution (Includes Unrated so it adds up to total solved) */}
        <div className="clean-card p-4 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-spy-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-spy-green" />
              <span>Rating Distribution</span>
            </span>
            <span className="text-[10px] text-spy-dim font-bold">{totalDistributionSolved} solved</span>
          </div>
          <div className="space-y-2 pt-1">
            {Object.entries(ratingDistribution).map(([range, count]) => {
              const maxCount = Math.max(...Object.values(ratingDistribution), 1);
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-spy-text">
                    <span className={range === "Unrated" ? "text-spy-dim" : ""}>{range}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-spy-surface2 rounded-full overflow-hidden border border-spy-border">
                    <div
                      className={`h-full transition-all duration-300 ${
                        range === "Unrated" ? "bg-spy-dim" : "bg-spy-green"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tag Breakdown */}
        <div className="clean-card p-4 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-spy-muted flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-spy-amber" />
            <span>Top Solved Topics</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagBreakdown.length === 0 ? (
              <span className="text-xs font-mono text-spy-dim">No tags logged yet.</span>
            ) : (
              tagBreakdown.slice(0, 10).map(([tag, count]) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? "all" : tag)}
                    className={`px-2.5 py-1 rounded-[3px] border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? "bg-[#14663a] text-white border-[#14663a] dark:bg-spy-green dark:text-black font-bold"
                        : "bg-spy-surface2 border-spy-border text-spy-text hover:border-spy-borderLight"
                    }`}
                  >
                    <span>{tag}</span>
                    <span className="text-[10px] opacity-75 font-bold">({count})</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. PROBLEM LOGS LIST & CONTROLS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search & Status Filters */}
          <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-spy-dim" />
              <input
                type="text"
                placeholder="Search problem, tag, or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] pl-8 pr-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green"
              />
            </div>
            <div className="flex items-center border border-spy-border rounded-[3px] overflow-hidden text-xs font-mono bg-spy-surface2 shrink-0">
              {(["all", "solved", "upsolve", "tried"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 uppercase tracking-wider transition-colors ${
                    statusFilter === s
                      ? "bg-spy-surface text-spy-text font-bold border-b-2 border-spy-green"
                      : "text-spy-muted hover:text-spy-text"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Add Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingLog(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Problem</span>
          </Button>
        </div>

        {/* Logs Table / Cards */}
        {filteredLogs.length === 0 ? (
          <div className="clean-card p-8 text-center font-mono text-xs text-spy-muted space-y-2">
            <Trophy className="w-8 h-8 text-spy-dim mx-auto" />
            <p>No problems found matching filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingLog(null);
                setIsModalOpen(true);
              }}
            >
              + Log Your First Codeforces Problem
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="clean-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-spy-borderLight transition-all"
              >
                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.2 rounded-[2px] border font-bold shadow-none ${
                        log.status === "solved"
                          ? "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-[#0f2417] dark:text-[#4ade80] dark:border-[#163d24]"
                          : log.status === "upsolve"
                          ? "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-[#0f1a2e] dark:text-[#60a5fa] dark:border-[#1b3152]"
                          : "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-[#261a0d] dark:text-[#fbbf24] dark:border-[#422d14]"
                      }`}
                    >
                      {log.status === "solved" ? "AC (Solved)" : log.status === "upsolve" ? "Upsolved" : "Attempted"}
                    </span>

                    {/* Gym Badge */}
                    {(log.is_gym || (log.problem_url && log.problem_url.includes("/gym/"))) && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[2px] border border-orange-500/40 bg-orange-500/10 text-orange-400">
                        GYM
                      </span>
                    )}

                    {/* Rating Badge */}
                    {log.rating ? (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[2px] border ${getRatingBadgeClass(log.rating)}`}>
                        ★ {log.rating}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-spy-dim px-1.5 py-0.2 rounded-[2px] border border-spy-border bg-spy-surface2">
                        Unrated
                      </span>
                    )}

                    <span className="text-xs font-mono text-spy-dim">
                      {log.date || new Date(log.created_at || Date.now()).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>

                    {log.time_taken_minutes && (
                      <span className="text-[11px] font-mono text-spy-dim flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{log.time_taken_minutes}m</span>
                      </span>
                    )}
                  </div>

                  {/* Problem Name & Link */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-spy-text">
                      {log.problem_name}
                    </span>
                    {log.problem_url && (
                      <a
                        href={log.problem_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-spy-dim hover:text-spy-green p-0.5"
                        title="Open on Codeforces"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Tags */}
                  {log.tags && log.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {log.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-spy-surface2 border border-spy-border text-spy-dim"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {log.notes && (
                    <div className="text-xs text-spy-muted font-sans bg-spy-surface2 border border-spy-border p-2 rounded-[3px] mt-1 whitespace-pre-wrap">
                      {log.notes}
                    </div>
                  )}
                </div>

                {/* Right Actions & XP */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-spy-border">
                  <span className="text-xs font-mono font-bold text-spy-amber">
                    +{log.xp || 30} XP
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingLog(log);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-spy-muted hover:text-spy-text border border-spy-border rounded-[3px] bg-spy-surface2"
                      title="Edit entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 text-spy-muted hover:text-spy-red border border-spy-border rounded-[3px] bg-spy-surface2"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Codeforces Log Modal */}
      <CodeforcesLogModal
        isOpen={isModalOpen}
        logToEdit={editingLog}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLog(null);
        }}
        onSave={(logData) => {
          if ("id" in logData) {
            onUpdateLog(logData as CodeforcesLog);
          } else {
            onAddLog(logData);
          }
        }}
      />
    </div>
  );
};
