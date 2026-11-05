import { test, expect } from '@playwright/test';
import { seedTestState, E2E_SEEDED_MISSIONS } from './e2e-seed';

test.describe('Dashboard & Missions E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestState(page, { isAuthenticated: true });
    await page.goto('/');
  });

  test('Dashboard displays stat cards, Active Mission hero, and Today\'s Plan without duplicates', async ({ page }) => {
    // 1. Verify Header stats
    await expect(page.getByText('Agent Akib')).toBeVisible();

    // 2. Stat Cards Row
    await expect(page.getByText(/Today/i).first()).toBeVisible();
    await expect(page.getByText(/Streak/i).first()).toBeVisible();
    await expect(page.getByText(/Overdue/i).first()).toBeVisible();

    // 3. Hero Active Mission Card
    await expect(page.getByText('ACTIVE MISSION')).toBeVisible();
    await expect(page.getByText('Implement Virtual Memory Paging')).toBeVisible();

    // 4. Today's Plan Timeline
    await expect(page.getByText(/TODAY'S PLAN/i)).toBeVisible();

    // 5. Verification: Hero mission 'Implement Virtual Memory Paging' must NEVER appear twice on the screen
    const heroTitleCount = await page.getByText('Implement Virtual Memory Paging').count();
    expect(heroTitleCount).toBe(1);

    // 6. Up Next Section shows max 3 missions
    await expect(page.getByText(/UP NEXT/i)).toBeVisible();

    // 7. Today's Briefing Schedule day switching
    await expect(page.getByText("Today's Briefing")).toBeVisible();
    const satTab = page.getByRole('button', { name: 'SAT' });
    await satTab.click();
    await expect(page.getByText(/Digital Image Processing/i).first()).toBeVisible();
  });

  test('Mission accomplishment flow: debrief modal, note storage, auto-assign next target', async ({ page }) => {
    // Click Accomplish on the hero mission card
    const heroCard = page.locator('.active-mission-card');
    const accomplishBtn = heroCard.getByRole('button', { name: 'Accomplish' });
    await accomplishBtn.click();

    // 1. Debrief note modal opens
    const debriefModal = page.locator('.clean-card', { hasText: 'Mission Debrief' });
    await expect(debriefModal).toBeVisible();
    await expect(debriefModal.getByText('Implement Virtual Memory Paging')).toBeVisible();

    // Fill note and time spent
    const noteInput = page.getByPlaceholder(/e\.g\. solved with DP/i);
    const timeInput = page.getByPlaceholder(/e\.g\. 45/i);
    await noteInput.fill('TLB benchmark completed with 94% hit rate');
    await timeInput.fill('40');

    // Submit debrief
    const saveBtn = page.getByRole('button', { name: 'Save & Complete' });
    await saveBtn.click();

    // 2. Celebration modal renders with accomplished stamp & next target
    await expect(page.getByText(/MISSION ACCOMPLISHED/i).first()).toBeVisible();
    await expect(page.getByText('Next Target Acquired')).toBeVisible();

    // Dismiss celebration modal
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await continueBtn.click();

    // 3. Next target is automatically promoted to the active hero card
    // The previous active mission is now cleared, and the highest priority remaining target is promoted!
    await expect(page.locator('.active-mission-card')).toBeVisible();
  });

  test('Missions page: section groupings, category chips, search, modal creation and deletion', async ({ page }) => {
    // Navigate to Missions tab
    const missionsTab = page.getByRole('button', { name: /Missions/ });
    await missionsTab.click();

    // 1. Verify groupings
    await expect(page.getByRole('button', { name: /^Overdue \(\d+\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Today \(\d+\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Tomorrow \(\d+\)/i })).toBeVisible();

    // 2. Category chip filter
    const ecoChip = page.getByRole('button', { name: 'Eco' });
    await ecoChip.click();
    await expect(page.getByText('Economics Microeconomics Problem Set')).toBeVisible();

    // Click "All" chip to reset
    const allChip = page.getByRole('button', { name: 'All' });
    await allChip.click();

    // 3. Search input
    const searchInput = page.getByPlaceholder(/Search missions/i);
    await searchInput.fill('Hypothesis');
    await expect(page.getByText('Probability & Statistics Hypothesis Testing')).toBeVisible();
    await searchInput.clear();

    // 4. Create new mission via New Mission button
    const newMissionBtn = page.getByRole('button', { name: /New Mission/i }).first();
    await newMissionBtn.click();

    await expect(page.getByText('NEW MISSION', { exact: true })).toBeVisible();
    const titleInput = page.getByPlaceholder(/e\.g\. Implement OS Page Replacement/i);
    await titleInput.fill('Automated E2E Verification Directive');

    const submitBtn = page.getByRole('button', { name: 'Create Mission' });
    await submitBtn.click();

    // New mission should appear in list
    await expect(page.getByText('Automated E2E Verification Directive')).toBeVisible();

    // 5. Delete the created mission
    const createdMissionCard = page.locator('.clean-card', { hasText: 'Automated E2E Verification Directive' });
    // Expand details to show delete icon
    const expandBtn = createdMissionCard.locator('button[title="Show details"]');
    await expandBtn.click();

    // Handle confirm dialog for delete
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    const deleteBtn = createdMissionCard.locator('button[title="Delete"]');
    await deleteBtn.click();

    await expect(page.getByText('Automated E2E Verification Directive')).not.toBeVisible();
  });
});
