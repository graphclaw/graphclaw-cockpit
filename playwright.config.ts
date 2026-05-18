import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  // Sequential execution: live backend rate-limits per user (300 req/min);
  // parallel workers exhaust the budget across overlapping test sessions.
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Bypass HTTP cache so the browser always fetches fresh JS from Vite dev server
    bypassCSP: true,
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-cache', '--disable-application-cache'],
        },
      },
      // Exclude the real OAuth test from the default run
      testIgnore: ['**/google-oauth-onboarding.spec.ts'],
    },
    {
      // Headed project for real Google OAuth onboarding.
      // Run with: npx playwright test --project=onboarding-live
      name: 'onboarding-live',
      testMatch: '**/google-oauth-onboarding.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,        // Browser visible so the user can approve OAuth
        storageState: undefined, // No pre-auth state — start from the login page
        launchOptions: {
          args: ['--disable-cache', '--disable-application-cache'],
        },
      },
    },
  ],
});
