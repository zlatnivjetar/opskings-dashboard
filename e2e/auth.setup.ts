import { test as setup } from '@playwright/test';
import path from 'path';

export const TEAM_AUTH_FILE = path.join(__dirname, '.auth/team-member.json');
export const CLIENT_AUTH_FILE = path.join(__dirname, '.auth/client.json');

setup('authenticate as team member', async ({ page }) => {
  await page.goto('/sign-in');
  await page.locator('#email').fill('john@company.com');
  await page.locator('#password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: TEAM_AUTH_FILE });
});

setup('authenticate as client', async ({ page }) => {
  await page.goto('/sign-in');
  await page.locator('#email').fill('admin@techstart.com');
  await page.locator('#password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/portal');
  await page.context().storageState({ path: CLIENT_AUTH_FILE });
});
