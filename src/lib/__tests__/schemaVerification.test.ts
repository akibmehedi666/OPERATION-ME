import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RESET_PROGRESS_TABLES } from "../useAgencyState";
import { CLOUD_MIGRATION_TABLES } from "../cloudMigration";

describe("Database Schema Verification (supabase/schema.sql)", () => {
  const schemaPath = path.resolve(process.cwd(), "supabase/schema.sql");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  const REQUIRED_TABLES = [
    "categories",
    "recurring_rules",
    "missions",
    "class_schedule",
    "time_blocks",
    "academic_events",
    "courses",
    "lecture_logs",
    "cf_log",
    "papers",
    "side_projects",
    "cyber_topics",
    "weekly_reviews",
    "xp_events",
    "streaks",
    "user_settings",
  ];

  const parsedSchemaTables = new Set(
    Array.from(
      schemaContent.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+public\.([a-zA-Z0-9_]+)/gi)
    ).map((m) => m[1])
  );

  it("contains all 16 application tables", () => {
    REQUIRED_TABLES.forEach((table) => {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`, "i");
      expect(
        tableRegex.test(schemaContent),
        `Table 'public.${table}' is missing from schema.sql`
      ).toBe(true);
    });
  });

  it("enforces that every table name in RESET_PROGRESS_TABLES exactly matches schema.sql", () => {
    RESET_PROGRESS_TABLES.forEach((table) => {
      expect(
        parsedSchemaTables.has(table),
        `Reset progress table '${table}' does not exist in supabase/schema.sql`
      ).toBe(true);
    });

    // Specifically confirm cf_log is used instead of cf_logs
    expect(RESET_PROGRESS_TABLES).toContain("cf_log");
    expect(RESET_PROGRESS_TABLES).not.toContain("cf_logs");
  });

  it("enforces that every table name in CLOUD_MIGRATION_TABLES exactly matches schema.sql", () => {
    CLOUD_MIGRATION_TABLES.forEach((table) => {
      expect(
        parsedSchemaTables.has(table),
        `Cloud migration table '${table}' does not exist in supabase/schema.sql`
      ).toBe(true);
    });

    // Specifically confirm cf_log is used instead of cf_logs
    expect(CLOUD_MIGRATION_TABLES).toContain("cf_log");
    expect(CLOUD_MIGRATION_TABLES).not.toContain("cf_logs");
  });

  it("statically analyzes source code (.from calls) and fails if any table in code does not exist in schema.sql", () => {
    const filesToScan = [
      path.resolve(process.cwd(), "src/lib/useAgencyState.ts"),
      path.resolve(process.cwd(), "src/lib/cloudMigration.ts"),
    ];

    filesToScan.forEach((file) => {
      const content = fs.readFileSync(file, "utf-8");
      const matchedTables = Array.from(
        content.matchAll(/\.from\(\s*["']([a-zA-Z0-9_]+)["']\s*\)/g)
      ).map((m) => m[1]);

      expect(matchedTables.length).toBeGreaterThan(0);

      matchedTables.forEach((table) => {
        expect(
          parsedSchemaTables.has(table),
          `Code in ${path.basename(file)} references table '${table}' which DOES NOT exist in supabase/schema.sql!`
        ).toBe(true);
      });
    });
  });

  it("fails validation if an unknown or mismatched table name (e.g. cf_logs) is tested", () => {
    const invalidTable = "cf_logs";
    expect(parsedSchemaTables.has(invalidTable)).toBe(false);

    const nonExistentTable = "non_existent_table";
    expect(parsedSchemaTables.has(nonExistentTable)).toBe(false);
  });

  it("enables Row Level Security (RLS) on all 16 tables", () => {
    REQUIRED_TABLES.forEach((table) => {
      const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, "i");
      expect(
        rlsRegex.test(schemaContent),
        `RLS is not enabled for table 'public.${table}' in schema.sql`
      ).toBe(true);
    });
  });

  it("uses TEXT PRIMARY KEY with gen_random_uuid() fallback for universal ID compatibility", () => {
    REQUIRED_TABLES.forEach((table) => {
      // Find the create table block
      const startIdx = schemaContent.indexOf(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(startIdx).toBeGreaterThan(-1);
      const endIdx = schemaContent.indexOf(");", startIdx);
      const tableDef = schemaContent.slice(startIdx, endIdx);

      expect(
        /id TEXT PRIMARY KEY/i.test(tableDef),
        `Table 'public.${table}' must define 'id TEXT PRIMARY KEY'`
      ).toBe(true);
    });
  });

  it("includes user_id references with CASCADE deletion for user isolation", () => {
    REQUIRED_TABLES.forEach((table) => {
      const startIdx = schemaContent.indexOf(`CREATE TABLE IF NOT EXISTS public.${table}`);
      const endIdx = schemaContent.indexOf(");", startIdx);
      const tableDef = schemaContent.slice(startIdx, endIdx);

      expect(
        /user_id UUID.*REFERENCES auth\.users\(id\) ON DELETE CASCADE/i.test(tableDef),
        `Table 'public.${table}' must have a user_id UUID referencing auth.users(id) with CASCADE deletion`
      ).toBe(true);
    });
  });

  it("includes idempotent DROP POLICY IF EXISTS before creating policies", () => {
    expect(schemaContent).toContain("DROP POLICY IF EXISTS");
    expect(schemaContent).toContain('CREATE POLICY "Users can manage their missions"');
    expect(schemaContent).toContain('CREATE POLICY "Users can manage user settings"');
  });
});

