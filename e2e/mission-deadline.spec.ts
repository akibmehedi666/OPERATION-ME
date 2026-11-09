import { test, expect } from '@playwright/test';
import { seedTestState } from './e2e-seed';
import path from 'path';
import { Mission } from '../src/types/database';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/8b8d4fbb-7844-414d-8e3c-92d221ddad1a';

test.describe('Mission Deadline & Overdue Simplification Flow', () => {
  const now = Date.now();
  const pastStartTime = new Date(now - 4 * 3600 * 1000).toISOString();
  const pastEndTime = new Date(now - 3 * 3600 * 1000).toISOString();

  // Test missions:
  // 1 overdue with scheduled_end in past and NO deadline (proves overdue logic uses end time if none)
  const testMissions: Mission[] = [
    {
      id: 'm-overdue-end-only',
      title: 'Analyze Network Traffic Dumps',
      codename: 'OP-NET-DUMP',
      category_id: 'cat-8',
      priority: 'urgent',
      status: 'active',
      scheduled_start: pastStartTime,
      scheduled_end: pastEndTime,
      deadline: null, // NO separate deadline!
      notes: 'Investigate abnormal outgoing traffic spikes',
      xp: 75,
      created_at: new Date(now - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'm-active-hero',
      title: 'Implement Virtual Memory Paging',
      codename: 'OP-VM-PAGE',
      category_id: 'cat-1',
      priority: 'high',
      status: 'active',
      scheduled_start: new Date(now + 2 * 3600 * 1000).toISOString(),
      scheduled_end: new Date(now + 3 * 3600 * 1000).toISOString(),
      deadline: new Date(now + 3 * 3600 * 1000).toISOString(),
      notes: 'Page replacement algorithms',
      xp: 80,
      created_at: new Date(now - 12 * 3600 * 1000).toISOString(),
    },
  ];

  test.beforeEach(async ({ page }) => {
    await seedTestState(page, {
      isAuthenticated: true,
      missions: testMissions,
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Requirement 5: Overdue logic uses scheduled end time when no deadline is set', async ({ page }) => {
    // 1. Check Overdue stat card on Dashboard reflects the past scheduled_end mission
    await expect(page.getByText(/Overdue/i).first()).toBeVisible();

    // 2. Switch to Missions tab and verify it appears in the OVERDUE bucket
    const missionsTab = page.getByRole('button', { name: /Missions/i }).first();
    await missionsTab.click();
    await expect(page.locator('span.rubber-stamp-red').first()).toBeVisible();
    await expect(page.getByText('Analyze Network Traffic Dumps')).toBeVisible();

    // Screenshot 7: Overdue logic working with scheduled end time
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'deadline-07-overdue-logic.png') });
  });

  test('Requirements 1, 2, 3: Modal default hidden deadline, auto-sync, separate due date, inline warning', async ({ page }) => {
    // Open New Mission Modal
    const newMissionBtn = page.locator('button[aria-label="New Mission"], button:has-text("New Mission")').first();
    await newMissionBtn.click();
    await expect(page.getByText('NEW MISSION', { exact: true })).toBeVisible();

    // Req 1: Mission Deadline fields hidden by default, "+ Add a separate due date" link visible
    const addSeparateLink = page.getByRole('button', { name: /\+ Add a separate due date/i });
    await expect(addSeparateLink).toBeVisible();
    await expect(page.locator('text=Mission Deadline (Separate Due Date)')).not.toBeVisible();

    // Screenshot 1: New Mission default modal
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'deadline-01-new-mission-default.png') });

    // Req 2: When end time changes, deadline follows automatically
    await page.getByRole('button', { name: '2h' }).click();
    await expect(page.locator('text=/Deadline auto-synced with end:/i')).toBeVisible();

    // Req 1: Click "+ Add a separate due date" reveals separate due date fields
    await addSeparateLink.click();
    await expect(page.locator('text=Mission Deadline (Separate Due Date)')).toBeVisible();

    // Screenshot 2: Separate due date fields revealed
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'deadline-02-separate-due-date-revealed.png') });

    // Req 3: Set separate due date to earlier than scheduled end -> inline warning & blocked saving
    const dateInputs = await page.locator('input[type="date"]').all();
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    // Fill the second date input (separate deadline) with a past date
    await dateInputs[1].fill('2026-11-01');

    await expect(page.getByText(/Due date cannot be earlier than scheduled end/i)).toBeVisible();
    const createBtn = page.getByRole('button', { name: /Create Mission/i });
    await expect(createBtn).toBeDisabled();

    // Screenshot 3: Inline warning and disabled Save button
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'deadline-03-inline-warning-blocked-saving.png') });

    // Req 2: Check "No specific time (deadline only)"
    const noSpecificCheckbox = page.getByLabel(/No specific time \(deadline only\)/i);
    await noSpecificCheckbox.check();

    // Deadline fields are shown and required
    await expect(page.getByText(/Mission Deadline \*/i)).toBeVisible();
    await expect(page.locator('text=+ Add a separate due date')).not.toBeVisible();

    // Screenshot 4: Deadline only mode shown & required
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'deadline-04-no-specific-time-required.png') });
  });

  test('Requirement 4: Existing mission with matching vs differing deadline', async ({ page }) => {
    // 1. Create a mission with auto-synced deadline
    const newMissionBtn = page.locator('button[aria-label="New Mission"], button:has-text("New Mission")').first();
    await newMissionBtn.click();
    await expect(page.getByText('NEW MISSION', { exact: true })).toBeVisible();

    await page.getByPlaceholder(/e\.g\. Implement OS Page Replacement/i).fill('Compiler Lexer Generator');
    // Save without adding separate due date
    await page.getByRole('button', { name: /Create Mission/i }).click();
    await page.waitForTimeout(500);

    // 2. Switch to Missions tab and edit "Compiler Lexer Generator"
    const missionsTab = page.getByRole('button', { name: /Missions/i }).first();
    await missionsTab.click();
    await expect(page.getByText('Compiler Lexer Generator')).toBeVisible();

    // Click expand and edit on Compiler Lexer Generator
    const missionCard = page.locator('.group').filter({ hasText: 'Compiler Lexer Generator' }).first();
    await missionCard.getByTitle(/Show details/i).click();
    await missionCard.getByTitle('Edit').click();
    await expect(page.getByText('EDIT MISSION', { exact: true })).toBeVisible();

    // Req 4: Deadline matches scheduled end -> separate due date fields remain HIDDEN by default
    await expect(page.getByRole('button', { name: /\+ Add a separate due date/i })).toBeVisible();
    await expect(page.locator('text=Mission Deadline (Separate Due Date)')).not.toBeVisible();

    // Screenshot 5: Edit mission with matching deadline
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'deadline-05-edit-matching-deadline.png') });

    // 3. Now add a separate due date that differs from scheduled end
    await page.getByRole('button', { name: /\+ Add a separate due date/i }).click();
    const dateInputs = await page.locator('input[type="date"]').all();
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    // Set separate due date 10 days in future
    await dateInputs[1].fill('2026-11-20');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await page.waitForTimeout(500);

    // 4. Re-open edit on the same mission -> separate due date MUST BE KEPT VISIBLE!
    await page.locator('text=Compiler Lexer Generator').scrollIntoViewIfNeeded();
    const reloadedCard = page.locator('.group').filter({ hasText: 'Compiler Lexer Generator' }).first();
    await reloadedCard.getByTitle(/Show details/i).click();
    await reloadedCard.getByTitle('Edit').click();
    await expect(page.getByText('EDIT MISSION', { exact: true })).toBeVisible();
    await expect(page.locator('text=Mission Deadline (Separate Due Date)')).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ Add a separate due date/i })).not.toBeVisible();

    // Screenshot 6: Edit mission with differing deadline kept visible
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'deadline-06-edit-different-deadline-visible.png') });
  });
});

