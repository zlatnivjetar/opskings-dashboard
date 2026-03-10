import { test, expect } from '@playwright/test';
import path from 'path';

const TEAM_AUTH_FILE = path.join(__dirname, '.auth/team-member.json');
const CLIENT_AUTH_FILE = path.join(__dirname, '.auth/client.json');

const THEMES = ['light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

/** Force a theme by updating the class on <html> and next-themes' localStorage key. */
async function applyTheme(page: import('@playwright/test').Page, theme: Theme) {
  await page.evaluate((t: string) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
    (document.documentElement as HTMLElement).style.colorScheme = t;
    localStorage.setItem('theme', t);
  }, theme);
  // Allow repaint + any CSS transitions to settle
  await page.waitForTimeout(350);
}

// ---------------------------------------------------------------------------
// Public pages — no authentication required
// ---------------------------------------------------------------------------
const publicRoutes: Array<{ path: string; name: string }> = [
  { path: '/sign-in', name: 'sign-in' },
  { path: '/sign-up', name: 'sign-up' },
];

test.describe('public', () => {
  for (const route of publicRoutes) {
    for (const theme of THEMES) {
      test(`${route.name} — ${theme}`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('domcontentloaded');
        await applyTheme(page, theme);
        await expect(page).toHaveScreenshot(`${route.name}-${theme}.png`, {
          fullPage: true,
        });
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Dashboard pages — team member authentication
// ---------------------------------------------------------------------------
const dashboardRoutes: Array<{ path: string; name: string }> = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/team', name: 'team' },
  { path: '/clients', name: 'clients' },
  { path: '/response-time', name: 'response-time' },
];

test.describe('dashboard', () => {
  test.use({ storageState: TEAM_AUTH_FILE });

  for (const route of dashboardRoutes) {
    for (const theme of THEMES) {
      test(`${route.name} — ${theme}`, async ({ page }) => {
        await page.goto(route.path);
        // Wait for data fetches to complete before screenshotting
        await page.waitForLoadState('networkidle');
        await applyTheme(page, theme);
        await expect(page).toHaveScreenshot(`${route.name}-${theme}.png`, {
          fullPage: true,
          // Allow minor pixel differences from chart anti-aliasing
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Portal pages — client authentication
// ---------------------------------------------------------------------------
const portalRoutes: Array<{ path: string; name: string }> = [
  { path: '/portal', name: 'portal' },
  { path: '/portal/new', name: 'portal-new' },
];

test.describe('portal', () => {
  test.use({ storageState: CLIENT_AUTH_FILE });

  for (const route of portalRoutes) {
    for (const theme of THEMES) {
      test(`${route.name} — ${theme}`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        await applyTheme(page, theme);
        await expect(page).toHaveScreenshot(`${route.name}-${theme}.png`, {
          fullPage: true,
        });
      });
    }
  }
});
