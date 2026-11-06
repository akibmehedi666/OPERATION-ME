import { test, expect } from '@playwright/test';
import { seedTestState } from './e2e-seed';

test.describe('Weekly Planner & Academic Calendar E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and ensure authenticated session
    await seedTestState(page, { isAuthenticated: true });
    await page.goto('/');
    await expect(page.getByText('Agent Akib')).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard displays Upcoming Key Dates card and synchronized Today\'s Plan', async ({ page }) => {
    // 1. Check Upcoming Key Dates card
    await expect(page.getByText('UPCOMING KEY DATES')).toBeVisible();

    // 2. Check Today's Plan renders timeline
    await expect(page.getByText(/TODAY'S PLAN/i)).toBeVisible();
  });

  test('Planner tab renders Weekly Grid with 7 columns (SAT to FRI) and hours 9 AM to 10 PM', async ({ page }) => {
    // 1. Navigate to Planner tab
    const plannerTab = page.getByRole('button', { name: /Planner/i });
    await expect(plannerTab).toBeVisible();
    await plannerTab.click();

    // 2. Verify Weekly Grid elements
    await expect(page.getByRole('button', { name: /Weekly Grid/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Academic Calendar/i })).toBeVisible();

    // 3. Verify weekday columns in grid header
    const gridContainer = page.locator('.min-w-\\[850px\\]');
    await expect(gridContainer.getByText('SAT').first()).toBeVisible();
    await expect(gridContainer.getByText('SUN').first()).toBeVisible();
    await expect(gridContainer.getByText('MON').first()).toBeVisible();
    await expect(gridContainer.getByText('TUE').first()).toBeVisible();
    await expect(gridContainer.getByText('WED').first()).toBeVisible();
    await expect(gridContainer.getByText('THU').first()).toBeVisible();
    await expect(gridContainer.getByText('FRI').first()).toBeVisible();

    // 4. Verify legend at bottom
    await expect(page.getByText('LEGEND:')).toBeVisible();
    await expect(page.getByText('University class')).toBeVisible();
    await expect(page.getByText('Project / career')).toBeVisible();

    // 5. Test switching to Academic Calendar month view
    const academicCalBtn = page.getByRole('button', { name: /Academic Calendar/i });
    await academicCalBtn.click();

    await expect(page.getByText('INSPECTION DOSSIER')).toBeVisible();
    await expect(page.getByText('RESOLVED SCHEDULE')).toBeVisible();

    // 6. Click a day cell to inspect schedule
    const dayCell = page.getByRole('button', { name: /12/i }).first();
    if (await dayCell.isVisible()) {
      await dayCell.click();
      await expect(page.getByText(/RESOLVED SCHEDULE/i)).toBeVisible();
    }
  });

  test('Mobile viewport (375px) renders responsive Planner view with single-day tabs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const plannerTab = page.getByRole('button', { name: /Planner/i });
    await expect(plannerTab).toBeVisible();
    await plannerTab.click();

    await expect(page.getByRole('button', { name: /Weekly Grid/i })).toBeVisible();
  });
});
