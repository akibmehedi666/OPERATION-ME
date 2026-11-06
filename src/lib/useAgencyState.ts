"use client";

import { useState, useEffect, useRef } from "react";
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
} from "@/types/database";
import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_SCHEDULE, 
  DEFAULT_TIME_BLOCKS,
  DEFAULT_ACADEMIC_EVENTS,
  DEFAULT_RECURRING_RULES,
  DEFAULT_COURSES,
  DEFAULT_LECTURE_LOGS,
  DEFAULT_CYBER_TOPICS,
  DEFAULT_PAPERS,
  DEFAULT_SIDE_PROJECTS,
  DEFAULT_CF_LOGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  mergeCyberTopicsWithExisting,
} from "@/lib/seeds";
import { autoScheduleMissions } from "@/lib/plannerScheduler";
import { generateDailyAutoMissions } from "@/lib/recurringGenerator";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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
  getCanonicalProblemKey,
  normalizeCodeforcesHandle,
} from "@/lib/codeforcesApi";

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const RESET_PROGRESS_TABLES = [
  "missions",
  "cf_log",
  "lecture_logs",
  "papers",
  "side_projects",
  "cyber_topics",
  "weekly_reviews",
  "xp_events",
  "streaks",
] as const;

export function useAgencyState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [schedule, setSchedule] = useState<ClassScheduleItem[]>(DEFAULT_SCHEDULE);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(DEFAULT_TIME_BLOCKS);
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>(DEFAULT_ACADEMIC_EVENTS);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(DEFAULT_RECURRING_RULES);
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [lectureLogs, setLectureLogs] = useState<LectureLog[]>(DEFAULT_LECTURE_LOGS);
  const [cyberTopics, setCyberTopics] = useState<CyberTopic[]>(DEFAULT_CYBER_TOPICS);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>(DEFAULT_PAPERS);
  const [sideProjects, setSideProjects] = useState<SideProject[]>(DEFAULT_SIDE_PROJECTS);
  const [cfLogs, setCfLogs] = useState<CodeforcesLog[]>(DEFAULT_CF_LOGS);
  const [cfHandle, setCfHandle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("op_me_cf_handle") || "";
    }
    return "";
  });
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [totalXp, setTotalXp] = useState<number>(0); // Baseline 0 XP for fresh agent
  const [streak, setStreak] = useState<number>(0); // Baseline 0 day streak for fresh agent
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();
  const hasSupabase = isSupabaseConfigured() && supabase !== null;

  const initHandledRef = useRef(false);

  // Safety fallback: ensure loading NEVER exceeds 3.0s under any circumstances
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("[Auth] Session initialization exceeded 3s threshold. Forcing loading to false.");
          return false;
        }
        return false;
      });
    }, 3000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  // Initialize data and resolve session once on mount
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      if (initHandledRef.current) return;
      initHandledRef.current = true;

      // Check if user authenticated in Supabase (with timeout guard so network latency never blocks initial render)
      if (hasSupabase && supabase) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("operation_me_auth");
        }

        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 1800)
          );

          const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

          if (isCancelled) return;

          if (session?.user) {
            setIsAuthenticated(true);
            setCurrentUser({ id: session.user.id, email: session.user.email || "" });
            setLoading(false); // End loading screen immediately so UI renders!
            // Load user data asynchronously
            fetchSupabaseData(session.user.id).catch((err) => {
              console.error("Background data fetch error:", err);
            });
            return;
          }
        } catch (e) {
          console.error("Supabase session error:", e);
        }

        if (isCancelled) return;

        // In cloud mode, no session found -> show login page immediately
        setIsAuthenticated(false);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Check local storage session fallback strictly in local mode (when Supabase is NOT configured)
      if (!hasSupabase && typeof window !== "undefined") {
        const localAuth = localStorage.getItem("operation_me_auth");
        if (localAuth === "true") {
          setIsAuthenticated(true);
          setCurrentUser({ id: "agent-akib-local", email: "akib@agency.internal" });
          loadLocalData();
          setLoading(false);
          return;
        }
      }

      if (!isCancelled) {
        setLoading(false);
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth state listener: automatically handle token refreshes and session changes
  useEffect(() => {
    if (!hasSupabase || !supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentUser({ id: session.user.id, email: session.user.email || "" });
          setLoading(false);
        } else if (event === "INITIAL_SESSION") {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hasSupabase, supabase]);

  // Load from LocalStorage
  const loadLocalData = () => {
    if (typeof window === "undefined") return;

    try {
      const storedMissions = localStorage.getItem("op_me_missions");
      if (storedMissions) {
        setMissions(JSON.parse(storedMissions));
      } else {
        setMissions([]);
        localStorage.setItem("op_me_missions", JSON.stringify([]));
      }

      const storedXp = localStorage.getItem("op_me_xp");
      if (storedXp) {
        setTotalXp(Number(storedXp));
      } else {
        setTotalXp(0);
      }

      const storedStreak = localStorage.getItem("op_me_streak");
      if (storedStreak) {
        setStreak(Number(storedStreak));
      } else {
        setStreak(0);
      }

      const storedCats = localStorage.getItem("op_me_categories");
      if (storedCats) setCategories(JSON.parse(storedCats));

      const storedSched = localStorage.getItem("op_me_schedule");
      if (storedSched) setSchedule(JSON.parse(storedSched));

      const storedTimeBlocks = localStorage.getItem("op_me_time_blocks");
      if (storedTimeBlocks) {
        setTimeBlocks(JSON.parse(storedTimeBlocks));
      } else {
        setTimeBlocks(DEFAULT_TIME_BLOCKS);
        localStorage.setItem("op_me_time_blocks", JSON.stringify(DEFAULT_TIME_BLOCKS));
      }

      const storedEvents = localStorage.getItem("op_me_academic_events");
      if (storedEvents) {
        setAcademicEvents(JSON.parse(storedEvents));
      } else {
        setAcademicEvents(DEFAULT_ACADEMIC_EVENTS);
        localStorage.setItem("op_me_academic_events", JSON.stringify(DEFAULT_ACADEMIC_EVENTS));
      }

      // Phase 2 Datastores
      let loadedRules = DEFAULT_RECURRING_RULES;
      const storedRules = localStorage.getItem("op_me_recurring_rules");
      if (storedRules) {
        loadedRules = JSON.parse(storedRules);
        setRecurringRules(loadedRules);
      } else {
        setRecurringRules(DEFAULT_RECURRING_RULES);
        localStorage.setItem("op_me_recurring_rules", JSON.stringify(DEFAULT_RECURRING_RULES));
      }

      let loadedCourses = DEFAULT_COURSES;
      const storedCourses = localStorage.getItem("op_me_courses");
      if (storedCourses) {
        loadedCourses = JSON.parse(storedCourses);
        setCourses(loadedCourses);
      } else {
        setCourses(DEFAULT_COURSES);
        localStorage.setItem("op_me_courses", JSON.stringify(DEFAULT_COURSES));
      }

      let loadedLogs = DEFAULT_LECTURE_LOGS;
      const storedLogs = localStorage.getItem("op_me_lecture_logs");
      if (storedLogs) {
        loadedLogs = JSON.parse(storedLogs);
        setLectureLogs(loadedLogs);
      } else {
        setLectureLogs(DEFAULT_LECTURE_LOGS);
        localStorage.setItem("op_me_lecture_logs", JSON.stringify(DEFAULT_LECTURE_LOGS));
      }

      let loadedTopics = DEFAULT_CYBER_TOPICS;
      const storedTopics = localStorage.getItem("op_me_cyber_topics");
      if (storedTopics) {
        try {
          const parsed = JSON.parse(storedTopics);
          loadedTopics = mergeCyberTopicsWithExisting(DEFAULT_CYBER_TOPICS, parsed);
        } catch {
          loadedTopics = DEFAULT_CYBER_TOPICS;
        }
        setCyberTopics(loadedTopics);
        localStorage.setItem("op_me_cyber_topics", JSON.stringify(loadedTopics));
      } else {
        setCyberTopics(DEFAULT_CYBER_TOPICS);
        localStorage.setItem("op_me_cyber_topics", JSON.stringify(DEFAULT_CYBER_TOPICS));
      }

      let loadedPapers = DEFAULT_PAPERS;
      const storedPapers = localStorage.getItem("op_me_papers");
      if (storedPapers) {
        loadedPapers = JSON.parse(storedPapers);
        setResearchPapers(loadedPapers);
      } else {
        setResearchPapers(DEFAULT_PAPERS);
        localStorage.setItem("op_me_papers", JSON.stringify(DEFAULT_PAPERS));
      }

      let loadedProjects = DEFAULT_SIDE_PROJECTS;
      const storedProjects = localStorage.getItem("op_me_side_projects");
      if (storedProjects) {
        loadedProjects = JSON.parse(storedProjects);
        setSideProjects(loadedProjects);
      } else {
        setSideProjects(DEFAULT_SIDE_PROJECTS);
        localStorage.setItem("op_me_side_projects", JSON.stringify(DEFAULT_SIDE_PROJECTS));
      }

      let loadedCf = DEFAULT_CF_LOGS;
      const storedCf = localStorage.getItem("op_me_cf_logs");
      if (storedCf) {
        loadedCf = JSON.parse(storedCf);
        setCfLogs(loadedCf);
      } else {
        setCfLogs(DEFAULT_CF_LOGS);
        localStorage.setItem("op_me_cf_logs", JSON.stringify(DEFAULT_CF_LOGS));
      }

      const storedReviews = localStorage.getItem("op_me_weekly_reviews");
      if (storedReviews) {
        setWeeklyReviews(JSON.parse(storedReviews));
      }

      const storedNotifs = localStorage.getItem("op_me_notifications");
      if (storedNotifs) {
        setNotificationSettings(JSON.parse(storedNotifs));
      }

      // Automatically execute idempotent auto-missions generator on app open
      if (process.env.NODE_ENV !== "test") {
        setTimeout(() => {
          runAutoMissionsGenerator(
            storedMissions ? JSON.parse(storedMissions) : [],
            loadedRules,
            storedTimeBlocks ? JSON.parse(storedTimeBlocks) : DEFAULT_TIME_BLOCKS,
            storedEvents ? JSON.parse(storedEvents) : DEFAULT_ACADEMIC_EVENTS,
            loadedTopics
          );
        }, 50);
      }
    } catch (e) {
      console.error("LocalStorage load error:", e);
      setMissions([]);
    }
  };

  // Fetch from Supabase
  const fetchSupabaseData = async (userId: string) => {
    if (!supabase) return;

    try {
      // 1. Fetch categories
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        // Fallback to default categories
        setCategories(DEFAULT_CATEGORIES);
      }

      // 2. Fetch class schedule
      const { data: schedData } = await supabase
        .from("class_schedule")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (schedData && schedData.length > 0) {
        setSchedule(schedData);
      } else {
        setSchedule(DEFAULT_SCHEDULE);
      }

      // 3. Fetch missions
      const { data: missionData } = await supabase
        .from("missions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (missionData && missionData.length > 0) {
        setMissions(missionData);
      } else {
        setMissions([]);
      }

      // 4. Fetch XP events
      const { data: xpData } = await supabase
        .from("xp_events")
        .select("amount")
        .eq("user_id", userId);

      if (xpData && xpData.length > 0) {
        const sum = xpData.reduce((acc: number, row: { amount?: number | null }) => acc + (row.amount || 0), 0);
        setTotalXp(sum);
      } else {
        setTotalXp(0);
      }

      // 5. Fetch streak
      const { data: streakData } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (streakData) {
        setStreak(streakData.current_streak || 0);
      } else {
        setStreak(0);
      }

      // 6. Fetch time_blocks
      const { data: tbData } = await supabase
        .from("time_blocks")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (tbData && tbData.length > 0) {
        setTimeBlocks(tbData);
      } else {
        setTimeBlocks(DEFAULT_TIME_BLOCKS);
      }

      // 7. Fetch academic_events
      const { data: aeData } = await supabase
        .from("academic_events")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (aeData && aeData.length > 0) {
        setAcademicEvents(aeData);
      } else {
        setAcademicEvents(DEFAULT_ACADEMIC_EVENTS);
      }

      // 8. Fetch recurring_rules
      const { data: rrData } = await supabase
        .from("recurring_rules")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`);
      if (rrData && rrData.length > 0) {
        setRecurringRules(rrData);
      } else {
        setRecurringRules(DEFAULT_RECURRING_RULES);
      }

      // 9. Fetch courses
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`);
      if (courseData && courseData.length > 0) {
        setCourses(courseData);
      } else {
        setCourses(DEFAULT_COURSES);
      }

      // 10. Fetch lecture_logs
      const { data: logData } = await supabase
        .from("lecture_logs")
        .select("*")
        .eq("user_id", userId);
      if (logData && logData.length > 0) {
        setLectureLogs(logData);
      } else {
        setLectureLogs(DEFAULT_LECTURE_LOGS);
      }

      // 11. Fetch cyber_topics
      const { data: cyberData } = await supabase
        .from("cyber_topics")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`);
      if (cyberData && cyberData.length > 0) {
        setCyberTopics(mergeCyberTopicsWithExisting(DEFAULT_CYBER_TOPICS, cyberData));
      } else {
        setCyberTopics(DEFAULT_CYBER_TOPICS);
      }

      // 12. Fetch papers
      const { data: paperData } = await supabase
        .from("papers")
        .select("*")
        .eq("user_id", userId);
      if (paperData && paperData.length > 0) {
        setResearchPapers(paperData);
      } else {
        setResearchPapers(DEFAULT_PAPERS);
      }

      // 13. Fetch side_projects
      const { data: projData } = await supabase
        .from("side_projects")
        .select("*")
        .eq("user_id", userId);
      if (projData && projData.length > 0) {
        setSideProjects(projData);
      } else {
        setSideProjects(DEFAULT_SIDE_PROJECTS);
      }

      // 14. Fetch user_settings (for cf_handle)
      try {
        const { data: settingsData } = await supabase
          .from("user_settings")
          .select("cf_handle")
          .eq("user_id", userId)
          .maybeSingle();

        if (settingsData?.cf_handle) {
          const norm = normalizeCodeforcesHandle(settingsData.cf_handle);
          if (norm) {
            setCfHandle(norm);
            if (typeof window !== "undefined") {
              localStorage.setItem("op_me_cf_handle", norm);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch user_settings cf_handle:", err);
      }

      // 15. Fetch cf_log
      const { data: cfData } = await supabase
        .from("cf_log")
        .select("*")
        .eq("user_id", userId);
      if (cfData && cfData.length > 0) {
        // Automatically deduplicate fetched logs to purge duplicate noise from display
        const cleaned = deduplicateExistingLogs(cfData);
        setCfLogs(cleaned);

        // Fallback: if cfHandle still empty, extract from cfData
        const found = cfData.find((c: CodeforcesLog) => c.handle && c.handle.trim());
        if (found?.handle) {
          const norm = normalizeCodeforcesHandle(found.handle);
          if (norm) {
            setCfHandle((prev) => prev || norm);
            if (typeof window !== "undefined" && !localStorage.getItem("op_me_cf_handle")) {
              localStorage.setItem("op_me_cf_handle", norm);
            }
          }
        }
      } else {
        setCfLogs(DEFAULT_CF_LOGS);
      }

      // 16. Fetch weekly_reviews
      const { data: wrData } = await supabase
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", userId);
      if (wrData && wrData.length > 0) {
        setWeeklyReviews(wrData);
      }
    } catch (err) {
      console.error("Error fetching Supabase data:", err);
      loadLocalData();
    }
  };

  // Save to persistence
  const persistMissions = (updated: Mission[]) => {
    setMissions(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_missions", JSON.stringify(updated));
    }
  };

  const persistXp = (newXp: number) => {
    setTotalXp(newXp);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_xp", String(newXp));
    }
  };

  const persistStreak = (newStreak: number) => {
    setStreak(newStreak);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_streak", String(newStreak));
    }
  };

  // Auth: Email login
  const login = async (email: string, pass: string) => {
    if (hasSupabase && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          setIsAuthenticated(true);
          setCurrentUser({ id: data.user.id, email: data.user.email || "" });
          await fetchSupabaseData(data.user.id);
          return { success: true };
        }
        return { success: false, error: "Authentication failed. No user returned." };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication handshake failed";
        return { success: false, error: message };
      }
    }

    // Local authentication fallback ONLY when Supabase is NOT configured
    setIsAuthenticated(true);
    setCurrentUser({ id: "agent-akib-local", email: email || "akib@agency.internal" });
    if (typeof window !== "undefined") {
      localStorage.setItem("operation_me_auth", "true");
    }
    loadLocalData();
    return { success: true };
  };

  // Password Reset via Supabase
  const resetPassword = async (email: string) => {
    if (hasSupabase && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) return { success: false, error: error.message };
        return { success: true, message: "Password reset link sent to your email." };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Password reset request failed";
        return { success: false, error: message };
      }
    }
    return { success: true, message: "Local mode: password reset simulated for " + email };
  };

  // Guest Direct Bypass - strictly available in local mode only
  const guestBypass = () => {
    if (hasSupabase) {
      console.warn("Direct access guest bypass is disabled in Supabase cloud mode.");
      return;
    }
    setIsAuthenticated(true);
    setCurrentUser({ id: "agent-akib-direct", email: "agent.akib@hq.internal" });
    if (typeof window !== "undefined") {
      localStorage.setItem("operation_me_auth", "true");
    }
    loadLocalData();
  };

  // Logout
  const logout = async () => {
    if (hasSupabase && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Error signing out of Supabase:", e);
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("operation_me_auth");
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Add Mission
  const addMission = async (missionData: Partial<Mission>) => {
    const newMission: Mission = {
      id: "m-" + Date.now(),
      title: missionData.title || "Untitled Mission",
      codename: missionData.codename || `OP-${Date.now().toString().slice(-4)}`,
      category_id: missionData.category_id || null,
      priority: missionData.priority || "medium",
      deadline: missionData.deadline || null,
      notes: missionData.notes || null,
      status: missionData.status || "active",
      xp: missionData.xp || 50,
      created_at: new Date().toISOString(),
    };

    if (hasSupabase && supabase && currentUser) {
      try {
        const { data, error } = await supabase
          .from("missions")
          .insert({
            user_id: currentUser.id,
            title: newMission.title,
            codename: newMission.codename,
            category_id: newMission.category_id,
            priority: newMission.priority,
            deadline: newMission.deadline,
            notes: newMission.notes,
            status: newMission.status,
            xp: newMission.xp,
          })
          .select()
          .single();

        if (!error && data) {
          persistMissions([data, ...missions]);
          return;
        }
      } catch (e) {
        console.error("Supabase insert mission error:", e);
      }
    }

    persistMissions([newMission, ...missions]);
  };

  // Edit Mission
  const editMission = async (missionData: Partial<Mission>) => {
    if (!missionData.id) return;

    const updated = missions.map((m) =>
      m.id === missionData.id ? { ...m, ...missionData } : m
    );

    if (hasSupabase && supabase && currentUser) {
      try {
        await supabase
          .from("missions")
          .update({
            title: missionData.title,
            codename: missionData.codename,
            category_id: missionData.category_id,
            priority: missionData.priority,
            deadline: missionData.deadline,
            notes: missionData.notes,
            status: missionData.status,
            xp: missionData.xp,
          })
          .eq("id", missionData.id);
      } catch (e) {
        console.error("Supabase update error:", e);
      }
    }

    persistMissions(updated);
  };

  // Delete Mission
  const deleteMission = async (missionId: string) => {
    const updated = missions.filter((m) => m.id !== missionId);

    if (hasSupabase && supabase) {
      try {
        await supabase.from("missions").delete().eq("id", missionId);
      } catch (e) {
        console.error("Supabase delete error:", e);
      }
    }

    persistMissions(updated);
  };

  // Set as Active Mission
  const setActiveMission = async (mission: Mission) => {
    const updated = missions.map((m) => {
      if (m.id === mission.id) {
        return { ...m, status: "active" as const };
      }
      return m;
    });

    if (hasSupabase && supabase) {
      try {
        await supabase.from("missions").update({ status: "active" }).eq("id", mission.id);
      } catch (e) {
        console.error(e);
      }
    }

    persistMissions(updated);
  };

  // Complete Mission + Auto-Assign Next Target
  const completeMission = async (
    mission: Mission,
    completionNote?: string,
    timeSpentMinutes?: number
  ) => {
    const nowIso = new Date().toISOString();
    const xpAwarded = mission.xp || 50;

    // 1. Mark completed
    const markCompleted = (m: Mission) =>
      m.id === mission.id
        ? {
            ...m,
            status: "completed" as const,
            completed_at: nowIso,
            completion_note: completionNote || null,
            time_spent_minutes: timeSpentMinutes || null,
          }
        : m;

    let updatedList = missions.map(markCompleted);

    // 2. Award XP
    const newTotalXp = totalXp + xpAwarded;
    const oldRank = getRankFromXp(totalXp).rank;
    const newRank = getRankFromXp(newTotalXp).rank;
    const isRankUp = oldRank !== newRank;

    // Check if first mission completed today
    const todayDateStr = new Date().toDateString();
    const hasCompletedEarlierToday = missions.some(
      (m) => m.completed_at && new Date(m.completed_at).toDateString() === todayDateStr
    );
    const isFirstToday = !hasCompletedEarlierToday;

    persistXp(newTotalXp);

    // 3. Update Streak
    const newStreak = streak + 1;
    persistStreak(newStreak);

    // 4. Log XP Event & Update Streak in Supabase if live
    if (hasSupabase && supabase && currentUser) {
      try {
        await supabase.from("missions").update({
          status: "completed",
          completed_at: nowIso,
          completion_note: completionNote || null,
          time_spent_minutes: timeSpentMinutes || null,
        }).eq("id", mission.id);

        await supabase.from("xp_events").insert({
          user_id: currentUser.id,
          amount: xpAwarded,
          reason: `Mission Accomplished: [${mission.codename}] ${mission.title}`,
          source_id: mission.id,
        });

        await supabase.from("streaks").upsert({
          user_id: currentUser.id,
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, 5),
          last_activity_date: new Date().toISOString().split("T")[0],
          updated_at: nowIso,
        });
      } catch (e) {
        console.error("Supabase completion logging error:", e);
      }
    }

    // 5. AUTO-ASSIGN NEXT MISSION:
    // Criteria: Find eligible missions (not completed, not the current one).
    // Sort by:
    //  a) Priority: urgent (4) > high (3) > medium (2) > low (1)
    //  b) Nearest deadline: earliest deadline first
    const pendingTargets = updatedList.filter(
      (m) => m.id !== mission.id && m.status !== "completed"
    );

    let nextTarget: Mission | null = null;

    if (pendingTargets.length > 0) {
      pendingTargets.sort((a, b) => {
        // Priority comparison
        const weightA = PRIORITY_WEIGHTS[a.priority] || 1;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 1;
        if (weightB !== weightA) {
          return weightB - weightA; // higher weight first
        }

        // Deadline comparison
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;

        return 0;
      });

      nextTarget = pendingTargets[0];

      // Promote nextTarget to active
      updatedList = updatedList.map((m) =>
        m.id === nextTarget!.id ? { ...m, status: "active" as const } : m
      );

      if (hasSupabase && supabase) {
        try {
          await supabase
            .from("missions")
            .update({ status: "active" })
            .eq("id", nextTarget.id);
        } catch (e) {
          console.error("Supabase auto-assign error:", e);
        }
      }
    }

    persistMissions(updatedList);

    return {
      completedMission: { ...mission, status: "completed" as const, completed_at: nowIso, completion_note: completionNote || null, time_spent_minutes: timeSpentMinutes || null },
      nextMission: nextTarget,
      xpAwarded,
      isFirstToday,
      isRankUp,
      oldRank,
      newRank,
      newStreak,
    };
  };

  // Update debrief note or time spent on an already completed mission
  const updateMissionNote = async (
    missionId: string,
    completionNote?: string,
    timeSpentMinutes?: number
  ) => {
    const updated = missions.map((m) =>
      m.id === missionId
        ? {
            ...m,
            completion_note: completionNote !== undefined ? completionNote : m.completion_note,
            time_spent_minutes: timeSpentMinutes !== undefined ? timeSpentMinutes : m.time_spent_minutes,
          }
        : m
    );

    persistMissions(updated);

    if (hasSupabase && supabase) {
      try {
        await supabase
          .from("missions")
          .update({
            completion_note: completionNote || null,
            time_spent_minutes: timeSpentMinutes || null,
          })
          .eq("id", missionId);
      } catch (e) {
        console.error("Supabase note update error:", e);
      }
    }
  };

  const persistTimeBlocks = (newBlocks: TimeBlock[]) => {
    setTimeBlocks(newBlocks);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_time_blocks", JSON.stringify(newBlocks));
    }
  };

  const persistAcademicEvents = (newEvents: AcademicEvent[]) => {
    setAcademicEvents(newEvents);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_academic_events", JSON.stringify(newEvents));
    }
  };

  const addTimeBlock = async (block: Omit<TimeBlock, "id" | "created_at">) => {
    const newBlock: TimeBlock = {
      ...block,
      id: `tb-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [...timeBlocks, newBlock];
    persistTimeBlocks(updated);

    if (hasSupabase && supabase && currentUser) {
      try {
        await supabase.from("time_blocks").insert({ ...newBlock, user_id: currentUser.id });
      } catch (e) {
        console.error("Supabase add time_block error:", e);
      }
    }
    return newBlock;
  };

  const updateTimeBlock = async (id: string, updates: Partial<TimeBlock>) => {
    const updated = timeBlocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    persistTimeBlocks(updated);

    if (hasSupabase && supabase) {
      try {
        await supabase.from("time_blocks").update(updates).eq("id", id);
      } catch (e) {
        console.error("Supabase update time_block error:", e);
      }
    }
  };

  const deleteTimeBlock = async (id: string) => {
    const updated = timeBlocks.filter((b) => b.id !== id);
    persistTimeBlocks(updated);

    if (hasSupabase && supabase) {
      try {
        await supabase.from("time_blocks").delete().eq("id", id);
      } catch (e) {
        console.error("Supabase delete time_block error:", e);
      }
    }
  };

  const addAcademicEvent = async (event: Omit<AcademicEvent, "id" | "created_at">) => {
    const newEvent: AcademicEvent = {
      ...event,
      id: `ae-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [...academicEvents, newEvent];
    persistAcademicEvents(updated);

    if (hasSupabase && supabase && currentUser) {
      try {
        await supabase.from("academic_events").insert({ ...newEvent, user_id: currentUser.id });
      } catch (e) {
        console.error("Supabase add academic_event error:", e);
      }
    }
    return newEvent;
  };

  const updateAcademicEvent = async (id: string, updates: Partial<AcademicEvent>) => {
    const updated = academicEvents.map((e) => (e.id === id ? { ...e, ...updates } : e));
    persistAcademicEvents(updated);

    if (hasSupabase && supabase) {
      try {
        await supabase.from("academic_events").update(updates).eq("id", id);
      } catch (e) {
        console.error("Supabase update academic_event error:", e);
      }
    }
  };

  const deleteAcademicEvent = async (id: string) => {
    const updated = academicEvents.filter((e) => e.id !== id);
    persistAcademicEvents(updated);

    if (hasSupabase && supabase) {
      try {
        await supabase.from("academic_events").delete().eq("id", id);
      } catch (e) {
        console.error("Supabase delete academic_event error:", e);
      }
    }
  };

  const scheduleMissionToBlock = async (
    missionId: string,
    blockId: string,
    startTime?: string,
    endTime?: string,
    isAuto: boolean = false
  ) => {
    const updated = missions.map((m) =>
      m.id === missionId
        ? {
            ...m,
            scheduled_block_id: blockId,
            scheduled_start: startTime || m.scheduled_start,
            scheduled_end: endTime || m.scheduled_end,
            is_auto_scheduled: isAuto,
          }
        : m
    );
    persistMissions(updated);

    if (hasSupabase && supabase) {
      try {
        await supabase
          .from("missions")
          .update({
            scheduled_block_id: blockId,
            scheduled_start: startTime || null,
            scheduled_end: endTime || null,
            is_auto_scheduled: isAuto,
          })
          .eq("id", missionId);
      } catch (e) {
        console.error("Supabase schedule mission error:", e);
      }
    }
  };

  const confirmAutoScheduledMission = async (missionId: string) => {
    const updated = missions.map((m) =>
      m.id === missionId ? { ...m, is_auto_scheduled: false } : m
    );
    persistMissions(updated);

    if (hasSupabase && supabase) {
      try {
        await supabase.from("missions").update({ is_auto_scheduled: false }).eq("id", missionId);
      } catch (e) {
        console.error("Supabase confirm auto schedule error:", e);
      }
    }
  };

  const unscheduleMission = async (missionId: string) => {
    const updated = missions.map((m) =>
      m.id === missionId
        ? {
            ...m,
            scheduled_block_id: null,
            scheduled_start: null,
            scheduled_end: null,
            is_auto_scheduled: false,
          }
        : m
    );
    persistMissions(updated);

    if (hasSupabase && supabase) {
      try {
        await supabase
          .from("missions")
          .update({
            scheduled_block_id: null,
            scheduled_start: null,
            scheduled_end: null,
            is_auto_scheduled: false,
          })
          .eq("id", missionId);
      } catch (e) {
        console.error("Supabase unschedule mission error:", e);
      }
    }
  };

  const runAutoScheduler = (weekStartDate: Date) => {
    const result = autoScheduleMissions(missions, timeBlocks, academicEvents, weekStartDate, categories);
    if (result.scheduledCount > 0) {
      persistMissions(result.updatedMissions);
    }
    return result.scheduledCount;
  };

  const persistRecurringRules = (rules: RecurringRule[]) => {
    setRecurringRules(rules);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_recurring_rules", JSON.stringify(rules));
    }
  };

  const persistCourses = (updated: Course[]) => {
    setCourses(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_courses", JSON.stringify(updated));
    }
  };

  const persistLectureLogs = (updated: LectureLog[]) => {
    setLectureLogs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_lecture_logs", JSON.stringify(updated));
    }
  };

  const persistCyberTopics = (updated: CyberTopic[]) => {
    setCyberTopics(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_cyber_topics", JSON.stringify(updated));
    }
  };

  const persistResearchPapers = (updated: ResearchPaper[]) => {
    setResearchPapers(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_papers", JSON.stringify(updated));
    }
  };

  const persistSideProjects = (updated: SideProject[]) => {
    setSideProjects(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_side_projects", JSON.stringify(updated));
    }
  };

  const persistCfLogs = (updated: CodeforcesLog[]) => {
    setCfLogs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_cf_logs", JSON.stringify(updated));
    }
  };

  const persistWeeklyReviews = (updated: WeeklyReview[]) => {
    setWeeklyReviews(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_weekly_reviews", JSON.stringify(updated));
    }
  };

  const persistNotificationSettings = (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_notifications", JSON.stringify(settings));
    }
  };

  // 1. Auto-missions
  const toggleRecurringRule = (ruleId: string, isActive: boolean) => {
    const updated = recurringRules.map((r) =>
      r.id === ruleId ? { ...r, is_active: isActive } : r
    );
    persistRecurringRules(updated);
  };

  const updateRecurringRule = (rule: RecurringRule) => {
    const updated = recurringRules.map((r) => (r.id === rule.id ? rule : r));
    persistRecurringRules(updated);
  };

  const addRecurringRule = (newRuleData: Omit<RecurringRule, "id">) => {
    const newRule: RecurringRule = {
      ...newRuleData,
      id: `rr-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    persistRecurringRules([...recurringRules, newRule]);
  };

  const deleteRecurringRule = (ruleId: string) => {
    persistRecurringRules(recurringRules.filter((r) => r.id !== ruleId));
  };

  const runAutoMissionsGenerator = (
    currentMissions?: Mission[],
    currentRules?: RecurringRule[],
    blocks?: TimeBlock[],
    events?: AcademicEvent[],
    topics?: CyberTopic[]
  ) => {
    const targetMissions = currentMissions || missions;
    const targetRules = currentRules || recurringRules;
    const targetBlocks = blocks || timeBlocks;
    const targetEvents = events || academicEvents;
    const targetTopics = topics || cyberTopics;

    const nextTopic =
      targetTopics.find((t) => t.status === "learning") ||
      targetTopics.find((t) => t.status === "not_started");

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

    if (result.newMissions.length > 0) {
      const combined = [...result.newMissions, ...targetMissions];
      persistMissions(combined);
    }

    persistRecurringRules(result.updatedRules);

    return {
      createdCount: result.newMissions.length,
      message:
        result.newMissions.length > 0
          ? `Generated ${result.newMissions.length} auto-mission${result.newMissions.length > 1 ? "s" : ""} for today.`
          : "All auto-missions for today are up-to-date (0 duplicates created).",
    };
  };

  // 2. Course HQ Actions
  const addLectureLog = (logData: Omit<LectureLog, "id">) => {
    const newLog: LectureLog = {
      ...logData,
      id: `ll-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    persistLectureLogs([newLog, ...lectureLogs]);
  };

  const updateLectureLog = (log: LectureLog) => {
    const updated = lectureLogs.map((l) => (l.id === log.id ? log : l));
    persistLectureLogs(updated);
  };

  const deleteLectureLog = (logId: string) => {
    persistLectureLogs(lectureLogs.filter((l) => l.id !== logId));
  };

  const toggleLectureStudied = (logId: string, studied: boolean) => {
    const updated = lectureLogs.map((l) =>
      l.id === logId ? { ...l, studied } : l
    );
    persistLectureLogs(updated);
  };

  const addCourseResource = (courseId: string, resource: Omit<CourseResource, "id">) => {
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const newRes: CourseResource = {
          ...resource,
          id: `res-${Date.now()}`,
        };
        return {
          ...c,
          resources: [...(c.resources || []), newRes],
        };
      }
      return c;
    });
    persistCourses(updated);
  };

  const deleteCourseResource = (courseId: string, resourceId: string) => {
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          resources: (c.resources || []).filter((r) => r.id !== resourceId),
        };
      }
      return c;
    });
    persistCourses(updated);
  };

  // 3. Codeforces Actions
  const addCfLog = async (logData: Omit<CodeforcesLog, "id">) => {
    const newLog: CodeforcesLog = {
      ...logData,
      id: `cf-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    persistCfLogs([newLog, ...cfLogs]);
    persistXp(totalXp + (logData.xp || 25));

    if (hasSupabase && supabase && currentUser?.id) {
      try {
        await supabase.from("cf_log").insert({
          ...newLog,
          user_id: currentUser.id,
        });
      } catch (err) {
        console.error("Supabase addCfLog error:", err);
      }
    }
  };

  const updateCfLog = async (log: CodeforcesLog) => {
    const updated = cfLogs.map((c) => (c.id === log.id ? log : c));
    persistCfLogs(updated);

    if (hasSupabase && supabase && currentUser?.id) {
      try {
        await supabase.from("cf_log").update(log).eq("id", log.id);
      } catch (err) {
        console.error("Supabase updateCfLog error:", err);
      }
    }
  };

  const deleteCfLog = async (logId: string) => {
    persistCfLogs(cfLogs.filter((c) => c.id !== logId));

    if (hasSupabase && supabase && currentUser?.id) {
      try {
        await supabase.from("cf_log").delete().eq("id", logId);
      } catch (err) {
        console.error("Supabase deleteCfLog error:", err);
      }
    }
  };

  const updateCfHandle = async (newHandle: string) => {
    const clean = normalizeCodeforcesHandle(newHandle);
    setCfHandle(clean);
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_cf_handle", clean);
    }
    if (hasSupabase && supabase && currentUser?.id) {
      try {
        await supabase
          .from("user_settings")
          .upsert(
            {
              user_id: currentUser.id,
              cf_handle: clean,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      } catch (err) {
        console.error("Failed to update cf_handle in user_settings:", err);
      }
    }
  };

  const deduplicateCfLogs = async (): Promise<{ removedCount: number; remainingCount: number }> => {
    const { duplicateIdsToDelete, cleanedLogs } = findDuplicateLogIds(cfLogs);
    const removedCount = duplicateIdsToDelete.length;

    // Immediately update memory and localStorage
    persistCfLogs(cleanedLogs);

    // If connected to Supabase in cloud mode, purge duplicate records and update problem_keys
    if (hasSupabase && supabase && currentUser?.id && duplicateIdsToDelete.length > 0) {
      try {
        for (let i = 0; i < duplicateIdsToDelete.length; i += 100) {
          const batchIds = duplicateIdsToDelete.slice(i, i + 100);
          const { error } = await supabase.from("cf_log").delete().in("id", batchIds);
          if (error) {
            console.error("Failed to delete duplicate cf_log entries from Supabase:", error);
          }
        }

        // Upsert canonical problem_keys on remaining logs
        const updates = cleanedLogs.map((l) => ({
          id: l.id,
          user_id: currentUser.id,
          problem_key: l.problem_key || getCanonicalProblemKey(l),
          problem_name: l.problem_name,
          problem_url: l.problem_url || null,
          rating: l.rating || null,
          verdict: l.verdict || "OK",
          tags: l.tags || [],
          status: l.status || "solved",
          time_taken_minutes: l.time_taken_minutes || null,
          date: l.date || new Date().toISOString().slice(0, 10),
          notes: l.notes || null,
          solved_at: l.solved_at || null,
          xp: l.notes ? (l.xp ?? 0) : 0,
          handle: l.handle || cfHandle || null,
        }));

        for (let i = 0; i < updates.length; i += 100) {
          const batch = updates.slice(i, i + 100);
          await supabase.from("cf_log").upsert(batch, { onConflict: "id" });
        }
      } catch (err) {
        console.error("Cloud cf_log deduplication error:", err);
      }
    }

    return { removedCount, remainingCount: cleanedLogs.length };
  };

  const importCfLogs = async (newLogs: CodeforcesLog[], cleanedExistingLogs?: CodeforcesLog[]) => {
    const base = cleanedExistingLogs ? deduplicateExistingLogs(cleanedExistingLogs) : deduplicateExistingLogs(cfLogs);
    const updated = deduplicateExistingLogs([...newLogs, ...base]);
    persistCfLogs(updated);

    if (newLogs.length === 0) return;

    if (hasSupabase && supabase && currentUser?.id) {
      try {
        const toUpsert = newLogs.map((c) => {
          const problemKey = c.problem_key || getCanonicalProblemKey(c);
          return {
            id: c.id || problemKey,
            problem_key: problemKey,
            user_id: currentUser.id,
            handle: c.handle || cfHandle || null,
            problem_name: c.problem_name,
            problem_url: c.problem_url || null,
            rating: c.rating || null,
            verdict: c.verdict || "OK",
            tags: c.tags || [],
            status: c.status || "solved",
            time_taken_minutes: c.time_taken_minutes || null,
            date: c.date || new Date().toISOString().slice(0, 10),
            notes: c.notes || null,
            solved_at: c.solved_at || new Date().toISOString(),
            xp: 0,
            created_at: c.created_at || new Date().toISOString(),
          };
        });

        for (let i = 0; i < toUpsert.length; i += 100) {
          const batch = toUpsert.slice(i, i + 100);
          // 1. Try upsert with UNIQUE (user_id, problem_key)
          const { error } = await supabase
            .from("cf_log")
            .upsert(batch, { onConflict: "user_id,problem_key" });

          // 2. If unique constraint on problem_key isn't created in Supabase yet, fallback to primary key id
          if (error) {
            console.warn("Upsert by (user_id,problem_key) fallback to id:", error.message);
            const { error: idError } = await supabase
              .from("cf_log")
              .upsert(batch, { onConflict: "id" });
            if (idError) {
              console.error("Supabase upsert retry error on importCfLogs:", idError);
            }
          }
        }
      } catch (err) {
        console.error("Supabase importCfLogs error:", err);
      }
    }

    // Automatically perform database cleanup to delete any residual duplicates
    await deduplicateCfLogs();

    // If any problem was solved today, count towards today's daily CP mission
    const todayStr = new Date().toISOString().split("T")[0];
    const hasTodaySolved = newLogs.some((l) => l.status === "solved" && l.date === todayStr);
    if (hasTodaySolved) {
      const todayMission = missions.find(
        (m) =>
          (m.category_id === "cat-10" || m.title.toLowerCase().includes("codeforces")) &&
          m.status === "active"
      );
      if (todayMission) {
        completeMission(todayMission, "Auto-verified via Codeforces sync");
      }
    }
  };

  // 4. Cybersecurity Roadmap Actions
  const updateCyberTopicStatus = (
    topicId: string,
    status: CyberTopic["status"],
    notes?: string,
    timeSpent?: number,
    takeaway?: string,
    handsOnCompleted?: boolean
  ) => {
    let updatedTopic: CyberTopic | null = null;
    const updated = cyberTopics.map((t) => {
      if (t.id === topicId) {
        updatedTopic = {
          ...t,
          status,
          notes: notes !== undefined ? notes : t.notes,
          time_spent_minutes:
            timeSpent !== undefined
              ? (t.time_spent_minutes || 0) + timeSpent
              : t.time_spent_minutes,
          takeaway: takeaway !== undefined ? takeaway : t.takeaway,
          hands_on_completed:
            handsOnCompleted !== undefined ? handsOnCompleted : t.hands_on_completed,
          completed_at: status === "done" ? (t.completed_at || new Date().toISOString()) : (status === "not_started" ? null : t.completed_at),
        };
        return updatedTopic;
      }
      return t;
    });
    persistCyberTopics(updated);

    // In cloud mode, immediately persist topic update to Supabase
    if (hasSupabase && supabase && currentUser?.id && updatedTopic) {
      const t: CyberTopic = updatedTopic;
      supabase
        .from("cyber_topics")
        .upsert(
          {
            id: t.id,
            user_id: currentUser.id,
            section: t.section,
            title: t.title,
            status: t.status,
            goal: t.goal || null,
            learning_links: t.learning_links || [],
            hands_on_task: t.hands_on_task || null,
            hands_on_url: t.hands_on_url || null,
            hands_on_platform: t.hands_on_platform || null,
            hands_on_completed: t.hands_on_completed || false,
            takeaway: t.takeaway || null,
            notes: t.notes || null,
            time_spent_minutes: t.time_spent_minutes || 0,
            order_index: t.order_index || 0,
            completed_at: t.completed_at || null,
          },
          { onConflict: "id" }
        )
        .then(({ error }: { error: unknown }) => {
          if (error) console.error("Error persisting cyber topic to Supabase:", error);
        });
    }
  };

  const addCyberTopic = (topicData: Omit<CyberTopic, "id">) => {
    const newTopic: CyberTopic = {
      ...topicData,
      id: `ct-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    persistCyberTopics([...cyberTopics, newTopic]);
  };

  // 5. Research Papers Actions
  const addResearchPaper = (paperData: Omit<ResearchPaper, "id">) => {
    const newPaper: ResearchPaper = {
      ...paperData,
      id: `paper-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    persistResearchPapers([newPaper, ...researchPapers]);
  };

  const updateResearchPaper = (paper: ResearchPaper) => {
    const updated = researchPapers.map((p) => (p.id === paper.id ? paper : p));
    persistResearchPapers(updated);
  };

  const deleteResearchPaper = (paperId: string) => {
    persistResearchPapers(researchPapers.filter((p) => p.id !== paperId));
  };

  // 6. Side Projects Actions
  const addSideProject = (projData: Omit<SideProject, "id">) => {
    const newProj: SideProject = {
      ...projData,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    persistSideProjects([newProj, ...sideProjects]);
  };

  const updateSideProject = (proj: SideProject) => {
    const updated = sideProjects.map((p) => (p.id === proj.id ? proj : p));
    persistSideProjects(updated);
  };

  const deleteSideProject = (projId: string) => {
    persistSideProjects(sideProjects.filter((p) => p.id !== projId));
  };

  // 7. Weekly Reviews
  const saveWeeklyReview = (review: Omit<WeeklyReview, "id" | "created_at"> & { id?: string; created_at?: string }) => {
    const fullReview: WeeklyReview = {
      ...review,
      id: review.id || `wr-${Date.now()}`,
      created_at: review.created_at || new Date().toISOString(),
    };
    const existingIndex = weeklyReviews.findIndex(
      (r) => r.week_start_date === fullReview.week_start_date
    );
    let updated: WeeklyReview[];
    if (existingIndex >= 0) {
      updated = [...weeklyReviews];
      updated[existingIndex] = fullReview;
    } else {
      updated = [fullReview, ...weeklyReviews];
    }
    persistWeeklyReviews(updated);
  };

  // 8. Notifications
  const updateNotificationSettings = (settings: NotificationSettings) => {
    persistNotificationSettings(settings);
  };

  const updateDefaultTheme = (pref: ThemePreference) => {
    saveThemePreference(pref);
  };

  /**
   * Reset All Progress:
   * Permanently clears all operational/DEMO data:
   * - Missions (active, completed, locked)
   * - Total XP (resets to 0)
   * - Streak (resets to 0)
   * - Codeforces problem logs (cleared to []) & handle (cleared)
   * - Lecture logs (cleared to [])
   * - Research papers (cleared to [])
   * - Side projects (cleared to [])
   * - Weekly reviews (cleared to [])
   * - Cybersecurity progress (all 28 topics reset to "not_started" with 0 min and no notes)
   * - Course resources (cleared to [])
   *
   * PRESERVES all structural baseline data:
   * - Timetable & routine (class_schedule)
   * - Course catalog (code, section, faculty, room, credits)
   * - Time blocks grid (SAT to FRI)
   * - Academic calendar (exam, holiday, payment, deadline events)
   * - Recurring auto-mission rules (rr-class-review, rr-tuition-prep, etc.)
   * - Full cybersecurity 28 syllabus topics structure
   * - Theme and animation preferences
   * - User auth state
   *
   * In Supabase mode, deletes only rows belonging to currentUser.id.
   */
  const resetAllProgress = async () => {
    // 1. Reset React memory state
    setMissions([]);
    setTotalXp(0);
    setStreak(0);
    setCfLogs([]);
    setLectureLogs([]);
    setResearchPapers([]);
    setSideProjects([]);
    setWeeklyReviews([]);

    const cleanCyberTopics = DEFAULT_CYBER_TOPICS.map((t) => ({
      ...t,
      status: "not_started" as const,
      time_spent_minutes: 0,
      notes: undefined,
    }));
    setCyberTopics(cleanCyberTopics);

    const cleanCourses = courses.map((c) => ({
      ...c,
      resources: [],
    }));
    setCourses(cleanCourses);

    // 2. Clear from LocalStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("op_me_missions", JSON.stringify([]));
      localStorage.setItem("op_me_xp", "0");
      localStorage.setItem("op_me_streak", "0");
      localStorage.setItem("op_me_cf_logs", JSON.stringify([]));
      localStorage.removeItem("op_me_cf_handle");
      localStorage.removeItem("op_me_cf_last_synced");
      localStorage.removeItem("op_me_cf_api_solved_total");
      localStorage.setItem("op_me_lecture_logs", JSON.stringify([]));
      localStorage.setItem("op_me_papers", JSON.stringify([]));
      localStorage.setItem("op_me_side_projects", JSON.stringify([]));
      localStorage.setItem("op_me_weekly_reviews", JSON.stringify([]));
      localStorage.setItem("op_me_cyber_topics", JSON.stringify(cleanCyberTopics));
      localStorage.setItem("op_me_courses", JSON.stringify(cleanCourses));
      localStorage.setItem("op_me_last_reset", new Date().toISOString());
    }

    // 3. Clear cloud rows for current user only
    if (hasSupabase && supabase && currentUser?.id) {
      const uid = currentUser.id;
      const deleteErrors: string[] = [];

      await Promise.all(
        RESET_PROGRESS_TABLES.map(async (table) => {
          try {
            const { error } = await supabase.from(table).delete().eq("user_id", uid);
            if (error) {
              deleteErrors.push(`[${table}]: ${error.message || "Delete failed"}`);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Execution failed";
            deleteErrors.push(`[${table}]: ${msg}`);
          }
        })
      );

      if (deleteErrors.length > 0) {
        const errorSummary = `Failed to reset cloud tables: ${deleteErrors.join("; ")}`;
        console.error("Error clearing Supabase progress:", errorSummary);
        return {
          success: false,
          error: errorSummary,
          deleted: [],
          kept: [],
        };
      }
    }

    return {
      success: true,
      deleted: [
        "Missions (active & completed)",
        "Total XP (reset to 0)",
        "Daily streak (reset to 0)",
        "Codeforces problem logs & handle",
        "Lecture study logs",
        "Research papers archive",
        "Side projects log",
        "Weekly performance reviews",
        "Cybersecurity progress & notes (reset to Not Started)",
        "Course resource links & attachments",
      ],
      kept: [
        "Weekly class schedule & tuition routine",
        "Course catalog (OS, OS Lab, Economics, DIP, Statistics, FYDP)",
        "Weekly 7-day time-blocks (9 AM to 10 PM)",
        "Academic calendar & key milestone dates",
        "Recurring auto-mission configuration rules",
        "Full 28-topic cybersecurity syllabus structure",
        "Theme and animation preferences",
        "Account authentication clearance",
      ],
    };
  };

  return {
    isAuthenticated,
    currentUser,
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
    isSupabaseConnected: hasSupabase,
    refreshData: async () => {
      if (hasSupabase && supabase && currentUser) {
        await fetchSupabaseData(currentUser.id);
      }
    },
    login,
    resetPassword,
    guestBypass,
    logout,
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
    resetAllProgress,
  };
}

