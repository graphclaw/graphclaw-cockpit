// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test } from './fixtures/auth.fixture';

test('debug: waitForResponse with real 500 from proxy', async ({ page }) => {
  let captured = false;
  
  page.on('response', (res) => {
    if (res.url().includes('/app/v1/')) {
      console.log('Response event:', res.status(), res.url());
      captured = true;
    }
  });
  
  page.on('requestfailed', (req) => {
    if (req.url().includes('/app/v1/')) {
      console.log('Request FAILED (no response):', req.url(), req.failure()?.errorText);
    }
  });
  
  try {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/settings/channels', { timeout: 10000 }),
      page.goto('/settings/channels'),
    ]);
    console.log('waitForResponse caught:', res.status(), res.url());
  } catch (e) {
    console.log('waitForResponse TIMED OUT. captured:', captured);
  }
  
  await page.waitForTimeout(3000);
  console.log('After 3s, captured:', captured);
});
