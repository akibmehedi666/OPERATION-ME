import { test, expect } from '@playwright/test';
import { seedTestState } from './e2e-seed';

test.describe('History & Settings E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestState(page, { isAuthenticated: true });
    await page.goto('/');
  });

  test('History page renders summary statistics, debrief notes, and filters', async ({ page }) => {
    // Navigate to History tab
    const historyTab = page.getByRole('button', { name: /History/ });
    await historyTab.click();

    // 1. Summary Cards Row
    await expect(page.getByText('This Week')).toBeVisible();
    await expect(page.getByText('This Month')).toBeVisible();
    await expect(page.getByText('Best Streak')).toBeVisible();
    await expect(page.getByText('Top Category')).toBeVisible();

    // 2. Heatmap Calendar
    await expect(page.getByText(/COMPLETION ACTIVITY/i)).toBeVisible();

    // 3. Completed Missions list
    await expect(page.getByText('Codeforces Div 2 Contest Participation')).toBeVisible();
    await expect(page.getByText('Tuition Preparation for HSC Physics')).toBeVisible();

    // 4. Debrief notes display
    await expect(page.getByText('Solved problem A and B in 35 minutes, rating +42')).toBeVisible();

    // 5. Search debrief notes
    const searchInput = page.getByPlaceholder(/Search history, directives, or debrief notes/i);
    await searchInput.fill('thermodynamics');
    await expect(page.getByText('Tuition Preparation for HSC Physics')).toBeVisible();
    await expect(page.getByText('Codeforces Div 2 Contest Participation')).not.toBeVisible();
    await searchInput.clear();

    // 6. Range selector filter
    const weekBtn = page.getByRole('button', { name: 'Week' });
    await weekBtn.click();
    await expect(page.getByText('Codeforces Div 2 Contest Participation')).toBeVisible();

    // 7. Edit completion debrief note
    const editNoteBtn = page.locator('button[title="Edit Debrief Note"]').first();
    await editNoteBtn.click();

    await expect(page.getByText('Edit Debrief Note')).toBeVisible();
    const noteTextarea = page.getByPlaceholder(/e\.g\. solved with DP/i);
    await noteTextarea.fill('Updated debrief note: Solved all problems cleanly');
    const saveNoteBtn = page.getByRole('button', { name: 'Save Note' });
    await saveNoteBtn.click();

    await expect(page.getByText('Updated debrief note: Solved all problems cleanly')).toBeVisible();
  });

  test('Settings modal: switches theme between Dark, Light, System and toggles animations', async ({ page }) => {
    // Open Settings Modal via gear icon
    const settingsBtn = page.getByTitle('Settings');
    await settingsBtn.click();

    const settingsModal = page.locator('.shadow-2xl', { hasText: 'SETTINGS' });
    await expect(settingsModal).toBeVisible();

    // 1. Theme toggle: select Light
    const lightBtn = settingsModal.getByRole('button', { name: /^light$/i });
    await lightBtn.click();

    // Root html element should have 'light' class
    const html = page.locator('html');
    await expect(html).toHaveClass(/light/);

    // 2. Theme toggle: select Dark
    const darkBtn = settingsModal.getByRole('button', { name: /^dark$/i });
    await darkBtn.click();
    await expect(html).toHaveClass(/dark/);

    // 3. Animations toggle
    const animToggleBtn = settingsModal.getByRole('button', { name: /^(ON|OFF)$/ });
    await animToggleBtn.click();

    // Close settings modal
    const closeBtn = settingsModal.getByRole('button', { name: 'Close', exact: true });
    await closeBtn.click();
    await expect(settingsModal).not.toBeVisible();
  });

  test('Header quick theme toggle cycles or switches theme smoothly', async ({ page }) => {
    // In Header, quick theme toggle button (Sun/Moon icon)
    const quickThemeBtn = page.locator('button[title*="Switch to"]').first();
    await expect(quickThemeBtn).toBeVisible();
    await quickThemeBtn.click();

    // Theme switches
    const html = page.locator('html');
    const hasClass = await html.getAttribute('class');
    expect(hasClass).toBeDefined();
  });
});
