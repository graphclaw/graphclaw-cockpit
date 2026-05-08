// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import type { Page, BrowserContext } from '@playwright/test';

export const APP_BASE = process.env.BASE_URL ?? 'http://localhost:3000';

export async function waitForApp(page: Page): Promise<void> {
  await page.goto(APP_BASE);
  await page.waitForLoadState('networkidle');
}

export async function injectAuth(
  page: Page,
  token: string,
  userId: string = 'USER-dev-001',
): Promise<void> {
  await page.evaluate(
    ({ access, uid }) => {
      localStorage.setItem('gc-access-token', access);
      localStorage.setItem('gc-refresh-token', access);
      localStorage.setItem(
        'gc-auth',
        JSON.stringify({
          state: {
            accessToken: access,
            refreshToken: access,
            userId: uid,
            role: 'ADMIN',
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
    },
    { access: token, uid: userId },
  );
}

export async function clearStorage(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}

export async function takeScreenshotOnFailure(
  page: Page,
  testInfo: { status?: string; outputPath: (name: string) => string },
): Promise<void> {
  if (testInfo.status !== 'passed') {
    const path = testInfo.outputPath('failure.png');
    await page.screenshot({ path, fullPage: true });
  }
}
