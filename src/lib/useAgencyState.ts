"use client";

import { useState, useEffect } from "react";
import { 
  Mission, 
  Category, 
  ClassScheduleItem, 
  Priority,
  TimeBlock,
  AcademicEvent
} from "@/types/database";
import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_SCHEDULE, 
  INITIAL_STARTER_MISSIONS,
  DEFAULT_TIME_BLOCKS,
  DEFAULT_ACADEMIC_EVENTS
} from "@/lib/seeds";
import { autoScheduleMissions } from "@/lib/plannerScheduler";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { 
  ThemePreference, 
  getStoredThemePreference, 
  saveThemePreference 
} from "@/lib/theme";
import { getRankFromXp } from "@/lib/rank";

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function useAgencyState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [schedule, setSchedule] = useState<ClassScheduleItem[]>(DEFAULT_SCHEDULE);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(DEFAULT_TIME_BLOCKS);
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>(DEFAULT_ACADEMIC_EVENTS);
  const [totalXp, setTotalXp] = useState<number>(350); // Initial baseline for Agent Akib
  const [streak, setStreak] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();
  const hasSupabase = isSupabaseConfigured() && supabase !== null;

  // Initialize data on mount
  useEffect(() => {
    async function init() {
      setLoading(true);

      // Check if user authenticated in Supabase
      if (hasSupabase && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setIsAuthenticated(true);
            setCurrentUser({ id: session.user.id, email: session.user.email || "" });
            await fetchSupabaseData(session.user.id);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Supabase session error:", e);
        }
      }

      // Check local storage session fallback
      if (typeof window !== "undefined") {
        const localAuth = localStorage.getItem("operation_me_auth");
        if (localAuth === "true") {
          setIsAuthenticated(true);
          setCurrentUser({ id: "agent-akib-local", email: "akib@agency.internal" });
          loadLocalData();
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from LocalStorage
  const loadLocalData = () => {
    if (typeof window === "undefined") return;

    try {
      const storedMissions = localStorage.getItem("op_me_missions");
      if (storedMissions) {
        setMissions(JSON.parse(storedMissions));
      } else {
        setMissions(INITIAL_STARTER_MISSIONS);
        localStorage.setItem("op_me_missions", JSON.stringify(INITIAL_STARTER_MISSIONS));
      }

      const storedXp = localStorage.getItem("op_me_xp");
      if (storedXp) setTotalXp(Number(storedXp));

      const storedStreak = localStorage.getItem("op_me_streak");
      if (storedStreak) setStreak(Number(storedStreak));

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
    } catch (e) {
      console.error("LocalStorage load error:", e);
      setMissions(INITIAL_STARTER_MISSIONS);
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
        // Seed initial missions for this user if table empty
        setMissions(INITIAL_STARTER_MISSIONS);
      }

      // 4. Fetch XP events
      const { data: xpData } = await supabase
        .from("xp_events")
        .select("amount")
        .eq("user_id", userId);

      if (xpData && xpData.length > 0) {
        const sum = xpData.reduce((acc, row) => acc + (row.amount || 0), 0);
        setTotalXp(sum + 100);
      }

      // 5. Fetch streak
      const { data: streakData } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (streakData) {
        setStreak(streakData.current_streak || 1);
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

  // Auth: Email login or signup
  const login = async (email: string, pass: string, isSignUp = false) => {
    if (hasSupabase && supabase) {
      try {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
          });
          if (error) return { success: false, error: error.message };
          if (data.user) {
            setIsAuthenticated(true);
            setCurrentUser({ id: data.user.id, email: data.user.email || "" });
            await fetchSupabaseData(data.user.id);
            return { success: true };
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
          });
          if (error) return { success: false, error: error.message };
          if (data.user) {
            setIsAuthenticated(true);
            setCurrentUser({ id: data.user.id, email: data.user.email || "" });
            await fetchSupabaseData(data.user.id);
            return { success: true };
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication handshake failed";
        return { success: false, error: message };
      }
    }

    // Local authentication fallback
    setIsAuthenticated(true);
    setCurrentUser({ id: "agent-akib-local", email: email || "akib@agency.internal" });
    if (typeof window !== "undefined") {
      localStorage.setItem("operation_me_auth", "true");
    }
    loadLocalData();
    return { success: true };
  };

  // Guest Direct Bypass
  const guestBypass = () => {
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
      await supabase.auth.signOut();
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

  const updateDefaultTheme = (pref: ThemePreference) => {
    saveThemePreference(pref);
  };

  return {
    isAuthenticated,
    currentUser,
    missions,
    categories,
    schedule,
    timeBlocks,
    academicEvents,
    totalXp,
    streak,
    loading,
    defaultTheme: getStoredThemePreference(),
    updateDefaultTheme,
    isSupabaseConnected: hasSupabase,
    login,
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
  };
}

