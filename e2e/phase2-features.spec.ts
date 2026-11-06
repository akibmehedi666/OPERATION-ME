import { test, expect } from '@playwright/test';
import { seedTestState } from './e2e-seed';

test.describe('Phase 2 Features E2E Verification', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestState(page, { isAuthenticated: true });
    await page.goto('/');
    await expect(page.getByText('Agent Akib')).toBeVisible();
  });

  test('Dashboard displays Tactical Intelligence & Insights card', async ({ page }) => {
    await expect(page.getByText('TACTICAL INTELLIGENCE & INSIGHTS')).toBeVisible();
    await expect(page.getByText('Academic Log Check')).toBeVisible();
  });

  test('Course HQ tab displays course switcher, countdown, and tabs', async ({ page }) => {
    const coursesTab = page.getByRole('button', { name: /Courses/i });
    await coursesTab.click();

    // Verify course selector buttons
    await expect(page.getByRole('button', { name: /CSE-406/i }).first()).toBeVisible();
    await expect(page.getByText(/Next Class/i).first()).toBeVisible();

    // Verify course sub-tabs
    await expect(page.getByRole('button', { name: /Lecture Log/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Deadlines & Exams/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Resources/i })).toBeVisible();
  });

  test('Codeforces tab renders rating metrics, distribution chart, and problem log', async ({ page }) => {
    const cfTab = page.getByRole('button', { name: /Codeforces/i });
    await cfTab.click();

    await expect(page.getByText('CP Streak')).toBeVisible();
    await expect(page.getByText('Rating Distribution')).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ Log Your First Codeforces Problem|\+ Log Problem/i })).toBeVisible();
  });

  test('Cybersecurity Roadmap tab renders sections and mastery progress', async ({ page }) => {
    const cyberTab = page.getByRole('button', { name: /Cyber/i });
    await cyberTab.click();

    await expect(page.getByText('CYBERSECURITY TACTICAL ROADMAP')).toBeVisible();
    await expect(page.getByRole('button', { name: /Networking Basics/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Web Security & OWASP/i })).toBeVisible();
  });

  test('Research Papers tab renders reading spotlight and synthesis cards', async ({ page }) => {
    const papersTab = page.getByRole('button', { name: /Research/i });
    await papersTab.click();

    await expect(page.getByText('Total Catalog')).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ Catalog Your First Paper|\+ Catalog Paper/i })).toBeVisible();
  });

  test('Side Projects tab renders momentum alerts and next tactical directives', async ({ page }) => {
    const projectsTab = page.getByRole('button', { name: /Projects/i });
    await projectsTab.click();

    await expect(page.getByText('Total R&D')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register First Project' })).toBeVisible();
  });

  test('Review tab renders 7-day velocity chart and Friday retrospective form', async ({ page }) => {
    const reviewTab = page.getByRole('button', { name: /Review/i });
    await reviewTab.click();

    await expect(page.getByText('7-Day Velocity & XP Growth')).toBeVisible();
    await expect(page.getByText('FRIDAY TACTICAL RETROSPECTIVE')).toBeVisible();
    await expect(page.getByRole('button', { name: /Log Weekly Review/i })).toBeVisible();
  });
});