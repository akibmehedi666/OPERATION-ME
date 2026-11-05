import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedTestState } from './e2e-seed';
import fs from 'fs';
import path from 'path';

test.describe('Themes, Accessibility (A11y), and Responsive Verification', () => {
  test.beforeAll(async () => {
    const screenshotDir = path.resolve(process.cwd(), 'test-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Login Page: Accessibility & Theme Screenshots', async ({ page }) => {
    // 1. Dark Theme Login
    await seedTestState(page, { isAuthenticated: false, theme: 'dark' });
    await page.goto('/');
    await expect(page.getByText('Agent Authorization')).toBeVisible();

    const a11yDark = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(a11yDark.violations).toEqual([]);

    await page.screenshot({ path: 'test-screenshots/login-dark.png', fullPage: true });

    // 2. Light Theme Login
    await seedTestState(page, { isAuthenticated: false, theme: 'light' });
    await page.goto('/');
    await page.screenshot({ path: 'test-screenshots/login-light.png', fullPage: true });
  });

  test('Dashboard Page: Dark & Light Themes, Responsive 375px & 1280px, Screenshots', async ({ page }) => {
    // Desktop Dark
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedTestState(page, { isAuthenticated: true, theme: 'dark' });
    await page.goto('/');
    await expect(page.getByText('Agent Akib')).toBeVisible();

    // Verify accessibility on Dashboard
    const a11yDashboard = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(a11yDashboard.violations).toEqual([]);

    await page.screenshot({ path: 'test-screenshots/dashboard-dark.png', fullPage: true });

    // Desktop Light
    await seedTestState(page, { isAuthenticated: true, theme: 'light' });
    await page.goto('/');
    await expect(page.getByText('Agent Akib')).toBeVisible();
    await page.screenshot({ path: 'test-screenshots/dashboard-light.png', fullPage: true });

    // Mobile Viewport (375px) - Verify No Horizontal Scroll
    await page.setViewportSize({ width: 375, height: 750 });
    await page.goto('/');
    await expect(page.getByText('Agent Akib')).toBeVisible();

    const noHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(noHorizontalScroll).toBe(true);

    await page.screenshot({ path: 'test-screenshots/dashboard-mobile-375px.png', fullPage: true });
  });

  test('Missions Page: Dark & Light Screenshots & Accessibility', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Dark
    await seedTestState(page, { isAuthenticated: true, theme: 'dark' });
    await page.goto('/');
    await page.getByRole('button', { name: /Missions/ }).click();
    await expect(page.getByRole('button', { name: /^Overdue \(\d+\)/i })).toBeVisible();

    const a11yMissions = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(a11yMissions.violations).toEqual([]);

    await page.screenshot({ path: 'test-screenshots/missions-dark.png', fullPage: true });

    // Light
    await seedTestState(page, { isAuthenticated: true, theme: 'light' });
    await page.goto('/');
    await page.getByRole('button', { name: /Missions/ }).click();
    await expect(page.getByRole('button', { name: /^Overdue \(\d+\)/i })).toBeVisible();
    await page.screenshot({ path: 'test-screenshots/missions-light.png', fullPage: true });
  });

  test('History Page: Dark & Light Screenshots & Heatmap Interaction', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Dark
    await seedTestState(page, { isAuthenticated: true, theme: 'dark' });
    await page.goto('/');
    await page.getByRole('button', { name: /History/ }).click();
    await expect(page.getByText(/COMPLETION ACTIVITY/i)).toBeVisible();

    const a11yHistory = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(a11yHistory.violations).toEqual([]);

    await page.screenshot({ path: 'test-screenshots/history-dark.png', fullPage: true });

    // Light
    await seedTestState(page, { isAuthenticated: true, theme: 'light' });
    await page.goto('/');
    await page.getByRole('button', { name: /History/ }).click();
    await expect(page.getByText(/COMPLETION ACTIVITY/i)).toBeVisible();
    await page.screenshot({ path: 'test-screenshots/history-light.png', fullPage: true });
  });
});
