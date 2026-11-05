"use client";

import { useState, useEffect } from "react";
import { 
  Mission, 
  Category, 
  ClassScheduleItem, 
  Priority 
} from "@/types/database";
import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_SCHEDULE, 
  INITIAL_STARTER_MISSIONS 
} from "@/lib/seeds";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { 
  ThemePreference, 
  getStoredThemePreference, 
  saveThemePreference, 
  resolveTheme, 
  applyThemeClass 
} from "@/lib/theme";

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
  const [totalXp, setTotalXp] = useState<number>(350); // Initial baseline for Agent Akib
  const [streak, setStreak] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(true);
  const [defaultTheme, setDefaultThemeState] = useState<ThemePreference>("dark");

  const supabase = createClient();
  const hasSupabase = isSupabaseConfigured() && supabase !== null;

  // Initialize data on mount
  useEffect(() => {
    async function init() {
      setLoading(true);

      const storedPref = getStoredThemePreference();
      setDefaultThemeState(storedPref);
      applyThemeClass(resolveTheme(storedPref));

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

  const updateDefaultTheme = (pref: ThemePreference) => {
    setDefaultThemeState(pref);
    saveThemePreference(pref);
  };

  return {
    isAuthenticated,
    currentUser,
    missions,
    categories,
    schedule,
    totalXp,
    streak,
    loading,
    defaultTheme,
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
  };
}

