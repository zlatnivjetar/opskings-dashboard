import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'baselines',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['auth-setup'],
    },
  ],
});
