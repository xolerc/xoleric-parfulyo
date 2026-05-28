import { test, expect } from '@playwright/test';

test.describe('XOLERIC App', () => {

  test('home page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/XOLERIC/);
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('#loadingOverlay')).not.toBeVisible();
  });

  test('tab switching works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500); // loading overlay

    await page.click('[data-tab="projects"]');
    await expect(page.locator('#tab-projects')).toBeVisible();
    await expect(page.locator('#tab-projects')).toHaveClass(/active/);

    await page.click('[data-tab="settings"]');
    await expect(page.locator('#tab-settings')).toBeVisible();
    await expect(page.locator('#tab-settings')).toHaveClass(/active/);

    await page.click('[data-tab="home"]');
    await expect(page.locator('#tab-home')).toBeVisible();
    await expect(page.locator('#tab-home')).toHaveClass(/active/);
  });

  test('clock widget shows time', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);
    const clock = page.locator('#clockTime');
    await expect(clock).toBeVisible();
    const time = await clock.textContent();
    expect(time).toMatch(/^\d{2}:\d{2}$/);
  });

  test('theme switching works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    await page.click('[data-tab="settings"]');
    await page.waitForTimeout(500);

    await page.click('[data-theme="cyber"]');
    const themeBtn = page.locator('[data-theme="cyber"]');
    await expect(themeBtn).toHaveClass(/active/);

    const stored = await page.evaluate(() => localStorage.getItem('xolerc_theme'));
    expect(stored).toBe('cyber');

    // Reset to dark
    await page.click('[data-theme="dark"]');
  });

  test('language switching works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    await page.click('[data-tab="settings"]');
    await page.waitForTimeout(500);

    await page.selectOption('#langSelect', 'en');
    await page.waitForTimeout(300);

    const navText = await page.locator('[data-tab="chat"]').textContent();
    expect(navText?.trim()).toBe('Chat');

    await page.selectOption('#langSelect', 'uz');
    await page.waitForTimeout(300);

    const navUz = await page.locator('[data-tab="chat"]').textContent();
    expect(navUz?.trim()).toContain('Chat');
  });

  test('playme tab loads video player', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    await page.click('[data-tab="playme"]');
    await expect(page.locator('#playmeVideo')).toBeVisible();
    await expect(page.locator('#playmeList')).toBeVisible();
  });

  test('bottom navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    await page.click('.bn-btn[data-tab="chat"]');
    await expect(page.locator('#tab-chat')).toHaveClass(/active/);
    await expect(page.locator('.bn-btn[data-tab="chat"]')).toHaveClass(/active/);

    await page.click('.bn-btn[data-tab="home"]');
    await expect(page.locator('#tab-home')).toHaveClass(/active/);
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    const hasSw = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.some(r => r.active?.scriptURL?.includes('sw.js'));
    });
    expect(hasSw).toBe(true);
  });

  test('chat module loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    await page.click('[data-tab="chat"]');
    await expect(page.locator('#chatListView')).toBeVisible();
    await expect(page.locator('#sidebarUser')).toBeVisible();
  });

  test('projects search input works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    await page.click('[data-tab="projects"]');
    await page.waitForTimeout(2000); // wait for API

    const searchInput = page.locator('#projectsSearch');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('python');
    const query = await searchInput.inputValue();
    expect(query).toBe('python');
  });
});
