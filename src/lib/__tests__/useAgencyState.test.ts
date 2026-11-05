import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgencyState } from "../useAgencyState";
import { Mission } from "@/types/database";

// Create mock Supabase functions
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockFrom = vi.fn();

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
    },
    from: mockFrom,
  }),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => true,
}));

describe("useAgencyState - State, Auth, RLS, and Mission Completion", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();

    mockFrom.mockImplementation(() => createChainableMock());
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  describe("Auth & Session handling", () => {
    it("starts unauthenticated when no session exists", async () => {
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("handles login failure with clear error message (wrong credentials)", async () => {
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
    });

    it("handles login success and authenticates user", async () => {
      const mockUser = { id: "user-123", email: "operative@agency.test" };
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock database calls for this user
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
    });

    it("guestBypass authenticates immediately with direct credentials", async () => {
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      act(() => {
        result.current.guestBypass();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem("operation_me_auth")).toBe("true");
    });

    it("logout clears credentials and returns to unauthenticated state", async () => {
      const { result } = renderHook(() => useAgencyState());
      await act(async () => {});

      act(() => {
        result.current.guestBypass();
      });
      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem("operation_me_auth")).toBeNull();
    });
  });

  describe("Mission Completion & Auto-Assignment Algorithm", () => {
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

      // App gracefully catches the error and loads fallback seed data
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.missions.length).toBeGreaterThan(0);
      expect(result.current.totalXp).toBeGreaterThan(0);
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
});
