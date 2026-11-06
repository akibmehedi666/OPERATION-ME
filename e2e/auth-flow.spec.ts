import { test, expect } from '@playwright/test';
import { seedTestState } from './e2e-seed';

test.describe('Auth E2E Flow - Hardened Login & Cloud Isolation', () => {
  test('unauthenticated visitor is shown Login Authorization portal with normal placeholder', async ({ page }) => {
    await seedTestState(page, { isAuthenticated: false });
    await page.goto('/');

    await expect(page.getByText('Agent Authorization')).toBeVisible();
    await expect(page.getByText('OPERATION: ME')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Authenticate' })).toBeVisible();

    // STRICT CLOUD MODE CHECKS: No direct-access button and no sign-up link
    await expect(page.getByRole('button', { name: /Direct Access/i })).not.toBeVisible();
    await expect(page.getByText(/Need an account\? Sign up/i)).not.toBeVisible();
    await expect(page.getByText(/Sign up/i)).not.toBeVisible();

    // Verify Cloud Mode badge
    await expect(page.getByText(/Cloud Mode/i)).toBeVisible();
  });

  test('unauthenticated visit cannot access dashboard tabs or agent information', async ({ page }) => {
    await seedTestState(page, { isAuthenticated: false });
    await page.goto('/');

    await expect(page.getByText('Agent Authorization')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dashboard' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Missions' })).not.toBeVisible();
    await expect(page.getByText(/TODAY'S PLAN/i)).not.toBeVisible();
    await expect(page.getByText('Rank: Special Agent')).not.toBeVisible();
  });

  test('submitting wrong credentials displays themed error banner', async ({ page }) => {
    await seedTestState(page, { isAuthenticated: false });
    await page.goto('/');

    const emailInput = page.getByPlaceholder('you@example.com');
    const passwordInput = page.getByPlaceholder('••••••••••••');

    await emailInput.fill('intruder@hostile.org');
    await passwordInput.fill('wrong-password-999');

    await page.getByRole('button', { name: 'Authenticate' }).click();

    // Displays themed error message (excluding Next.js internal route announcer)
    const errorBanner = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Invalid');
  });

  test('forgot password link displays feedback notice when email submitted', async ({ page }) => {
    await seedTestState(page, { isAuthenticated: false });
    await page.goto('/');

    const forgotBtn = page.getByRole('button', { name: /Forgot password\?/i });

    // 1. Click without email -> prompt to enter email
    await forgotBtn.click();
    const alertBanner = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText('Please enter your email');

    // 2. Fill email -> recovery email dispatched notice
    const emailInput = page.getByPlaceholder('you@example.com');
    await emailInput.fill('agent.akib@agency.internal');
    await forgotBtn.click();

    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByText(/Password reset link sent to your email/i)).toBeVisible();
  });

  test('submitting valid credentials authenticates operative into dashboard', async ({ page }) => {
    await seedTestState(page, { isAuthenticated: false });
    await page.goto('/');

    const emailInput = page.getByPlaceholder('you@example.com');
    const passwordInput = page.getByPlaceholder('••••••••••••');

    await emailInput.fill('agent.akib@agency.internal');
    await passwordInput.fill('valid-pass-2026');

    await page.getByRole('button', { name: 'Authenticate' }).click();

    // Verify successful login transition to command dashboard
    await expect(page.getByText('Agent Akib')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  });

  test('logout returns operative to Login screen and clears session', async ({ page }) => {
    await seedTestState(page, { isAuthenticated: true });
    await page.goto('/');

    await expect(page.getByText('Agent Akib')).toBeVisible({ timeout: 10000 });

    const logoutBtn = page.getByTitle('Logout');
    await logoutBtn.click();

    // Should return to login page
    await expect(page.getByText('Agent Authorization')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dashboard' })).not.toBeVisible();
  });
});
