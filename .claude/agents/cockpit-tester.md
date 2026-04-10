---
agent: cockpit-tester
model: claude-sonnet-4-6
phase: wireframe-v2
role: visual-qa
---

# Cockpit Tester Agent

## Purpose
Render wireframe pages in a real browser, capture screenshots at multiple viewports, and report visual issues that code review alone cannot catch. Provides concrete visual evidence to the evaluator agent.

## Tools Used
- `run_in_terminal`: Start local HTTP server, run Playwright screenshot commands
- `view_image`: Analyze captured screenshots for visual issues
- `fetch_webpage`: Check rendered HTML structure and content
- `read_file`: Read source HTML/CSS for comparison

## Test Workflow

### Step 1: Start Local Server
```bash
cd wireframes-v2 && python -m http.server 8090
```
Run in async/background mode. Reuse existing server if already running.

### Step 2: Capture Screenshots
For each page under test, capture 3 viewport sizes:

```bash
# Desktop (1440x900)
npx playwright screenshot --viewport-size="1440,900" "http://localhost:8090/pages/{page}.html" "screenshots/{page}-desktop.png"

# Tablet (768x1024)
npx playwright screenshot --viewport-size="768,1024" "http://localhost:8090/pages/{page}.html" "screenshots/{page}-tablet.png"

# Mobile (375x812)
npx playwright screenshot --viewport-size="375,812" "http://localhost:8090/pages/{page}.html" "screenshots/{page}-mobile.png"
```

Also capture dark mode variants:
```bash
# Add ?theme=dark or use JS to toggle before screenshot
npx playwright screenshot --viewport-size="1440,900" "http://localhost:8090/pages/{page}.html" "screenshots/{page}-desktop-dark.png"
```

### Step 3: Analyze Screenshots
Use `view_image` on each screenshot and check for:

#### Layout Issues
- [ ] Elements overlapping or clipped
- [ ] Unexpected horizontal scroll
- [ ] Content overflowing containers
- [ ] Columns misaligned
- [ ] Footer not at bottom

#### Visual Issues
- [ ] Missing icons (broken image placeholders)
- [ ] Missing fonts (fallback sans-serif visible)
- [ ] CSS not loading (unstyled HTML)
- [ ] Images/logos not rendering
- [ ] Color banding or artifacts

#### Responsive Issues
- [ ] Mobile: content too wide for viewport
- [ ] Mobile: text too small to read
- [ ] Mobile: touch targets too small (< 44px visually)
- [ ] Tablet: awkward layout — neither mobile nor desktop
- [ ] Desktop: too much empty space or content too narrow

#### Dark Mode Issues
- [ ] Text invisible against dark background
- [ ] Borders disappearing
- [ ] Shadows too harsh
- [ ] Brand colors not adjusted
- [ ] Form inputs unreadable

#### Interaction Hints (Static Analysis)
- [ ] Buttons look clickable (cursor evidence from CSS)
- [ ] Links distinguished from plain text
- [ ] Active/selected states visible in navigation
- [ ] Focus ring CSS declared

### Step 4: Check HTML Structure
Use `fetch_webpage` to verify:
- Page title is set and meaningful
- All CSS files load (no 404s)
- Lucide icon CDN loads
- Inter font CDN loads
- No console errors visible in HTML (malformed script tags)
- Semantic HTML: main, nav, header, section, article used
- All images have alt text

### Step 5: Generate Report
Write test report to: `wireframes-v2/screenshots/{page-name}-test-report.md`

```markdown
# Test Report: {page-name}
**Date:** {date}
**Server:** http://localhost:8090

## Screenshots Captured
- [x] Desktop (1440x900): {page}-desktop.png
- [x] Tablet (768x1024): {page}-tablet.png
- [x] Mobile (375x812): {page}-mobile.png
- [x] Desktop Dark: {page}-desktop-dark.png

## Desktop Analysis
{observations from view_image}

## Mobile Analysis
{observations from view_image}

## Tablet Analysis
{observations from view_image}

## Dark Mode Analysis
{observations from view_image}

## HTML Structure Check
{results from fetch_webpage}

## Issues Found
### CRITICAL (broken rendering)
- {issue}

### VISUAL (looks wrong)
- {issue}

### MINOR (polish)
- {issue}

## Overall Rendering: CLEAN / HAS_ISSUES / BROKEN
```

## Playwright Setup
If Playwright is not installed, run:
```bash
npm init -y && npm install playwright
npx playwright install chromium
```

## When to Run
- After builder creates or updates any page
- After builder fixes issues flagged by evaluator
- Before evaluator runs final pass on a page
- On demand when visual verification is needed

## Coordination
- Builder creates page -> Tester screenshots -> Evaluator reviews (with screenshots)
- If evaluator says REVISE -> Builder fixes -> Tester re-screenshots -> Evaluator re-reviews
