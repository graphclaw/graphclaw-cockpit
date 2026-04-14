---
name: cockpit-playwright-e2e
description: Playwright E2E test conventions for GraphClaw Cockpit. Use when writing or reviewing E2E tests.
---

# Cockpit Playwright E2E Conventions

## Auth Fixture
All tests use the authenticated fixture:
```typescript
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Get dev token from backend
    const res = await page.request.post('/auth/dev-token');
    const { access_token } = await res.json();
    // Set cookie
    await page.context().addCookies([{
      name: 'access_token', value: access_token,
      domain: 'localhost', path: '/',
    }]);
    await use(page);
  },
});
```

## Test Structure
```typescript
test.describe('Goal View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="goal-graph"]');
  });

  test('renders goal nodes', async ({ page }) => {
    const nodes = page.locator('[data-testid="graph-node"]');
    await expect(nodes).toHaveCount.greaterThan(0);
  });
});
```

## Selectors
- Prefer `data-testid` attributes over CSS selectors
- Use `getByRole()` for accessible elements
- Use `getByText()` for visible text

## API Assertions
For mutation tests, intercept the API call:
```typescript
const [response] = await Promise.all([
  page.waitForResponse('**/app/v1/graph/tasks/**'),
  page.click('[data-testid="approve-btn"]'),
]);
expect(response.status()).toBe(200);
```
