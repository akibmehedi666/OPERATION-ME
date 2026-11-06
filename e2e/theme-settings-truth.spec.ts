import { test, expect } from '@playwright/test';
import { seedTestState } from './e2e-seed';

test.describe('Theme & Settings Single Source of Truth Verification', () => {
  test('User selects Light, Dark, System in Settings with zero flicker, stable background and no clipping', async ({ page }) => {
    // Navigate to local dev app with authenticated session
    await seedTestState(page, { isAuthenticated: true });
    await page.goto('/');

    await expect(page.getByText('Agent Akib')).toBeVisible();

    // 1. Open Settings modal
    const settingsBtn = page.getByTitle('Settings');
    await settingsBtn.click();

    // Verify modal is rendered in portal and fully visible inside viewport (not clipped at top!)
    const modal = page.locator('[role="dialog"][aria-label="Settings"]');
    await expect(modal).toBeVisible();

    const box = await modal.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Must be safely within viewport
      expect(box.y).toBeGreaterThanOrEqual(10);
      const viewport = page.viewportSize();
      if (viewport) {
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 5);
      }
    }

    // Set up mutation listener for <html> class
    await page.evaluate(() => {
      (window as any).__themeClassMutations = [];
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.attributeName === 'class') {
            (window as any).__themeClassMutations.push({
              value: (m.target as HTMLElement).className,
              time: Math.round(performance.now()),
            });
          }
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    });

    // 2. Click "Light" default theme
    await page.evaluate(() => { (window as any).__themeClassMutations = []; });
    const lightBtn = modal.getByRole('button', { name: /^light$/i });
    await lightBtn.click();

    // Wait 5 seconds as requested by operative
    await page.waitForTimeout(5000);

    // Assert <html> has light theme and NOT dark
    const htmlClassLight = await page.evaluate(() => document.documentElement.className);
    expect(htmlClassLight).toContain('light');
    expect(htmlClassLight).not.toContain('dark');

    // Assert background is light dossier paper (#f4f1ea -> rgb(244, 241, 234))
    const bodyBgLight = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bodyBgLight).toBe('rgb(244, 241, 234)');

    // Assert theme class changed at most once during the transition (no flip-flop)
    const lightMutations = await page.evaluate(() => (window as any).__themeClassMutations.length);
    expect(lightMutations).toBeLessThanOrEqual(1);

    // 3. Click "Dark" default theme
    await page.evaluate(() => { (window as any).__themeClassMutations = []; });
    const darkBtn = modal.getByRole('button', { name: /^dark$/i });
    await darkBtn.click();

    // Wait 5 seconds
    await page.waitForTimeout(5000);

    // Assert <html> has dark theme and NOT light
    const htmlClassDark = await page.evaluate(() => document.documentElement.className);
    expect(htmlClassDark).toContain('dark');
    expect(htmlClassDark).not.toContain('light');

    // Assert background is tactical dark (#0b0f0d -> rgb(11, 15, 13))
    const bodyBgDark = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bodyBgDark).toBe('rgb(11, 15, 13)');

    // Assert theme class changed at most once
    const darkMutations = await page.evaluate(() => (window as any).__themeClassMutations.length);
    expect(darkMutations).toBeLessThanOrEqual(1);

    // 4. Click "System" default theme
    await page.evaluate(() => { (window as any).__themeClassMutations = []; });
    const systemBtn = modal.getByRole('button', { name: /^system$/i });
    await systemBtn.click();

    // Wait 5 seconds
    await page.waitForTimeout(5000);

    const systemMutations = await page.evaluate(() => (window as any).__themeClassMutations.length);
    expect(systemMutations).toBeLessThanOrEqual(1);

    // 5. Verify Close via Escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // 6. Verify Reopen and Close via outside click
    await settingsBtn.click();
    await expect(modal).toBeVisible();

    // Click outside on backdrop
    await page.locator('.bg-black\\/60').click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible();
  });
});

