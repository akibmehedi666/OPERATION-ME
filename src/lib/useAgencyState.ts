"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mission, 
  Category, 
  ClassScheduleItem, 
  Priority,
  TimeBlock,
  AcademicEvent,
  RecurringRule,
  Course,
  CourseResource,
  LectureLog,
  CodeforcesLog,
  CyberTopic,
  ResearchPaper,
  SideProject,
  WeeklyReview,
  NotificationSettings,
  DayOfWeek,
  CyberTopicStatus,
  FeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  TuitionException,
} from "@/types/database";
import { 
  DEFAULT_NOTIFICATION_SETTINGS,
} from "@/lib/seeds";
import { 
  getDaysOfWeek, 
  getWeekStartDate, 
  getWeekdayFromDate, 
  formatDateKey 
} from "@/lib/scheduleResolver";
import { autoScheduleMissions } from "@/lib/plannerScheduler";
import { generateDailyAutoMissions, calculateTuitionDeadline } from "@/lib/recurringGenerator";
import { createClient } from "@/lib/supabase/client";
import { validateSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { 
  ThemePreference, 
  getStoredThemePreference, 
  saveThemePreference 
} from "@/lib/theme";
import { getRankFromXp } from "@/lib/rank";
import { 
  deduplicateExistingLogs,
  findDuplicateLogIds,
  normalizeCodeforcesHandle,
} from "@/lib/codeforcesApi";
import { ensureStructureData } from "@/lib/ensureStructure";
import { ErrorToastItem } from "@/components/ui/ErrorToastContainer";
import { soundFX } from "@/lib/sound";

// Unified Data Layer modules
import {
  listMissions,
  createMission as createMissionData,
  updateMission as updateMissionData,
  deleteMission as deleteMissionData,
  deleteMissions as deleteMissionsData,
} from "./data/missions";
import { listCategories } from "./data/categories";
import { listClassSchedule, replaceTuitionSchedule as replaceTuitionScheduleData } from "./data/classSchedule";
import {
  listTimeBlocks,
  createTimeBlock as createTimeBlockData,
  updateTimeBlock as updateTimeBlockData,
  deleteTimeBlock as deleteTimeBlockData,
  replaceTuitionBlocks as replaceTuitionBlocksData,
} from "./data/timeBlocks";
import {
  listAcademicEvents,
  createAcademicEvent as createAcademicEventData,
  updateAcademicEvent as updateAcademicEventData,
  deleteAcademicEvent as deleteAcademicEventData,
} from "./data/academicEvents";
import {
  listRecurringRules,
  createRecurringRule as createRecurringRuleData,
  updateRecurringRule as updateRecurringRuleData,
  deleteRecurringRule as deleteRecurringRuleData,
} from "./data/recurringRules";
import { listCourses, updateCourse as updateCourseData } from "./data/courses";
import {
  listLectureLogs,
  createLectureLog as createLectureLogData,
  updateLectureLog as updateLectureLogData,
  deleteLectureLog as deleteLectureLogData,
} from "./data/lectureLogs";
import {
  listPapers,
  createPaper as createPaperData,
  updatePaper as updatePaperData,
  deletePaper as deletePaperData,
} from "./data/papers";
import {
  listSideProjects,
  createSideProject as createSideProjectData,
  updateSideProject as updateSideProjectData,
  deleteSideProject as deleteSideProjectData,
} from "./data/sideProjects";
import {
  listCyberTopics,
  createCyberTopic as createCyberTopicData,
  updateCyberTopic as updateCyberTopicData,
} from "./data/cyberTopics";
import {
  listCfLogs,
  createCfLog as createCfLogData,
  upsertCfLogs as upsertCfLogsData,
  updateCfLog as updateCfLogData,
  deleteCfLog as deleteCfLogData,
  deleteCfLogs as deleteCfLogsData,
} from "./data/cfLogs";
import { listWeeklyReviews, saveWeeklyReview as saveWeeklyReviewData } from "./data/weeklyReviews";
import {
  listTuitionExceptions,
  createTuitionException as createTuitionExceptionData,
  createTuitionExceptionsBatch as createTuitionExceptionsBatchData,
  deleteTuitionException as deleteTuitionExceptionData,
} from "./data/tuitionExceptions";
import { fetchUserSettings, updateUserSettings as updateUserSettingsData } from "./data/userSettings";
import { fetchTotalXp, logXpEvent as logXpEventData, fetchStreak, updateStreak as updateStreakData } from "./data/gamification";

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Progress tables wiped on Reset All Progress.
// Structure tables (categories, courses, class_schedule, time_blocks, academic_events, recurring_rules, cyber_topics, user_settings)
// are strictly PRESERVED and never deleted.
export const RESET_PROGRESS_TABLES = [
  "missions",
  "cf_log",
  "lecture_logs",
  "papers",
  "side_projects",
  "weekly_reviews",
  "xp_events",
  "streaks",
] as const;

export function useAgencyState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [errorToasts, setErrorToasts] = useState<ErrorToastItem[]>([]);
  const [structureLoadingError, setStructureLoadingError] = useState<string | null>(null);
  const [dataLoadingError, setDataLoadingError] = useState<string | null>(null);
  const [supabaseConfigError, setSupabaseConfigError] = useState<string | null>(null);

  const showErrorToast = useCallback((title: string, message: string) => {
    const id = `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setErrorToasts((prev) => [...prev, { id, title, message, timestamp: Date.now() }]);
  }, []);

  const dismissErrorToast = useCallback((id: string) => {
    setErrorToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Application Data State - strictly populated from Cloud
  const [missions, setMissions] = useState<Mission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schedule, setSchedule] = useState<ClassScheduleItem[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectureLogs, setLectureLogs] = useState<LectureLog[]>([]);
  const [cyberTopics, setCyberTopics] = useState<CyberTopic[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [sideProjects, setSideProjects] = useState<SideProject[]>([]);
  const [cfLogs, setCfLogs] = useState<CodeforcesLog[]>([]);
  const [cfHandle, setCfHandle] = useState<string>("");
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [tuitionExceptions, setTuitionExceptions] = useState<TuitionException[]>([]);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();
  const fetchedUserIdRef = useRef<string | null>(null);

  // Load all cloud tables for the authenticated user
  const loadAllCloudData = useCallback(async (userId: string) => {
    try {
      setDataLoadingError(null);

      // 1. Run ensureStructureData baseline check
      if (supabase) {
        try {
          const structRes = await ensureStructureData(supabase, userId);
          if (!structRes.success) {
            console.warn("[useAgencyState] Ensure structure notice:", structRes.error);
            setStructureLoadingError(structRes.error || null);
          } else {
            setStructureLoadingError(null);
          }
        } catch (structErr: unknown) {
          const msg = structErr instanceof Error ? structErr.message : "Structure sync notice";
          console.warn("[useAgencyState] Ensure structure notice:", msg);
        }
      }

      // 2. Fetch all tables concurrently from the unified data layer
      const [
        catsRes,
        schedRes,
        tbRes,
        aeRes,
        rrRes,
        coursesRes,
        missionsRes,
        xpRes,
        streakRes,
        logsRes,
        topicsRes,
        papersRes,
        projectsRes,
        settingsRes,
        cfRes,
        reviewsRes,
        tuitionExRes,
      ] = await Promise.all([
        listCategories(userId),
        listClassSchedule(userId),
        listTimeBlocks(userId),
        listAcademicEvents(userId),
        listRecurringRules(userId),
        listCourses(userId),
        listMissions(userId),
        fetchTotalXp(userId),
        fetchStreak(userId),
        listLectureLogs(userId),
        listCyberTopics(userId),
        listPapers(userId),
        listSideProjects(userId),
        fetchUserSettings(userId),
        listCfLogs(userId),
        listWeeklyReviews(userId),
        listTuitionExceptions(userId),
      ]);

      // Check for total communication failure
      if (
        catsRes.error &&
        coursesRes.error &&
        missionsRes.error &&
        tbRes.error
      ) {
        const primaryError = missionsRes.error || catsRes.error || "Failed to load cloud database";
        setDataLoadingError(primaryError);
        showErrorToast("Cloud Synchronization Error", primaryError);
        return false;
      }

      setCategories(catsRes.data || []);
      setSchedule(schedRes.data || []);
      setTimeBlocks(tbRes.data || []);
      setAcademicEvents(aeRes.data || []);
      setRecurringRules(rrRes.data || []);
      setCourses(coursesRes.data || []);
      let initialMissions = missionsRes.data || [];
      // Fix Sun Nov 8 overlap if Prepare tuition lesson sits at 4:30 PM beside tuition
      const prepSunMission = initialMissions.find(
        (m) =>
          m.title.toLowerCase().includes("prepare") &&
          m.scheduled_start &&
          m.scheduled_start.startsWith("2026-11-08") &&
          (m.scheduled_start.includes("16:30") || m.scheduled_start.includes("17:00") || m.scheduled_start.includes("18:00"))
      );
      if (prepSunMission) {
        prepSunMission.scheduled_start = "2026-11-08T15:30:00";
        prepSunMission.scheduled_end = "2026-11-08T16:15:00";
        updateMissionData(prepSunMission.id, {
          scheduled_start: "2026-11-08T15:30:00",
          scheduled_end: "2026-11-08T16:15:00",
        }).catch(console.error);
        initialMissions = initialMissions.map((m) => (m.id === prepSunMission.id ? { ...prepSunMission } : m));
      }

      setMissions(initialMissions);
      setTotalXp(xpRes.data ?? 0);
      setStreak(streakRes.data?.current_streak ?? 0);
      setLectureLogs(logsRes.data || []);
      setCyberTopics(topicsRes.data || []);
      setResearchPapers(papersRes.data || []);
      setSideProjects(projectsRes.data || []);
      setWeeklyReviews(reviewsRes.data || []);
      setTuitionExceptions(tuitionExRes.data || []);

      if (cfRes.data) {
        const cleaned = deduplicateExistingLogs(cfRes.data);
        setCfLogs(cleaned);
      }

      if (settingsRes.data) {
        if (settingsRes.data.features && typeof settingsRes.data.features === "object") {
          setFeatures({
            ...DEFAULT_FEATURE_FLAGS,
            ...settingsRes.data.features,
            dashboard: true,
            missions: true,
          });
        }
        if (settingsRes.data.cf_handle) {
          const norm = normalizeCodeforcesHandle(settingsRes.data.cf_handle);
          setCfHandle(norm);
        }
        if (settingsRes.data.default_theme) {
          saveThemePreference(settingsRes.data.default_theme);
        }
        if (settingsRes.data.sound_enabled !== undefined) {
          soundFX.setEnabled(settingsRes.data.sound_enabled);
        }
        if (settingsRes.data.notification_settings && Object.keys(settingsRes.data.notification_settings).length > 0) {
          setNotificationSettings(settingsRes.data.notification_settings);
        }
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data from Supabase";
      console.error("[useAgencyState] loadAllCloudData exception:", err);
      setDataLoadingError(msg);
      showErrorToast("Cloud Connection Failed", msg);
      return false;
    }
  }, [supabase, showErrorToast]);

  // Session & Auth check on mount
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      const config = validateSupabaseConfig();
      if (!config.isConfigured || !supabase) {
        setSupabaseConfigError(config.message);
        setLoading(false);
        return;
      }

      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 2000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (isCancelled) return;

        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentUser({ id: session.user.id, email: session.user.email || "" });
          fetchedUserIdRef.current = session.user.id;
          await loadAllCloudData(session.user.id);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Session verification error:", err);
        if (!isCancelled) {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
  }, [supabase, loadAllCloudData]);

  // Auth state listener: automatically handle token refreshes and session changes
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentUser({ id: session.user.id, email: session.user.email || "" });
          if (fetchedUserIdRef.current !== session.user.id) {
            fetchedUserIdRef.current = session.user.id;
            setLoading(true);
            await loadAllCloudData(session.user.id);
            setLoading(false);
          }
        } else if (event === "INITIAL_SESSION") {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        fetchedUserIdRef.current = null;
        setIsAuthenticated(false);
        setCurrentUser(null);
        setMissions([]);
        setCourses([]);
        setTimeBlocks([]);
        setAcademicEvents([]);
        setRecurringRules([]);
        setLectureLogs([]);
        setCyberTopics([]);
        setResearchPapers([]);
        setSideProjects([]);
        setCfLogs([]);
        setWeeklyReviews([]);
        setTotalXp(0);
        setStreak(0);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadAllCloudData]);

  // Auth: Email login
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: "Supabase client unavailable" };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        setIsAuthenticated(true);
        setCurrentUser({ id: data.user.id, email: data.user.email || "" });
        fetchedUserIdRef.current = data.user.id;
        setLoading(true);
        await loadAllCloudData(data.user.id);
        setLoading(false);
        return { success: true };
      }
      return { success: false, error: "Authentication failed. No user returned." };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication handshake failed";
      return { success: false, error: message };
    }
  };

  // Password Reset via Supabase
  const resetPassword = async (email: string) => {
    if (!supabase) return { success: false, error: "Supabase client unavailable" };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return { success: false, error: error.message };
      return { success: true, message: "Password reset link sent to your email." };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password reset request failed";
      return { success: false, error: message };
    }
  };

  // Logout
  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Error signing out of Supabase:", e);
      }
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    fetchedUserIdRef.current = null;
  };

  // Retry loading data
  const retryLoadData = async () => {
    if (currentUser?.id) {
      setLoading(true);
      await loadAllCloudData(currentUser.id);
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // ENTITY MUTATIONS (Strictly Cloud-First via src/lib/data/*)
  // -------------------------------------------------------------

  // Add Mission
  const addMission = async (
    missionData: Partial<Mission>
  ): Promise<{ success: boolean; error?: string; mission?: Mission }> => {
    if (!currentUser?.id) {
      showErrorToast("Authentication Required", "You must be authenticated to create missions.");
      return { success: false, error: "Active user session not found. Please log in again." };
    }

    const res = await createMissionData(missionData, currentUser.id);
    if (res.error || !res.data) {
      const err = res.error || "Failed to persist mission in Supabase";
      showErrorToast("Mission Creation Failed", err);
      return { success: false, error: err };
    }

    setMissions((prev) => [res.data!, ...prev]);
    return { success: true, mission: res.data };
  };

  // Edit Mission
  const editMission = async (
    missionData: Partial<Mission>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!missionData.id) return { success: false, error: "Missing mission identifier" };

    const res = await updateMissionData(missionData.id, missionData);
    if (res.error || !res.data) {
      const err = res.error || "Failed to update mission in Supabase";
      showErrorToast("Mission Update Failed", err);
      return { success: false, error: err };
    }

    setMissions((prev) => prev.map((m) => (m.id === missionData.id ? res.data! : m)));
    return { success: true };
  };

  // Delete Mission
  const deleteMission = async (
    missionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await deleteMissionData(missionId);
    if (res.error) {
      showErrorToast("Mission Delete Failed", res.error);
      return { success: false, error: res.error };
    }

    setMissions((prev) => prev.filter((m) => m.id !== missionId));
    return { success: true };
  };

  // Set as Active Mission
  const setActiveMission = async (mission: Mission) => {
    const res = await updateMissionData(mission.id, { status: "active" });
    if (res.error) {
      showErrorToast("Set Active Mission Failed", res.error);
      return;
    }
    setMissions((prev) => prev.map((m) => (m.id === mission.id ? { ...m, status: "active" } : m)));
  };

  // Complete Mission + Auto-Assign Next Target
  const completeMission = async (
    mission: Mission,
    completionNote?: string,
    timeSpentMinutes?: number
  ) => {
    const nowIso = new Date().toISOString();
    const xpAwarded = mission.xp || 50;

    // 1. Update status to completed in Supabase
    const updateRes = await updateMissionData(mission.id, {
      status: "completed",
      completed_at: nowIso,
      completion_note: completionNote || null,
      time_spent_minutes: timeSpentMinutes || null,
    });

    if (updateRes.error) {
      showErrorToast("Complete Mission Failed", updateRes.error);
      return {
        completedMission: mission,
        nextMission: null,
        xpAwarded: 0,
        isFirstToday: false,
        isRankUp: false,
        oldRank: getRankFromXp(totalXp).rank,
        newRank: getRankFromXp(totalXp).rank,
        newStreak: streak,
      };
    }

    // 2. Award XP
    const newTotalXp = totalXp + xpAwarded;
    const oldRank = getRankFromXp(totalXp).rank;
    const newRank = getRankFromXp(newTotalXp).rank;
    const isRankUp = oldRank !== newRank;

    const todayDateStr = new Date().toDateString();
    const hasCompletedEarlierToday = missions.some(
      (m) => m.completed_at && new Date(m.completed_at).toDateString() === todayDateStr
    );
    const isFirstToday = !hasCompletedEarlierToday;

    setTotalXp(newTotalXp);
    const newStreak = streak + 1;
    setStreak(newStreak);

    if (currentUser?.id) {
      await logXpEventData(
        currentUser.id,
        xpAwarded,
        `Mission Accomplished: [${mission.codename}] ${mission.title}`,
        mission.id
      );
      await updateStreakData(
        currentUser.id,
        newStreak,
        Math.max(newStreak, 5),
        new Date().toISOString().split("T")[0]
      );
    }

    // 3. Update local missions list
    let updatedList = missions.map((m) =>
      m.id === mission.id
        ? {
            ...m,
            status: "completed" as const,
            completed_at: nowIso,
            completion_note: completionNote || null,
            time_spent_minutes: timeSpentMinutes || null,
          }
        : m
    );

    // 4. Auto-assign next mission
    const pendingTargets = updatedList.filter(
      (m) => m.id !== mission.id && m.status !== "completed"
    );

    let nextTarget: Mission | null = null;
    if (pendingTargets.length > 0) {
      pendingTargets.sort((a, b) => {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 1;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 1;
        if (weightB !== weightA) return weightB - weightA;
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        return 0;
      });

      nextTarget = pendingTargets[0];
      await updateMissionData(nextTarget.id, { status: "active" });

      updatedList = updatedList.map((m) =>
        m.id === nextTarget!.id ? { ...m, status: "active" as const } : m
      );
    }

    setMissions(updatedList);

    return {
      completedMission: {
        ...mission,
        status: "completed" as const,
        completed_at: nowIso,
        completion_note: completionNote || null,
        time_spent_minutes: timeSpentMinutes || null,
      },
      nextMission: nextTarget,
      xpAwarded,
      isFirstToday,
      isRankUp,
      oldRank,
      newRank,
      newStreak,
    };
  };

  // Update debrief note or time spent
  const updateMissionNote = async (
    missionId: string,
    completionNote?: string,
    timeSpentMinutes?: number
  ) => {
    const res = await updateMissionData(missionId, {
      completion_note: completionNote || null,
      time_spent_minutes: timeSpentMinutes || null,
    });
    if (res.error) {
      showErrorToast("Update Note Failed", res.error);
      return;
    }
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              completion_note: completionNote !== undefined ? completionNote : m.completion_note,
              time_spent_minutes: timeSpentMinutes !== undefined ? timeSpentMinutes : m.time_spent_minutes,
            }
          : m
      )
    );
  };

  // Time Blocks
  const addTimeBlock = async (block: Omit<TimeBlock, "id" | "created_at">) => {
    if (!currentUser?.id) throw new Error("Authentication required");
    const res = await createTimeBlockData(block, currentUser.id);
    if (res.error || !res.data) {
      const err = res.error || "Failed to create time block";
      showErrorToast("Time Block Sync Failed", err);
      throw new Error(err);
    }
    setTimeBlocks((prev) => [...prev, res.data!]);
    return res.data;
  };

  const updateTimeBlock = async (id: string, updates: Partial<TimeBlock>) => {
    const res = await updateTimeBlockData(id, updates);
    if (res.error || !res.data) {
      const err = res.error || "Failed to update time block";
      showErrorToast("Time Block Update Failed", err);
      throw new Error(err);
    }
    setTimeBlocks((prev) => prev.map((b) => (b.id === id ? res.data! : b)));
  };

  const deleteTimeBlock = async (id: string) => {
    const res = await deleteTimeBlockData(id);
    if (res.error) {
      showErrorToast("Time Block Delete Failed", res.error);
      throw new Error(res.error);
    }
    setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // Academic Events
  const addAcademicEvent = async (event: Omit<AcademicEvent, "id" | "created_at">) => {
    if (!currentUser?.id) throw new Error("Authentication required");
    const res = await createAcademicEventData(event, currentUser.id);
    if (res.error || !res.data) {
      const err = res.error || "Failed to create academic event";
      showErrorToast("Key Date Sync Failed", err);
      throw new Error(err);
    }
    setAcademicEvents((prev) => [...prev, res.data!]);
    return res.data;
  };

  const updateAcademicEvent = async (id: string, updates: Partial<AcademicEvent>) => {
    const res = await updateAcademicEventData(id, updates);
    if (res.error || !res.data) {
      const err = res.error || "Failed to update academic event";
      showErrorToast("Key Date Update Failed", err);
      throw new Error(err);
    }
    setAcademicEvents((prev) => prev.map((e) => (e.id === id ? res.data! : e)));
  };

  const deleteAcademicEvent = async (id: string) => {
    const res = await deleteAcademicEventData(id);
    if (res.error) {
      showErrorToast("Key Date Delete Failed", res.error);
      throw new Error(res.error);
    }
    setAcademicEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Planner Mission Scheduling
  const scheduleMissionToBlock = async (
    missionId: string,
    blockId: string,
    startTime?: string,
    endTime?: string,
    isAuto: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await updateMissionData(missionId, {
      scheduled_block_id: blockId,
      scheduled_start: startTime || null,
      scheduled_end: endTime || null,
      deadline: endTime || null,
      is_auto_scheduled: isAuto,
    });

    if (res.error) {
      showErrorToast("Schedule Mission Failed", res.error);
      return { success: false, error: res.error };
    }

    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              scheduled_block_id: blockId,
              scheduled_start: startTime || m.scheduled_start,
              scheduled_end: endTime || m.scheduled_end,
              deadline: endTime || m.deadline,
              is_auto_scheduled: isAuto,
            }
          : m
      )
    );
    return { success: true };
  };

  const confirmAutoScheduledMission = async (missionId: string) => {
    const res = await updateMissionData(missionId, { is_auto_scheduled: false });
    if (res.error) {
      showErrorToast("Confirm Mission Failed", res.error);
      return;
    }
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, is_auto_scheduled: false } : m))
    );
  };

  const unscheduleMission = async (missionId: string) => {
    const res = await updateMissionData(missionId, {
      scheduled_block_id: null,
      scheduled_start: null,
      scheduled_end: null,
      is_auto_scheduled: false,
    });
    if (res.error) {
      showErrorToast("Unschedule Mission Failed", res.error);
      return;
    }
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              scheduled_block_id: null,
              scheduled_start: null,
              scheduled_end: null,
              is_auto_scheduled: false,
            }
          : m
      )
    );
  };

  const runAutoScheduler = (weekStartDate: Date) => {
    const result = autoScheduleMissions(missions, timeBlocks, academicEvents, weekStartDate, categories);
    if (result.scheduledCount > 0) {
      setMissions(result.updatedMissions);
      result.updatedMissions.forEach((m) => {
        if (m.is_auto_scheduled && m.scheduled_block_id) {
          updateMissionData(m.id, {
            scheduled_block_id: m.scheduled_block_id,
            scheduled_start: m.scheduled_start,
            scheduled_end: m.scheduled_end,
            deadline: m.deadline,
            is_auto_scheduled: true,
          }).catch(console.error);
        }
      });
    }
    return result.scheduledCount;
  };

  // Recurring Rules
  const toggleRecurringRule = async (ruleId: string, isActive: boolean) => {
    const res = await updateRecurringRuleData(ruleId, { is_active: isActive });
    if (res.error) {
      showErrorToast("Recurring Rule Update Failed", res.error);
      return;
    }
    setRecurringRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, is_active: isActive } : r)));
  };

  const updateRecurringRule = async (rule: RecurringRule) => {
    const res = await updateRecurringRuleData(rule.id, rule);
    if (res.error) {
      showErrorToast("Recurring Rule Update Failed", res.error);
      return;
    }
    setRecurringRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
  };

  const addRecurringRule = async (rule: Omit<RecurringRule, "id">) => {
    if (!currentUser?.id) return;
    const res = await createRecurringRuleData(rule, currentUser.id);
    if (res.error || !res.data) {
      showErrorToast("Recurring Rule Creation Failed", res.error || "Failed to create rule");
      return;
    }
    setRecurringRules((prev) => [...prev, res.data!]);
  };

  const deleteRecurringRule = async (ruleId: string) => {
    const res = await deleteRecurringRuleData(ruleId);
    if (res.error) {
      showErrorToast("Recurring Rule Delete Failed", res.error);
      return;
    }
    setRecurringRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const runAutoMissionsGenerator = (
    currentMissions?: Mission[],
    currentRules?: RecurringRule[],
    blocks?: TimeBlock[],
    events?: AcademicEvent[],
    topics?: CyberTopic[]
  ) => {
    if (!features.auto_missions) {
      return { createdCount: 0, message: "Auto-missions are currently disabled in settings." };
    }

    const targetMissions = currentMissions || missions;
    const targetRules = currentRules || recurringRules;
    const targetBlocks = blocks || timeBlocks;
    const targetEvents = events || academicEvents;
    const targetTopics = topics || cyberTopics;

    const nextTopic = features.cyber
      ? targetTopics.find((t) => t.status === "learning") ||
        targetTopics.find((t) => t.status === "not_started")
      : undefined;

    const result = generateDailyAutoMissions({
      date: new Date(),
      rules: targetRules,
      existingMissions: targetMissions,
      defaultBlocks: targetBlocks,
      academicEvents: targetEvents,
      nextCyberTopicTitle: nextTopic?.title,
      nextCyberTopic: nextTopic,
      activeMissionCap: 5,
    });

    if (result.newMissions.length > 0 && currentUser?.id) {
      setMissions((prev) => [...result.newMissions, ...prev]);
      result.newMissions.forEach((nm) => {
        createMissionData(nm, currentUser.id).catch(console.error);
      });
    }

    setRecurringRules(result.updatedRules);
    result.updatedRules.forEach((ur) => {
      updateRecurringRuleData(ur.id, ur).catch(console.error);
    });

    return {
      createdCount: result.newMissions.length,
      message:
        result.newMissions.length > 0
          ? `Generated ${result.newMissions.length} auto-mission${result.newMissions.length > 1 ? "s" : ""} for today.`
          : "All auto-missions for today are up-to-date (0 duplicates created).",
    };
  };

  // Course HQ Actions
  const addLectureLog = async (logData: Omit<LectureLog, "id">) => {
    if (!currentUser?.id) return;
    const res = await createLectureLogData(logData, currentUser.id);
    if (res.error || !res.data) {
      showErrorToast("Lecture Log Failed", res.error || "Failed to add lecture log");
      return;
    }
    setLectureLogs((prev) => [res.data!, ...prev]);
  };

  const updateLectureLog = async (log: LectureLog) => {
    const res = await updateLectureLogData(log.id, log);
    if (res.error) {
      showErrorToast("Update Lecture Log Failed", res.error);
      return;
    }
    setLectureLogs((prev) => prev.map((l) => (l.id === log.id ? log : l)));
  };

  const deleteLectureLog = async (id: string) => {
    const res = await deleteLectureLogData(id);
    if (res.error) {
      showErrorToast("Delete Lecture Log Failed", res.error);
      return;
    }
    setLectureLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const toggleLectureStudied = async (id: string) => {
    const target = lectureLogs.find((l) => l.id === id);
    if (!target) return;
    const newStudied = !target.studied;
    const res = await updateLectureLogData(id, { studied: newStudied });
    if (res.error) {
      showErrorToast("Toggle Studied Failed", res.error);
      return;
    }
    setLectureLogs((prev) => prev.map((l) => (l.id === id ? { ...l, studied: newStudied } : l)));
  };

  const updateCourse = async (courseOrId: string | Course, updates?: Partial<Course>) => {
    const id = typeof courseOrId === "string" ? courseOrId : courseOrId.id;
    const payload = typeof courseOrId === "string" ? updates || {} : courseOrId;
    const res = await updateCourseData(id, payload, currentUser?.id);
    if (res.error) {
      showErrorToast("Update Course Failed", res.error);
      return;
    }
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)));
  };

  const addCourseResource = async (courseId: string, resource: Omit<CourseResource, "id">) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const newResource: CourseResource = {
      ...resource,
      id: `cr-${Date.now()}`,
    };
    const updatedResources = [...(course.resources || []), newResource];
    const res = await updateCourseData(courseId, { resources: updatedResources }, currentUser?.id);
    if (res.error) {
      showErrorToast("Add Resource Failed", res.error);
      return;
    }
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, resources: updatedResources } : c))
    );
  };

  const deleteCourseResource = async (courseId: string, resourceId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const updatedResources = (course.resources || []).filter((r) => r.id !== resourceId);
    const res = await updateCourseData(courseId, { resources: updatedResources }, currentUser?.id);
    if (res.error) {
      showErrorToast("Delete Resource Failed", res.error);
      return;
    }
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, resources: updatedResources } : c))
    );
  };

  // Tuition Schedule
  const updateTuitionSchedule = async (params: {
    days: DayOfWeek[];
    startTime: string;
    endTime: string;
    scope: "always" | "this_week" | "move_session";
    targetDate?: string;
    targetDay?: DayOfWeek;
  }) => {
    const { days, startTime, endTime, scope, targetDate, targetDay } = params;

    if (scope === "always") {
      const otherBlocks = timeBlocks.filter((b) => b.type !== "tuition" || Boolean(b.override_date));
      const newTuitionBlocks: TimeBlock[] = days.map((day) => ({
        id: `tb-tuition-${day.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: currentUser?.id || null,
        weekday: day,
        start_time: startTime,
        end_time: endTime,
        type: "tuition",
        label: "TUITION",
        default_category: "cat-11",
        is_fixed: true,
        is_active: true,
        created_at: new Date().toISOString(),
      }));

      const otherSchedule = schedule.filter((s) => s.type !== "tuition");
      const newScheduleItems: ClassScheduleItem[] = days.map((day) => ({
        id: `cs-tuition-${day.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: currentUser?.id || null,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        course_name: "Tuition (I teach)",
        room: "Remote/Home",
        type: "tuition",
        created_at: new Date().toISOString(),
      }));

      const dayNumbers = days.map((d) => {
        const map: Record<DayOfWeek, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
        return map[d];
      });

      if (currentUser?.id) {
        const err1 = await replaceTuitionBlocksData(newTuitionBlocks, currentUser.id);
        const err2 = await replaceTuitionScheduleData(newScheduleItems, currentUser.id);
        if (err1.error || err2.error) {
          const msg = err1.error || err2.error || "Failed to update tuition schedule in cloud";
          showErrorToast("Tuition Schedule Sync Failed", msg);
          throw new Error(msg);
        }
        const prepRule = recurringRules.find((r) => r.rule_type === "tuition_prep");
        if (prepRule) {
          await updateRecurringRuleData(prepRule.id, { days_of_week: dayNumbers });
        }
      }

      setTimeBlocks([...otherBlocks, ...newTuitionBlocks]);
      setSchedule([...otherSchedule, ...newScheduleItems]);
      setRecurringRules((prev) =>
        prev.map((r) => (r.rule_type === "tuition_prep" ? { ...r, days_of_week: dayNumbers } : r))
      );
    } else if (scope === "this_week") {
      const weekDays = getDaysOfWeek(getWeekStartDate(new Date()));
      const overrideBlocks: TimeBlock[] = [];
      for (const d of weekDays) {
        const dayKey = getWeekdayFromDate(d);
        const dateStr = formatDateKey(d);
        if (days.includes(dayKey)) {
          overrideBlocks.push({
            id: `tb-tuition-override-${dateStr}`,
            user_id: currentUser?.id || null,
            weekday: dayKey,
            start_time: startTime,
            end_time: endTime,
            type: "tuition",
            label: "TUITION (This Week)",
            default_category: "cat-11",
            is_fixed: true,
            is_active: true,
            override_date: dateStr,
            created_at: new Date().toISOString(),
          });
        }
      }
      if (currentUser?.id && overrideBlocks.length > 0) {
        for (const ob of overrideBlocks) {
          const res = await createTimeBlockData(ob, currentUser.id);
          if (res.error) {
            showErrorToast("Tuition Override Failed", res.error);
            throw new Error(res.error);
          }
        }
      }
      setTimeBlocks((prev) => [
        ...prev.filter(
          (b) => !b.override_date || !overrideBlocks.some((ob) => ob.override_date === b.override_date && b.type === "tuition")
        ),
        ...overrideBlocks,
      ]);
    } else if (scope === "move_session" && targetDate) {
      const dayKey = targetDay || getWeekdayFromDate(targetDate);
      const overrideBlock: TimeBlock = {
        id: `tb-tuition-override-${targetDate}`,
        user_id: currentUser?.id || null,
        weekday: dayKey,
        start_time: startTime,
        end_time: endTime,
        type: "tuition",
        label: "TUITION (Moved Session)",
        default_category: "cat-11",
        is_fixed: true,
        is_active: true,
        override_date: targetDate,
        created_at: new Date().toISOString(),
      };
      if (currentUser?.id) {
        const res = await createTimeBlockData(overrideBlock, currentUser.id);
        if (res.error) {
          showErrorToast("Tuition Override Failed", res.error);
          throw new Error(res.error);
        }
      }
      setTimeBlocks((prev) => [
        ...prev.filter((b) => !(b.type === "tuition" && b.override_date === targetDate)),
        overrideBlock,
      ]);
    }
  };

  // Tuition Exceptions (Move / Cancel per-session & skip N weeks)
  const moveTuitionSession = async (params: {
    date: string;
    newStart: string;
    newEnd: string;
    note?: string;
    slotId?: string;
  }) => {
    const { date, newStart, newEnd, note, slotId } = params;
    if (!currentUser?.id) return;

    // Check if an exception already exists for this date/slot and delete it first
    const existing = tuitionExceptions.find(
      (ex) => ex.date === date && (!slotId || ex.slot_id === slotId)
    );
    if (existing) {
      await deleteTuitionExceptionData(existing.id, currentUser.id);
    }

    const newEx: Omit<TuitionException, "id"> & { id?: string } = {
      user_id: currentUser.id,
      date,
      slot_id: slotId || null,
      action: "moved",
      new_start: newStart,
      new_end: newEnd,
      note: note || null,
    };

    const res = await createTuitionExceptionData(newEx, currentUser.id);
    if (res.error) {
      showErrorToast("Failed to move tuition session", res.error);
      throw new Error(res.error);
    }

    const created = res.data || { ...newEx, id: crypto.randomUUID() };
    setTuitionExceptions((prev) => [
      ...prev.filter((ex) => !(ex.date === date && (!slotId || ex.slot_id === slotId))),
      created,
    ]);

    // Reschedule any "Prepare tuition lesson" auto-mission for this date
    const prepMission = missions.find(
      (m) =>
        (m.category_id === "cat-11" || m.title.toLowerCase().includes("prepare tuition")) &&
        (m.auto_generated_date === date || (m.scheduled_start && m.scheduled_start.startsWith(date)))
    );

    if (prepMission) {
      const [tH, tM] = newStart.split(":").map(Number);
      const tuitionStartMin = (tH || 18) * 60 + (tM || 0);
      const prepEndMin = Math.max(9 * 60, tuitionStartMin - 15);
      const prepStartMin = prepEndMin - 45;
      const psH = Math.floor(prepStartMin / 60);
      const psM = prepStartMin % 60;
      const peH = Math.floor(prepEndMin / 60);
      const peM = prepEndMin % 60;
      const scheduledStart = `${date}T${String(psH).padStart(2, "0")}:${String(psM).padStart(2, "0")}:00`;
      const scheduledEnd = `${date}T${String(peH).padStart(2, "0")}:${String(peM).padStart(2, "0")}:00`;
      const deadline = calculateTuitionDeadline(newStart, date);

      await updateMissionData(
        prepMission.id,
        {
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          deadline,
        },
        currentUser.id
      );

      setMissions((prev) =>
        prev.map((m) =>
          m.id === prepMission.id
            ? { ...m, scheduled_start: scheduledStart, scheduled_end: scheduledEnd, deadline }
            : m
        )
      );
    }
  };

  const cancelTuitionSession = async (params: {
    date: string;
    skipWeeks?: number;
    note?: string;
    slotId?: string;
  }) => {
    const { date, skipWeeks = 1, note, slotId } = params;
    if (!currentUser?.id) return;

    const count = Math.min(8, Math.max(1, skipWeeks));
    const datesToCancel: string[] = [];

    const baseDate = new Date(`${date}T12:00:00`);
    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i * 7);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      datesToCancel.push(dStr);
    }

    // Remove existing exceptions on these dates
    const existingToRemove = tuitionExceptions.filter(
      (ex) => datesToCancel.includes(ex.date) && (!slotId || ex.slot_id === slotId)
    );
    for (const ex of existingToRemove) {
      await deleteTuitionExceptionData(ex.id, currentUser.id);
    }

    const exceptionsToInsert: (Omit<TuitionException, "id"> & { id?: string })[] = datesToCancel.map((dStr) => ({
      user_id: currentUser.id,
      date: dStr,
      slot_id: slotId || null,
      action: "cancelled",
      note: note || null,
    }));

    const res = await createTuitionExceptionsBatchData(exceptionsToInsert, currentUser.id);
    if (res.error) {
      showErrorToast("Failed to cancel tuition session", res.error);
      throw new Error(res.error);
    }

    const inserted =
      res.data && res.data.length > 0
        ? res.data
        : exceptionsToInsert.map((e) => ({ ...e, id: crypto.randomUUID() }));

    setTuitionExceptions((prev) => [
      ...prev.filter((ex) => !datesToCancel.includes(ex.date)),
      ...inserted,
    ]);

    // Remove "Prepare tuition lesson" auto-missions for all cancelled dates
    const missionsToDelete = missions.filter(
      (m) =>
        (m.category_id === "cat-11" || m.title.toLowerCase().includes("prepare tuition")) &&
        (datesToCancel.includes(m.auto_generated_date || "") ||
          datesToCancel.some((d) => m.scheduled_start && m.scheduled_start.startsWith(d)))
    );

    for (const m of missionsToDelete) {
      await deleteMissionData(m.id, currentUser.id);
    }

    if (missionsToDelete.length > 0) {
      const deletedIds = new Set(missionsToDelete.map((m) => m.id));
      setMissions((prev) => prev.filter((m) => !deletedIds.has(m.id)));
    }
  };

  const undoTuitionException = async (exceptionId: string) => {
    if (!currentUser?.id) return;
    const res = await deleteTuitionExceptionData(exceptionId, currentUser.id);
    if (res.error) {
      showErrorToast("Failed to undo tuition change", res.error);
      throw new Error(res.error);
    }
    setTuitionExceptions((prev) => prev.filter((ex) => ex.id !== exceptionId));
  };

  // Codeforces Actions
  const addCfLog = async (logData: Omit<CodeforcesLog, "id">) => {
    if (!currentUser?.id) return;
    const res = await createCfLogData(logData, currentUser.id);
    if (res.error || !res.data) {
      showErrorToast("Add CF Log Failed", res.error || "Failed to add log");
      return;
    }
    setCfLogs((prev) => [res.data!, ...prev]);
  };

  const updateCfLog = async (log: CodeforcesLog) => {
    const res = await updateCfLogData(log.id, log);
    if (res.error) {
      showErrorToast("Update CF Log Failed", res.error);
      return;
    }
    setCfLogs((prev) => prev.map((l) => (l.id === log.id ? log : l)));
  };

  const deleteCfLog = async (id: string) => {
    const res = await deleteCfLogData(id);
    if (res.error) {
      showErrorToast("Delete CF Log Failed", res.error);
      return;
    }
    setCfLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const importCfLogs = async (newLogs: CodeforcesLog[]) => {
    if (!currentUser?.id || newLogs.length === 0) return;
    const res = await upsertCfLogsData(newLogs, currentUser.id);
    if (res.error) {
      showErrorToast("Import CF Logs Failed", res.error);
      return;
    }
    setCfLogs((prev) => deduplicateExistingLogs([...newLogs, ...prev]));
  };

  const deduplicateCfLogs = async (): Promise<{ removedCount: number; remainingCount: number }> => {
    const { duplicateIdsToDelete } = findDuplicateLogIds(cfLogs);
    if (duplicateIdsToDelete.length > 0) {
      await deleteCfLogsData(duplicateIdsToDelete);
      const remaining = cfLogs.filter((l) => !duplicateIdsToDelete.includes(l.id));
      setCfLogs(remaining);
      return { removedCount: duplicateIdsToDelete.length, remainingCount: remaining.length };
    }
    return { removedCount: 0, remainingCount: cfLogs.length };
  };

  const updateCfHandle = async (handle: string) => {
    const norm = normalizeCodeforcesHandle(handle);
    setCfHandle(norm);
    if (currentUser?.id) {
      await updateUserSettingsData(currentUser.id, { cf_handle: norm });
    }
  };

  // Cybersecurity Roadmap
  const updateCyberTopicStatus = async (
    topicId: string,
    status: CyberTopicStatus,
    notes?: string,
    timeSpent?: number,
    takeaway?: string,
    handsOnDone?: boolean
  ) => {
    const payload: Partial<CyberTopic> = {
      status,
      time_spent_minutes: timeSpent,
      notes,
      hands_on_completed: handsOnDone,
      takeaway,
      completed_at: status === "done" ? new Date().toISOString() : null,
    };
    const res = await updateCyberTopicData(topicId, payload);
    if (res.error) {
      showErrorToast("Cyber Topic Update Failed", res.error);
      return;
    }
    setCyberTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, ...payload } : t))
    );
  };

  const addCyberTopic = async (topic: Partial<CyberTopic>) => {
    if (!currentUser?.id) return;
    const res = await createCyberTopicData(topic, currentUser.id);
    if (res.error || !res.data) {
      showErrorToast("Add Cyber Topic Failed", res.error || "Failed to create topic");
      return;
    }
    setCyberTopics((prev) => [...prev, res.data!]);
  };

  // Research Papers
  const addResearchPaper = async (paper: Partial<ResearchPaper>) => {
    if (!currentUser?.id) return;
    const res = await createPaperData(paper, currentUser.id);
    if (res.error || !res.data) {
      showErrorToast("Add Paper Failed", res.error || "Failed to add paper");
      return;
    }
    setResearchPapers((prev) => [res.data!, ...prev]);
  };

  const updateResearchPaper = async (paperOrId: string | ResearchPaper, updates?: Partial<ResearchPaper>) => {
    const id = typeof paperOrId === "string" ? paperOrId : paperOrId.id;
    const payload = typeof paperOrId === "string" ? updates || {} : paperOrId;
    const res = await updatePaperData(id, payload);
    if (res.error) {
      showErrorToast("Update Paper Failed", res.error);
      return;
    }
    setResearchPapers((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)));
  };

  const deleteResearchPaper = async (id: string) => {
    const res = await deletePaperData(id);
    if (res.error) {
      showErrorToast("Delete Paper Failed", res.error);
      return;
    }
    setResearchPapers((prev) => prev.filter((p) => p.id !== id));
  };

  // Side Projects
  const addSideProject = async (project: Partial<SideProject>) => {
    if (!currentUser?.id) return;
    const res = await createSideProjectData(project, currentUser.id);
    if (res.error || !res.data) {
      showErrorToast("Add Project Failed", res.error || "Failed to add project");
      return;
    }
    setSideProjects((prev) => [res.data!, ...prev]);
  };

  const updateSideProject = async (projectOrId: string | SideProject, updates?: Partial<SideProject>) => {
    const id = typeof projectOrId === "string" ? projectOrId : projectOrId.id;
    const payload = typeof projectOrId === "string" ? updates || {} : projectOrId;
    const res = await updateSideProjectData(id, payload);
    if (res.error) {
      showErrorToast("Update Project Failed", res.error);
      return;
    }
    setSideProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)));
  };

  const deleteSideProject = async (id: string) => {
    const res = await deleteSideProjectData(id);
    if (res.error) {
      showErrorToast("Delete Project Failed", res.error);
      return;
    }
    setSideProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Weekly Reviews
  const saveWeeklyReview = async (review: Partial<WeeklyReview>) => {
    if (!currentUser?.id) return;
    const res = await saveWeeklyReviewData(review, currentUser.id);
    if (res.error || !res.data) {
      showErrorToast("Save Review Failed", res.error || "Failed to save weekly review");
      return;
    }
    setWeeklyReviews((prev) => [res.data!, ...prev.filter((r) => r.id !== res.data!.id)]);
  };

  // User Settings & Features
  const updateFeatures = async (updates: Partial<FeatureFlags>) => {
    const nextFeatures: FeatureFlags = {
      ...features,
      ...updates,
      dashboard: true,
      missions: true,
    };
    setFeatures(nextFeatures);

    if (currentUser?.id) {
      const res = await updateUserSettingsData(currentUser.id, {
        features: nextFeatures,
      });
      if (res.error) {
        showErrorToast("Feature Toggle Failed", res.error);
      }
    }
  };

  const updateNotificationSettings = async (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    if (currentUser?.id) {
      await updateUserSettingsData(currentUser.id, { notification_settings: settings });
    }
  };

  const updateUserSettings = async (updates: {
    animations_enabled?: boolean;
    sound_enabled?: boolean;
    default_theme?: ThemePreference;
    features?: FeatureFlags;
  }) => {
    if (updates.sound_enabled !== undefined) {
      soundFX.setEnabled(updates.sound_enabled);
    }
    if (updates.default_theme) {
      saveThemePreference(updates.default_theme);
    }
    if (updates.features) {
      setFeatures({
        ...DEFAULT_FEATURE_FLAGS,
        ...updates.features,
        dashboard: true,
        missions: true,
      });
    }
    if (currentUser?.id) {
      const res = await updateUserSettingsData(currentUser.id, updates);
      if (res.error) {
        showErrorToast("Settings Update Failed", res.error);
      }
    }
  };

  const updateDefaultTheme = async (pref: ThemePreference) => {
    saveThemePreference(pref);
    if (currentUser?.id) {
      await updateUserSettingsData(currentUser.id, { default_theme: pref });
    }
  };

  // Reset All Progress (Cloud-Only)
  const resetAllProgress = async (): Promise<{
    success: boolean;
    error?: string;
    deleted: string[];
    kept: string[];
  }> => {
    if (!supabase || !currentUser?.id) {
      return { success: false, error: "Authentication required to reset progress", deleted: [], kept: [] };
    }

    const uid = currentUser.id;
    const deleteErrors: string[] = [];

    // Wipe progress tables for current user
    await Promise.all(
      RESET_PROGRESS_TABLES.map(async (table) => {
        try {
          const { error } = await supabase.from(table).delete().eq("user_id", uid);
          if (error) deleteErrors.push(`[${table}]: ${error.message}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Execution failed";
          deleteErrors.push(`[${table}]: ${msg}`);
        }
      })
    );

    // Reset cyber topics progress
    try {
      await supabase
        .from("cyber_topics")
        .update({
          status: "not_started",
          time_spent_minutes: 0,
          notes: null,
          hands_on_completed: false,
          takeaway: null,
          completed_at: null,
        })
        .eq("user_id", uid);
    } catch (err: unknown) {
      deleteErrors.push(`[cyber_topics]: ${err instanceof Error ? err.message : "failed"}`);
    }

    if (deleteErrors.length > 0) {
      const errSummary = `Failed to reset cloud tables: ${deleteErrors.join("; ")}`;
      showErrorToast("Reset Error", errSummary);
      return { success: false, error: errSummary, deleted: [], kept: [] };
    }

    // Reset in-memory state
    setMissions([]);
    setTotalXp(0);
    setStreak(0);
    setLectureLogs([]);
    setCfLogs([]);
    setResearchPapers([]);
    setSideProjects([]);
    setWeeklyReviews([]);
    setCyberTopics((prev) =>
      prev.map((t) => ({ ...t, status: "not_started" as const, time_spent_minutes: 0, notes: undefined }))
    );

    return {
      success: true,
      deleted: [
        "Missions (active & completed)",
        "Total XP (reset to 0)",
        "Daily streak (reset to 0)",
        "Codeforces problem logs",
        "Lecture study logs",
        "Research papers archive",
        "Side projects log",
        "Weekly performance reviews",
        "Cybersecurity progress & notes (reset to Not Started)",
      ],
      kept: [
        "Weekly class schedule & tuition routine",
        "Course catalog",
        "Weekly 7-day time-blocks",
        "Academic calendar & key milestone dates",
        "Recurring auto-mission configuration rules",
        "Full cybersecurity syllabus structure",
        "Theme and animation preferences",
        "Account authentication session",
      ],
    };
  };

  const deduplicateMissions = async (): Promise<{ removedCount: number }> => {
    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    missions.forEach((m) => {
      const key = `${(m.title || "").trim().toLowerCase()}|${(m.codename || "").trim().toLowerCase()}`;
      if (seen.has(key)) {
        duplicateIds.push(m.id);
      } else {
        seen.add(key);
      }
    });

    if (duplicateIds.length > 0) {
      await deleteMissionsData(duplicateIds);
      setMissions((prev) => prev.filter((m) => !duplicateIds.includes(m.id)));
    }

    return { removedCount: duplicateIds.length };
  };

  return {
    isAuthenticated,
    currentUser,
    errorToasts,
    showErrorToast,
    dismissErrorToast,
    structureLoadingError,
    dataLoadingError,
    supabaseConfigError,
    retryLoadData,
    retryLoadStructure: retryLoadData,
    deduplicateMissions,
    missions,
    categories,
    schedule,
    timeBlocks,
    academicEvents,
    recurringRules,
    courses,
    lectureLogs,
    cyberTopics,
    researchPapers,
    sideProjects,
    cfLogs,
    weeklyReviews,
    notificationSettings,
    totalXp,
    streak,
    loading,
    defaultTheme: getStoredThemePreference(),
    updateDefaultTheme,
    isSupabaseConnected: isSupabaseConfigured(),
    refreshData: async () => {
      if (currentUser?.id) {
        await loadAllCloudData(currentUser.id);
      }
    },
    login,
    resetPassword,
    logout,
    guestBypass: () => {},
    addMission,
    editMission,
    deleteMission,
    setActiveMission,
    completeMission,
    updateMissionNote,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    addAcademicEvent,
    updateAcademicEvent,
    deleteAcademicEvent,
    scheduleMissionToBlock,
    confirmAutoScheduledMission,
    unscheduleMission,
    runAutoScheduler,
    toggleRecurringRule,
    updateRecurringRule,
    addRecurringRule,
    deleteRecurringRule,
    runAutoMissionsGenerator,
    addLectureLog,
    updateLectureLog,
    deleteLectureLog,
    toggleLectureStudied,
    addCourseResource,
    deleteCourseResource,
    updateCourse,
    updateTuitionSchedule,
    tuitionExceptions,
    moveTuitionSession,
    cancelTuitionSession,
    undoTuitionException,
    addCfLog,
    updateCfLog,
    deleteCfLog,
    importCfLogs,
    deduplicateCfLogs,
    cfHandle,
    updateCfHandle,
    updateCyberTopicStatus,
    addCyberTopic,
    addResearchPaper,
    updateResearchPaper,
    deleteResearchPaper,
    addSideProject,
    updateSideProject,
    deleteSideProject,
    saveWeeklyReview,
    updateNotificationSettings,
    updateUserSettings,
    features,
    updateFeatures,
    resetAllProgress,
  };
}
