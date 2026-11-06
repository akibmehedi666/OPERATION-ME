import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkLocalDataToMigrate,
  migrateLocalDataToSupabase,
  clearMigratedLocalData,
} from "../cloudMigration";
import { collectLocalDataForExport } from "../dataBackup";
import { validateSupabaseConfig } from "../supabase/config";
import { Mission, Course } from "@/types/database";

describe("Cloud Migration & Data Backup Engine", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("checkLocalDataToMigrate", () => {
    it("returns hasData = false when localStorage is empty", () => {
      const summary = checkLocalDataToMigrate("user-123");
      expect(summary.hasData).toBe(false);
      expect(summary.totalItems).toBe(0);
    });

    it("detects local operational data when missions exist in localStorage", () => {
      const sampleMissions: Partial<Mission>[] = [
        { id: "m-1", title: "Study Virtual Memory", codename: "OP-1", status: "active", xp: 50 },
        { id: "m-2", title: "OS Lab Signals", codename: "OP-2", status: "active", xp: 50 },
      ];
      localStorage.setItem("op_me_missions", JSON.stringify(sampleMissions));

      const summary = checkLocalDataToMigrate("user-123");
      expect(summary.hasData).toBe(true);
      expect(summary.missionCount).toBe(2);
      expect(summary.totalItems).toBe(2);
    });

    it("returns hasData = false if user has already migrated and dismissed", () => {
      localStorage.setItem("op_me_missions", JSON.stringify([{ id: "m-1", title: "Test" }]));
      localStorage.setItem("op_me_migrated_user-123", "true");

      const summary = checkLocalDataToMigrate("user-123");
      expect(summary.hasData).toBe(false);
    });

    it("returns hasData = false when only demo missions exist in localStorage", () => {
      localStorage.setItem(
        "op_me_missions",
        JSON.stringify([
          { id: "m-001", title: "Review Operating Systems" },
          { id: "m-002", title: "Implement DIP Sobel" },
        ])
      );

      const summary = checkLocalDataToMigrate("user-123");
      expect(summary.hasData).toBe(false);
      expect(summary.missionCount).toBe(0);
    });

    it("returns hasData = false when only template courses and time blocks exist", () => {
      localStorage.setItem("op_me_courses", JSON.stringify([{ id: "course-os", code: "CSE-406" }]));
      localStorage.setItem("op_me_time_blocks", JSON.stringify([{ id: "tb-sat-1", weekday: "SAT" }]));

      const summary = checkLocalDataToMigrate("user-123");
      expect(summary.hasData).toBe(false);
    });
  });

  describe("migrateLocalDataToSupabase - Deduplication & Safety", () => {
    it("migrates local missions and strictly skips existing duplicates in Supabase", async () => {
      const localMissions: Partial<Mission>[] = [
        { id: "m-1", title: "Virtual Memory Paging", codename: "OP-1", priority: "urgent", status: "active", xp: 50 },
        { id: "m-2", title: "Unique New Mission", codename: "OP-2", priority: "medium", status: "active", xp: 60 },
      ];
      localStorage.setItem("op_me_missions", JSON.stringify(localMissions));

      // Mock Supabase with 1 existing cloud mission that has title "Virtual Memory Paging"
      const insertedRows: unknown[] = [];
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "missions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { id: "cloud-m-99", title: "Virtual Memory Paging" }, // Duplicate by title
                  ],
                  error: null,
                }),
              }),
              insert: vi.fn().mockImplementation((rows) => {
                insertedRows.push(...rows);
                return Promise.resolve({ data: rows, error: null });
              }),
            };
          }
          // Default empty table response
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            insert: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
      } as unknown as Parameters<typeof migrateLocalDataToSupabase>[0];

      const result = await migrateLocalDataToSupabase(mockSupabase, "user-abc");

      expect(result.success).toBe(true);
      // "Virtual Memory Paging" duplicate skipped, "Unique New Mission" imported
      expect(result.skippedCount).toBe(1);
      expect(result.importedCount).toBe(1);
      expect(result.details.missions).toBe(1);
      expect(insertedRows).toHaveLength(1);
      expect((insertedRows[0] as { title: string; user_id: string }).title).toBe("Unique New Mission");
      expect((insertedRows[0] as { title: string; user_id: string }).user_id).toBe("user-abc");

      // CRITICAL CHECK: LocalStorage data must NOT be deleted yet!
      expect(localStorage.getItem("op_me_missions")).not.toBeNull();
      // Migration flag set for user
      expect(localStorage.getItem("op_me_migrated_user-abc")).toBe("true");
    });

    it("skips duplicate courses by course code or id", async () => {
      const localCourses: Partial<Course>[] = [
        { id: "cse-406", code: "CSE-406", name: "Operating Systems", credits: 3.0 },
        { id: "cse-999", code: "CSE-999", name: "Advanced Robotics", credits: 3.0 },
      ];
      localStorage.setItem("op_me_courses", JSON.stringify(localCourses));

      const insertedCourses: unknown[] = [];
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "courses") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "cse-406", code: "CSE-406" }], // Duplicate course code
                  error: null,
                }),
              }),
              insert: vi.fn().mockImplementation((rows) => {
                insertedCourses.push(...rows);
                return Promise.resolve({ data: rows, error: null });
              }),
            };
          }
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            insert: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
      } as unknown as Parameters<typeof migrateLocalDataToSupabase>[0];

      const result = await migrateLocalDataToSupabase(mockSupabase, "user-abc");
      expect(result.success).toBe(true);
      expect(result.skippedCount).toBe(1);
      expect(result.details.courses).toBe(1);
      expect(insertedCourses).toHaveLength(1);
      expect((insertedCourses[0] as { code: string }).code).toBe("CSE-999");
    });
  });

  describe("clearMigratedLocalData - Explicit Confirmation", () => {
    it("deletes operational data but preserves theme and animations preferences", () => {
      localStorage.setItem("op_me_missions", JSON.stringify([{ id: "m-1" }]));
      localStorage.setItem("op_me_side_projects", JSON.stringify([{ id: "p-1" }]));
      localStorage.setItem("op_me_theme_preference", "light");
      localStorage.setItem("op_me_animations_enabled", "false");

      clearMigratedLocalData("user-123");

      // Operational tables cleared
      expect(localStorage.getItem("op_me_missions")).toBeNull();
      expect(localStorage.getItem("op_me_side_projects")).toBeNull();

      // UI Preferences preserved!
      expect(localStorage.getItem("op_me_theme_preference")).toBe("light");
      expect(localStorage.getItem("op_me_animations_enabled")).toBe("false");
      expect(localStorage.getItem("op_me_local_cleared_user-123")).toBe("true");
    });
  });

  describe("collectLocalDataForExport", () => {
    it("packages all tables into a structured backup object", () => {
      localStorage.setItem("op_me_missions", JSON.stringify([{ id: "m-1", title: "Test" }]));
      localStorage.setItem("op_me_xp", "850");
      localStorage.setItem("op_me_streak", "14");

      const exportData = collectLocalDataForExport();

      expect(exportData.version).toBe("2.0");
      expect(exportData.agent).toBe("Agent Akib");
      expect(exportData.xp).toBe(850);
      expect(exportData.streak).toBe(14);
      expect(exportData.missions).toHaveLength(1);
    });
  });

  describe("validateSupabaseConfig & Test Environment Isolation Guard", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("ensures automated test environment is strictly isolated and never uses a live database URL", () => {
      const activeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      expect(activeUrl).toContain("test-isolation");
      expect(activeUrl).not.toContain("kskcqopajrqebhcuepgo");
    });

    it("blocks secret / service_role keys from being used in browser client", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example-project.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_secret_dangerous_key_never_in_browser";

      const status = validateSupabaseConfig();
      expect(status.isConfigured).toBe(false);
      expect(status.status).toBe("secret_key_blocked");
      expect(status.message).toContain("SECURITY ALERT");
    });

    it("flags malformed URLs containing /rest/v1 or missing https", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example-project.supabase.co/rest/v1";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_valid_looking_key_123456789";

      const status = validateSupabaseConfig();
      expect(status.isConfigured).toBe(false);
      expect(status.status).toBe("malformed_url");
      expect(status.message).toContain("/rest/v1");
    });

    it("validates legitimate publishable key and base project URL", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://legit-project.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_proper_length_token_123456789";

      const status = validateSupabaseConfig();
      expect(status.isConfigured).toBe(true);
      expect(status.status).toBe("valid");
    });
  });
});
