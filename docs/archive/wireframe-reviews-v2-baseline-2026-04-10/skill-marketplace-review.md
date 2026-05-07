# Evaluation: skill-marketplace.html (Skill Marketplace)
**Date:** 2026-04-10
**Builder version:** current
**Tester screenshots:** No

## Scores
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Polish | 4.5/5 | 1.5 | 6.75 |
| Interaction Affordances | 4.5/5 | 1.0 | 4.50 |
| Info Hierarchy | 4.5/5 | 1.5 | 6.75 |
| Design Consistency | 5.0/5 | 1.0 | 5.00 |
| Brand Coherence | 4.5/5 | 0.75 | 3.375 |
| Novelty / Anti-AI | 4.5/5 | 2.0 | 9.00 |
| Accessibility | 3.5/5 | 1.0 | 3.50 |
| Responsive Quality | 3.0/5 | 1.0 | 3.00 |
| Data Realism | 4.0/5 | 1.0 | 4.00 |
| Delight Factors | 4.5/5 | 0.75 | 3.375 |
| **Weighted Average** | | | **4.28 / 5.0** |

## Verdict: ✅ PASS

## Issues

### BLOCKERS
- [ ] **Toggle buttons (`.toggle`) lack `role="switch"` and `aria-checked`** — The enable/disable toggles on skill rows have no ARIA role. Screen reader users hear a generic button with no state. — `.st-row` toggle column — Fix: `<button class="toggle on" role="switch" aria-checked="true" aria-label="Enable skill: [skill name]">`.
- [ ] **Skill detail drawer (`.skill-drawer`) has no focus trap** — When the drawer opens (`transform: translateX(0)`), keyboard focus is not moved inside and `Tab` continues to cycle through the hidden page behind. — `.skill-drawer.open` JS handler — Fix: on drawer open, move focus to `.drawer-header` close button and trap Tab within the drawer. On close, return focus to the triggering row.

### WARNINGS
- [ ] **Dense skills table needs horizontal scroll at < 1200px** — `.st-head` and `.st-row` use `grid-template-columns: 28px 2fr 80px 100px 160px 80px 80px 72px 100px` (9 columns). At a 1200px viewport or narrower, columns overflow without a horizontal scroll wrapper. — `.skills-table` container — Fix: wrap `.skills-table` in a `overflow-x: auto` container at viewport ≤ 1200px, or collapse trigger tags column behind an expandable.
- [ ] **Browse tab skill card grid (`repeat(3, 1fr)`) has no mobile fallback** — At 768px, 3-column cards become <240px each which likely breaks the card layout. — `.skill-grid` — Fix: add `@media (max-width: 768px) { .skill-grid { grid-template-columns: 1fr 1fr; } }` and `@media (max-width: 480px) { .skill-grid { grid-template-columns: 1fr; } }`.
- [ ] **`.filter-chip` elements don't have explicit `type="button"`** — Without `type="button"`, buttons inside forms behave as submit. While these aren't in a form, it's a best practice violation. — All `.filter-chip` buttons — Fix: add `type="button"` to all non-submit buttons.

### SUGGESTIONS
- The `.src-badge.github` uses hardcoded hex colors (`#0969da` / `#d0e6ff`) instead of design token equivalents. Consider whether these should use `--brand-primary` variants or remain GitHub-branded (the latter is more recognizable and is acceptable for a 3rd-party source badge).
- Star ratings (`.star-row`) use `color: var(--state-delayed)` for all stars including empty ones — meaning even unselected stars glow amber. Add an empty-star style (e.g., `color: var(--border-strong)`) for the unfilled portion to show partial ratings clearly.
- The version column in the skills table shows install version but no "latest available" version. A `v1.2.1 → v1.3.0` upgrade indicator in the version cell for update-available skills would make the update action more compelling.

## What Worked Well
- **Trigger type tags** (`sched`, `event`, `inbound`, `ondemand`) are the standout feature of this page. They directly reflect GraphClaw's PRD Section 20 trigger taxonomy and make skills immediately classifiable at a glance. No other PM tool has this level of execution-mode metadata on marketplace items.
- **Three-tab architecture** (Installed table → Browse card grid → Sources list) creates a natural user journey: see what you have → find more → manage where you get skills from.
- **Skill detail drawer** (`transform: translateX(100%) → translateX(0)`) with `transition: var(--duration-slow)` is the correct pattern for a deep-dive view — avoids full navigation, keeps context intact.
- **Install button variants** (`.sc-install-btn.install` / `.installed-btn` / `.update`) give three distinct states with appropriate visual weight: primary CTA for new installs, subdued for already-installed, amber for available updates.
- **Source type badges** (`local / github / system`) distinguish skill origins, which matters for security trust models.
- **Row-level toggle** confirms the current enabled state at a glance without entering a detail view.
- **Star ratings + usage count** in browse cards create a social proof layer that makes the marketplace feel populated rather than static.

## Anti-AI Checklist
- [x] No dashed placeholder borders
- [x] No annotation/explainer text
- [x] Realistic data throughout (skill names from domain, source URLs in monospace, realistic version numbers)
- [x] Varied visual rhythm (table for installed vs card grid for browse vs source cards for sources)
- [x] Components visually distinct (table rows vs skill cards vs source cards — each has its own structure)
- [x] Layout variety present (3 tabs with 3 different layout patterns)
- [x] Strong visual hierarchy (tab navigation clear, KPI strip above tabs, table header labels)
- [x] Micro-interactions present (card hover lift, row hover, drawer slide-in, toggle animation)
- [ ] Empty state: "No skills installed" not mocked; "No results" search empty state not mocked
- [x] Dark mode is excellent (all badge variants have dark mode overrides: trust-auto, trust-gated, trust-blocked)
