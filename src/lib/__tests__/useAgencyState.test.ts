import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgencyState } from "../useAgencyState";
import { Mission } from "@/types/database";

// Create mock Supabase functions
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();
let isConfiguredMock = true;

const createChainableMock = () => {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockResolvedValue({ data: [] }),
    order: vi.fn().mockResolvedValue({ data: [] }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    single: vi.fn().mockResolvedValue({ data: null }),
  };
  return chain;
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      resetPasswordForEmail: mockResetPasswordForEmail,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => isConfiguredMock,
}));

describe("useAgencyState - State, Auth, RLS, and Mission Completion", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    isConfiguredMock = true;

    mockFrom.mockImplementation(() => createChainableMock());
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  describe("Auth & Session handling", () => {
    it("starts unauthenticated when no session exists in cloud mode", async () => {
      isConfiguredMock = true;
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
    });

    it("cloud mode blocks guestBypass entirely and never sets operation_me_auth", async () => {
      isConfiguredMock = true;
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      act(() => {
        result.current.guestBypass();
      });

      // Guest bypass is ignored in cloud mode: user remains unauthenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
      expect(localStorage.getItem("operation_me_auth")).toBeNull();
    });

    it("local mode allows guestBypass and sets operation_me_auth", async () => {
      isConfiguredMock = false;
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      act(() => {
        result.current.guestBypass();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser?.id).toBe("agent-akib-direct");
      expect(localStorage.getItem("operation_me_auth")).toBe("true");
    });

    it("handles login failure with clear error message (wrong credentials) in cloud mode", async () => {
      isConfiguredMock = true;
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      });

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login("agent@agency.test", "wrongpass");
      });

      expect(loginResult).toEqual({
        success: false,
        error: "Invalid login credentials",
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem("operation_me_auth")).toBeNull();
    });

    it("handles login success and authenticates user in cloud mode via Supabase", async () => {
      isConfiguredMock = true;
      const mockUser = { id: "user-123", email: "operative@agency.test" };
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [] }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login("operative@agency.test", "correctpass");
      });

      expect(loginResult).toEqual({ success: true });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser?.id).toBe("user-123");
      // Cloud login must never write local bypass token
      expect(localStorage.getItem("operation_me_auth")).toBeNull();
    });

    it("dispatches password reset request via Supabase resetPasswordForEmail", async () => {
      isConfiguredMock = true;
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword("operative@agency.test");
      });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("operative@agency.test");
      expect(resetResult).toEqual({
        success: true,
        message: "Password reset link sent to your email.",
      });
    });

    it("logout calls Supabase signOut and clears session state completely", async () => {
      isConfiguredMock = true;
      const mockUser = { id: "user-123", email: "operative@agency.test" };
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      await act(async () => {
        await result.current.login("operative@agency.test", "correctpass");
      });
      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
      expect(localStorage.getItem("operation_me_auth")).toBeNull();
    });

    it("auto-refreshes session when Supabase triggers TOKEN_REFRESHED", async () => {
      isConfiguredMock = true;
      let authStateCallback: (event: string, session: { user: { id: string; email: string } } | null) => void = () => {};
      mockOnAuthStateChange.mockImplementation((cb: (event: string, session: { user: { id: string; email: string } } | null) => void) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      // Simulate token auto-refresh event from Supabase auth listener
      act(() => {
        authStateCallback("TOKEN_REFRESHED", {
          user: { id: "user-refreshed-99", email: "refreshed@agency.org" },
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser?.id).toBe("user-refreshed-99");
      expect(result.current.currentUser?.email).toBe("refreshed@agency.org");
    });
  });

  describe("Mission Completion & Auto-Assignment Algorithm", () => {
    beforeEach(() => {
      isConfiguredMock = false;
    });
    it("completes a mission, awards XP, increments streak, and auto-assigns next target", async () => {
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      act(() => {
        result.current.guestBypass();
      });

      // Prepare 3 test missions:
      // Mission A: active, priority medium, xp 50
      // Mission B: priority urgent, deadline in 5 hours
      // Mission C: priority high, deadline in 2 hours
      const missionA: Mission = {
        id: "m-a",
        title: "Target A",
        codename: "OP-A",
        priority: "medium",
        status: "active",
        xp: 50,
        deadline: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      const missionB: Mission = {
        id: "m-b",
        title: "Target B (Urgent)",
        codename: "OP-B",
        priority: "urgent",
        status: "locked",
        xp: 80,
        deadline: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      const missionC: Mission = {
        id: "m-c",
        title: "Target C (High)",
        codename: "OP-C",
        priority: "high",
        status: "locked",
        xp: 60,
        deadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      // Set missions directly in localStorage and reload
      localStorage.setItem("op_me_missions", JSON.stringify([missionA, missionB, missionC]));
      localStorage.setItem("op_me_xp", "350");
      localStorage.setItem("op_me_streak", "4");

      const { result: loadedHook } = renderHook(() => useAgencyState());
      await act(async () => {});

      act(() => {
        loadedHook.current.guestBypass();
      });

      const initialXp = loadedHook.current.totalXp;
      const initialStreak = loadedHook.current.streak;

      let completionResult: Awaited<ReturnType<ReturnType<typeof useAgencyState>["completeMission"]>> | undefined;
      await act(async () => {
        completionResult = await loadedHook.current.completeMission(
          missionA,
          "Completed in record time",
          45
        );
      });

      // 1. Verify XP awarded
      expect(completionResult?.xpAwarded).toBe(50);
      expect(loadedHook.current.totalXp).toBe(initialXp + 50);

      // 2. Verify Streak incremented
      expect(loadedHook.current.streak).toBe(initialStreak + 1);

      // 3. Verify Debrief note and time spent stored
      expect(completionResult?.completedMission.completion_note).toBe("Completed in record time");
      expect(completionResult?.completedMission.time_spent_minutes).toBe(45);
      expect(completionResult?.completedMission.completed_at).toBeDefined();

      // 4. Verify Next Mission Auto-Assigned by Highest Priority (urgent > high)
      // Mission B has urgent priority, so it must be selected over Mission C!
      expect(completionResult?.nextMission).toBeDefined();
      expect(completionResult?.nextMission?.id).toBe("m-b");

      const activeMissionInList = loadedHook.current.missions.find((m) => m.status === "active");
      expect(activeMissionInList?.id).toBe("m-b");
    });

    it("auto-assigns by nearest deadline when priorities are equal", async () => {
      const now = Date.now();
      const missionA: Mission = {
        id: "m-1",
        title: "Task 1",
        codename: "OP-1",
        priority: "high",
        status: "active",
        xp: 50,
        deadline: new Date(now + 10 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      const missionFar: Mission = {
        id: "m-far",
        title: "Far Deadline",
        codename: "OP-FAR",
        priority: "high",
        status: "locked",
        xp: 50,
        deadline: new Date(now + 24 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      const missionNear: Mission = {
        id: "m-near",
        title: "Near Deadline",
        codename: "OP-NEAR",
        priority: "high",
        status: "locked",
        xp: 50,
        deadline: new Date(now + 2 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      localStorage.setItem("op_me_missions", JSON.stringify([missionA, missionFar, missionNear]));
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});
      act(() => {
        result.current.guestBypass();
      });

      let res: Awaited<ReturnType<ReturnType<typeof useAgencyState>["completeMission"]>> | undefined;
      await act(async () => {
        res = await result.current.completeMission(missionA);
      });

      expect(res?.nextMission?.id).toBe("m-near");
    });

    it("completing the last mission results in nextMission = null without throwing", async () => {
      const loneMission: Mission = {
        id: "lone-1",
        title: "Final Mission",
        codename: "OP-LAST",
        priority: "urgent",
        status: "active",
        xp: 50,
        deadline: null,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem("op_me_missions", JSON.stringify([loneMission]));
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});
      act(() => {
        result.current.guestBypass();
      });

      let res: Awaited<ReturnType<ReturnType<typeof useAgencyState>["completeMission"]>> | undefined;
      await act(async () => {
        res = await result.current.completeMission(loneMission);
      });

      expect(res?.nextMission).toBeNull();
      const anyActive = result.current.missions.some((m) => m.status === "active");
      expect(anyActive).toBe(false);
    });

    it("allows editing debrief note on already completed mission", async () => {
      const completedMission: Mission = {
        id: "comp-1",
        title: "Finished Task",
        codename: "OP-DONE",
        priority: "medium",
        status: "completed",
        completed_at: new Date().toISOString(),
        xp: 50,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem("op_me_missions", JSON.stringify([completedMission]));
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});
      act(() => {
        result.current.guestBypass();
      });

      await act(async () => {
        await result.current.updateMissionNote("comp-1", "Updated retrospective analysis", 30);
      });

      const updated = result.current.missions.find((m) => m.id === "comp-1");
      expect(updated?.completion_note).toBe("Updated retrospective analysis");
      expect(updated?.time_spent_minutes).toBe(30);
    });
  });

  describe("Data CRUD & Error Simulation", () => {
    it("adds, edits, and deletes missions in state and storage", async () => {
      isConfiguredMock = false;
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});
      act(() => {
        result.current.guestBypass();
      });

      // Add
      await act(async () => {
        await result.current.addMission({
          title: "New Recon Op",
          priority: "urgent",
          xp: 100,
        });
      });
      expect(result.current.missions[0].title).toBe("New Recon Op");

      // Edit
      const addedId = result.current.missions[0].id;
      await act(async () => {
        await result.current.editMission({
          id: addedId,
          title: "New Recon Op (Revised)",
        });
      });
      expect(result.current.missions[0].title).toBe("New Recon Op (Revised)");

      // Delete
      await act(async () => {
        await result.current.deleteMission(addedId);
      });
      expect(result.current.missions.find((m) => m.id === addedId)).toBeUndefined();
    });

    it("gracefully survives Supabase query failure without crashing app", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: "user-err", email: "err@agency.internal" },
          },
        },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          throw new Error("Simulated Network Connection Refused");
        }),
      });

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      // App gracefully catches the error and keeps baseline state intact
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.categories.length).toBe(11);
      expect(result.current.schedule.length).toBe(13);
      expect(result.current.missions).toHaveLength(0);
      expect(result.current.totalXp).toBe(0);
    });

    it("RLS isolation: ensures user_id filtering is included on queries", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [] });

      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        or: vi.fn().mockResolvedValue({ data: [] }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      mockGetSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: "user-alpha", email: "alpha@agency.internal" },
          },
        },
      });

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      expect(result.current.isAuthenticated).toBe(true);
      // Verify queries filtered for user-alpha
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-alpha");
    });
  });

  describe("Fresh User Baseline & resetAllProgress", () => {
    it("fresh user has 0 XP, 0 streak, no missions or logs, but has full structure", async () => {
      isConfiguredMock = false;
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      act(() => {
        result.current.guestBypass();
      });

      // DEMO data is clean/zeroed
      expect(result.current.totalXp).toBe(0);
      expect(result.current.streak).toBe(0);
      expect(result.current.missions).toHaveLength(0);
      expect(result.current.lectureLogs).toHaveLength(0);
      expect(result.current.researchPapers).toHaveLength(0);
      expect(result.current.sideProjects).toHaveLength(0);
      expect(result.current.cfLogs).toHaveLength(0);
      expect(result.current.weeklyReviews).toHaveLength(0);

      // STRUCTURE is fully intact
      expect(result.current.categories).toHaveLength(11);
      expect(result.current.schedule).toHaveLength(13);
      expect(result.current.courses).toHaveLength(6);
      expect(result.current.timeBlocks.length).toBeGreaterThan(20);
      expect(result.current.academicEvents.length).toBeGreaterThan(10);
      expect(result.current.recurringRules.length).toBeGreaterThan(5);

      // Cybersecurity roadmap: all 28 topics start with not_started and 0 minutes
      expect(result.current.cyberTopics).toHaveLength(28);
      result.current.cyberTopics.forEach((t) => {
        expect(t.status).toBe("not_started");
        expect(t.time_spent_minutes).toBe(0);
      });
    });

    it("resetAllProgress deletes all progress and logs while preserving STRUCTURE", async () => {
      isConfiguredMock = false;
      // Simulate existing user progress in localStorage
      localStorage.setItem("op_me_missions", JSON.stringify([{ id: "m-user-1", title: "User Task" }]));
      localStorage.setItem("op_me_xp", "850");
      localStorage.setItem("op_me_streak", "12");
      localStorage.setItem("op_me_cf_logs", JSON.stringify([{ id: "cf-user-1", problem_name: "4A" }]));
      localStorage.setItem("op_me_cf_handle", "user_operative");
      localStorage.setItem("op_me_lecture_logs", JSON.stringify([{ id: "ll-1", topic: "Virtual Memory" }]));
      localStorage.setItem("op_me_papers", JSON.stringify([{ id: "paper-1", title: "Attention" }]));
      localStorage.setItem("op_me_side_projects", JSON.stringify([{ id: "proj-1", name: "Custom Project" }]));
      localStorage.setItem("op_me_theme_preference", "light");
      localStorage.setItem("op_me_animations_enabled", "false");

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      act(() => {
        result.current.guestBypass();
      });

      // Verify progress was loaded
      expect(result.current.totalXp).toBe(850);
      expect(result.current.streak).toBe(12);
      expect(result.current.missions).toHaveLength(1);

      // Execute Reset All Progress
      let resetOutput: Awaited<ReturnType<typeof result.current.resetAllProgress>> | undefined;
      await act(async () => {
        resetOutput = await result.current.resetAllProgress();
      });

      expect(resetOutput?.success).toBe(true);

      // State is completely clean
      expect(result.current.totalXp).toBe(0);
      expect(result.current.streak).toBe(0);
      expect(result.current.missions).toHaveLength(0);
      expect(result.current.cfLogs).toHaveLength(0);
      expect(result.current.lectureLogs).toHaveLength(0);
      expect(result.current.researchPapers).toHaveLength(0);
      expect(result.current.sideProjects).toHaveLength(0);
      expect(result.current.weeklyReviews).toHaveLength(0);

      // LocalStorage keys cleared
      expect(localStorage.getItem("op_me_xp")).toBe("0");
      expect(localStorage.getItem("op_me_streak")).toBe("0");
      expect(localStorage.getItem("op_me_cf_handle")).toBeNull();

      // STRUCTURE kept intact
      expect(result.current.categories).toHaveLength(11);
      expect(result.current.schedule).toHaveLength(13);
      expect(result.current.courses).toHaveLength(6);
      expect(result.current.cyberTopics).toHaveLength(28);

      // Preferences preserved
      expect(localStorage.getItem("op_me_theme_preference")).toBe("light");
      expect(localStorage.getItem("op_me_animations_enabled")).toBe("false");
    });

    it("reports an error if any cloud delete fails during resetAllProgress", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: "test-user-id", email: "test@example.com" },
          },
        },
      });

      mockFrom.mockImplementation((tableName: string) => {
        const mock = createChainableMock();
        if (tableName === "cf_log") {
          mock.eq = vi.fn().mockResolvedValue({
            data: null,
            error: { message: "RLS policy denied delete on cf_log" },
          });
        }
        return mock;
      });

      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      let resetOutput: Awaited<ReturnType<typeof result.current.resetAllProgress>> | undefined;
      await act(async () => {
        resetOutput = await result.current.resetAllProgress();
      });

      expect(resetOutput?.success).toBe(false);
      expect(resetOutput?.error).toContain("Failed to reset cloud tables");
      expect(resetOutput?.error).toContain("RLS policy denied delete on cf_log");
    });
  });
});
