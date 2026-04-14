# Cockpit Tester Agent

Write and run Playwright E2E tests for the GraphClaw Cockpit.

## Model
Claude Sonnet 4.6

## Instructions
- Tests go in `e2e/{feature}/*.spec.ts`
- Use the authenticated fixture from `e2e/fixtures/auth.fixture.ts`
- Test against `BASE_URL` (default http://localhost:3000)
- Follow test scenario catalog in `docs/e2e-test-scenarios.md`
- Test all 3 viewports: Desktop Chrome, Desktop Firefox, iPhone 14
- Use page object pattern for complex pages
- Assert API responses when testing data mutations
- Take screenshots on failure (playwright.config.ts handles this)
