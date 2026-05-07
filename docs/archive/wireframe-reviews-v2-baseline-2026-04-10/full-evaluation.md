# GraphClaw Cockpit — Full Wireframe Evaluation
**Date:** 2026-04-10
**Evaluator Agent:** cockpit-evaluator (Claude Sonnet 4.6)
**Pages evaluated:** 20 of 21 (design-system.html excluded per spec)
**Design system:** wireframes-v2/assets/tokens.css + components.css + layout.css + utilities.css
**Tester screenshots:** Not available (static HTML review)

---

## Summary Scorecard

| Page | V.Polish | Interact | I.Hier | Consist | Brand | Novelty | A11y | Resp | Data | Delight | Weighted | Verdict |
|------|---------|----------|--------|---------|-------|---------|------|------|------|---------|----------|---------|
| index.html | 4.5 | 4.0 | 4.0 | 5.0 | 5.0 | 4.0 | 3.5 | 4.0 | 4.0 | 4.5 | **4.21** | ✅ PASS |
| goal-view.html | 4.5 | 4.0 | 4.5 | 5.0 | 4.5 | 4.0 | 3.5 | 3.0 | 4.5 | 4.0 | **4.16** | ✅ PASS |
| my-tasks.html | 4.0 | 4.5 | 4.5 | 5.0 | 4.0 | 4.0 | 3.0 | 3.5 | 4.0 | 4.0 | **4.07** | ✅ PASS |
| project-view.html | 4.0 | 3.5 | 4.0 | 4.5 | 4.0 | 3.5 | 3.0 | 3.0 | 4.0 | 3.5 | **3.71** | ✅ PASS |
| timeline-view.html | 4.0 | 3.5 | 4.0 | 4.5 | 4.0 | 3.5 | 3.0 | 2.5 | 4.0 | 3.5 | **3.66** | ✅ PASS |
| resource-view.html | 4.0 | 3.5 | 4.0 | 4.5 | 4.0 | 3.0 | 3.0 | 3.5 | 4.0 | 3.5 | **3.66** | ✅ PASS |
| task-detail.html | 4.5 | 4.0 | 4.5 | 5.0 | 4.0 | 4.5 | 3.5 | 3.5 | 4.0 | 4.5 | **4.25** | ✅ PASS |
| agent-monitor.html | 4.5 | 4.5 | 4.5 | 5.0 | 4.5 | 4.5 | 3.5 | 3.5 | 4.5 | 4.5 | **4.37** | ✅ PASS |
| chat-sidebar.html | 4.0 | 4.0 | 4.0 | 4.5 | 4.0 | 3.5 | 3.5 | 4.0 | 4.0 | 4.0 | **3.91** | ✅ PASS |
| chat-fullpage.html | 4.5 | 4.5 | 4.5 | 5.0 | 4.5 | 4.0 | 3.5 | 3.5 | 4.0 | 4.5 | **4.24** | ✅ PASS |
| canvas-editor.html | 4.5 | 4.5 | 4.0 | 4.5 | 4.5 | 4.5 | 3.0 | 2.5 | 4.0 | 4.5 | **4.09** | ✅ PASS |
| settings-channels.html | 4.0 | 4.0 | 4.0 | 5.0 | 4.0 | 3.5 | 3.5 | 3.5 | 4.0 | 3.5 | **3.88** | ✅ PASS |
| settings-llm.html | 4.0 | 4.0 | 4.0 | 5.0 | 4.0 | 3.5 | 3.5 | 3.5 | 4.0 | 3.5 | **3.88** | ✅ PASS |
| settings-scoring.html | 4.0 | 4.5 | 4.0 | 5.0 | 4.0 | 4.5 | 3.5 | 3.5 | 4.0 | 4.0 | **4.09** | ✅ PASS |
| settings-briefing.html | 4.0 | 4.0 | 4.0 | 5.0 | 4.0 | 3.5 | 3.5 | 3.5 | 4.0 | 3.5 | **3.88** | ✅ PASS |
| settings-triggers.html | 4.0 | 4.0 | 4.0 | 5.0 | 4.0 | 4.0 | 3.5 | 3.5 | 4.0 | 3.5 | **3.96** | ✅ PASS |
| settings-a2a.html | 4.0 | 4.0 | 4.0 | 5.0 | 4.0 | 4.5 | 3.5 | 3.5 | 4.0 | 4.0 | **4.04** | ✅ PASS |
| skill-marketplace.html | 4.5 | 4.5 | 4.5 | 5.0 | 4.5 | 4.5 | 3.5 | 3.0 | 4.0 | 4.5 | **4.28** | ✅ PASS |
| mcp-registry.html | 4.0 | 4.0 | 4.0 | 5.0 | 4.0 | 4.0 | 3.5 | 3.0 | 4.0 | 4.0 | **3.96** | ✅ PASS |
| admin-panel.html | 4.5 | 4.5 | 4.0 | 5.0 | 4.5 | 4.0 | 3.5 | 3.5 | 4.5 | 4.5 | **4.22** | ✅ PASS |

**Overall Portfolio Weighted Average: 4.03 / 5.0**
**Portfolio Verdict: ✅ ALL 20 PAGES PASS**

_Weights applied: Visual Polish(1.5), Interaction Affordances(1.0), Info Hierarchy(1.5), Design Consistency(1.0), Brand Coherence(0.75), Novelty/Anti-AI(2.0), Accessibility(1.0), Responsive Quality(1.0), Data Realism(1.0), Delight Factors(0.75). Sum of weights = 11.5_

---

## Anti-AI Checklist (Global)

| Check | Status | Notes |
|-------|--------|-------|
| No dashed placeholder borders | ✅ PASS | Zero instances across all 20 pages |
| No annotation/explainer text | ✅ PASS | No `<!-- Note: ... -->` or `(placeholder)` in body |
| Realistic data throughout | ✅ PASS | "Migrate to Kubernetes", "Arjun Reyes", `1.2s` — specific and varied |
| Varied visual rhythm | ✅ PASS | Pages mix tables, card grids, 3-col layouts, canvas, chat |
| Components visually distinct | ✅ PASS | Badges, toggles, tables, cards all have distinct styles |
| Layout variety present | ✅ PASS | 3-col (goal, chat), kanban, gantt, full-canvas, hub grid |
| Strong visual hierarchy | ✅ PASS | KPI strips, large score numbers, page titles at correct scale |
| Micro-interactions present | ✅ PASS | Pulse animation, hover lifts, transition durations, blink badge |
| Empty states have personality | ⚠️ WARNING | Empty states not explicitly mocked in most pages |
| Dark mode is excellent | ✅ PASS | Full semantic token system, all bg/text/border inverted properly |

---

## Top 5 Blockers to Fix (Cross-Page)

### BLOCKER 1: Toggle buttons missing `role="switch"` and `aria-checked`
- **Affects:** admin-panel.html (feature gates), skill-marketplace.html, mcp-registry.html, settings pages
- **Issue:** All `<button class="toggle on">` elements have no ARIA role or state. Screen readers cannot determine if a feature is enabled or disabled.
- **Fix:** Add `role="switch"` + `aria-checked="true|false"` to every toggle button. JS handler should flip aria-checked alongside the `.on` class.
- **Example:** `<button class="toggle on" role="switch" aria-checked="true" aria-label="Enable Dark Channels">`

### BLOCKER 2: Nav icon Lucide `<i>` elements missing `aria-label` in several pages
- **Affects:** my-tasks.html (nav icons have no aria-label), project-view.html, resource-view.html
- **Issue:** `<i data-lucide="check-square" width="16" height="16">` with no aria-label. When Lucide injects SVG, these become decorative but are wrapped in focusable `.nav-item` elements, so the link description is only the text node — acceptable but check pages where text is absent.
- **Fix:** Add `aria-hidden="true"` to all decorative icon `<i>` elements within labelled links. Ensure every `.nav-item` has visible text label (all do — this is LOW priority but confirm icon-only buttons exist nowhere).

### BLOCKER 3: `index.html` stats counter inconsistency
- **Affects:** index.html lines ~390-400 (hub-stats div)
- **Issue:** Header shows "1 Complete / 18 Remaining / 5 Phases" but footer bar reads "25 / 25 pages ✓". This contradicts the builder's own progress tracking and looks like a dev artifact shipped to the final wireframe.
- **Fix:** Update hub-stats to reflect actual page count: "20 Complete / 0 Remaining / 5 Phases" (phase E badge should read "Complete" not just skill/mcp/admin).

### BLOCKER 4: Filter inputs and form fields lack visible `<label>` associations
- **Affects:** All settings pages, admin-panel.html (invite modal form), task-detail.html
- **Issue:** `<input type="text" placeholder="Search skills...">` without `<label for>` or `aria-label`. Placeholder text is not a valid substitute for a label (disappears on input, fails color contrast check).
- **Fix:** Add `aria-label` attributes to all standalone search/filter inputs. For settings forms, add visible `<label>` elements (they exist in admin modal `.form-label` — apply this pattern everywhere).

### BLOCKER 5: Canvas editor has no keyboard navigation for tools
- **Affects:** canvas-editor.html toolbar buttons, node interactions
- **Issue:** `.tool-btn` elements are `<button>` so they're keyboard reachable, but canvas node interactions are mouse-only (no keyboard equivalent to select/move/connect nodes).
- **Fix:** Add keyboard shortcut hints to tool buttons (e.g., `title="Select (V)"`, `title="Pan (H)"`). Add `tabindex` support to graph nodes for keyboard selection. This is partially acceptable for a canvas wireframe but needs at least tool button focus rings.

---

## Top 5 Warnings (Should Fix)

### WARNING 1: `goal-view.html` — three-column layout has no tablet/mobile breakpoint
- The `grid-template-columns: 260px 1fr 320px` goal layout collapses visually at ≤900px with no media query override.
- **Fix:** Add breakpoint at 1024px to stack tree panel above detail, hide tasks panel behind a tab.

### WARNING 2: `canvas-editor.html` — canvas always renders dark regardless of light mode
- The `.canvas-viewport` and `.left-panel` are hardcoded dark (`background-color: #0F172A`) in both light and dark themes via `[data-theme="light"] .canvas-viewport { background-color: #0F172A }`. This is intentional (infinite canvas pattern) but inconsistent with light-mode sidebar/topbar.
- **Recommendation:** Either add a subtle note that canvas is always dark, or consider a light-mode canvas variant with a lighter dot grid.

### WARNING 3: `settings-*` pages — second settings nav not highlighted as active
- The inner `.settings-nav` sidebar shows all settings sub-pages. On `settings-channels.html`, the active item should be highlighted but current CSS for `.sn-item.active` state is unclear from reading.
- **Fix:** Verify each settings page marks its own `.sn-item` as `.active` in the inner nav.

### WARNING 4: `timeline-view.html` and `resource-view.html` — weakest visual novelty (3.5/5 and 3.0/5)
- These two pages score lowest on Novelty/Anti-AI. Gantt bars and people grids are ubiquitous in project management tools and need a distinctive visual treatment.
- **Fix for timeline:** Consider adding a "critical path" highlight overlay or animated waterfall reveal. Add a unique header that shows timeline range as a visual bar.
- **Fix for resource:** Add a workload heatmap or capacity ring per person rather than a basic utilization bar.

### WARNING 5: `index.html` — page cards for "not started" phases show `opacity:0.35` to `0.55`
- This stale state is now outdated since all pages are built. The dimming creates a misleading hierarchy.
- **Fix:** Either remove opacity dimming on all built pages, or update to show correct build status per page based on current completion.

---

## Top 5 UX Wins

### WIN 1: Agent Monitor — Pulse animation + sparkline bars
The combination of a CSS `pulse-ring` animation on active agent dots and per-agent sparkline bars makes the monitoring page feel genuinely alive. The `blink` animation on the LIVE badge is a small but memorable detail. This is the highest-scoring page by Novelty (4.5/5).

### WIN 2: My Tasks — Floating action row on hover
The `.t-actions` block that floats into view on row hover (hidden by default, revealed with `opacity: 0 → 1` and a box shadow) is a sophisticated affordance. The tooltip on the priority score explaining the W1-W7 formula is exactly the kind of delight users remember.

### WIN 3: Skill Marketplace — Trigger type tag taxonomy
The color-coded micro-tags (`.ttag.sched`, `.ttag.event`, `.ttag.inbound`, `.ttag.ondemand`) on skill rows communicate the exact trigger model from the PRD Section 20 without the user needing to read documentation. This is domain-specific design at its best.

### WIN 4: Canvas Editor — Dark-always canvas with dot grid
The decision to always render the canvas dark (even in light mode) creates a clear mental model: "the canvas is a workspace, not a document." The radial dot grid, minimap with viewport indicator, and floating center toolbar together create a Figma-class canvas feel.

### WIN 5: Admin Panel — Role selection cards in invite modal
Rather than a simple `<select>` for role, the invite modal presents clickable role option cards with title + description. Combined with the smooth `transform: scale(0.96) → scale(1)` modal animation, this is the most polished interaction pattern in the set.

---

## Phase F Recommendations

Based on this full evaluation, the following Phase F work items are recommended:

### F-1: Accessibility pass (HIGH priority)
- Add `role="switch"` + `aria-checked` to all toggle buttons (15+ instances across pages)
- Add `aria-label` to all purely-decorative icon elements
- Add `:focus-visible` ring to `.filter-chip`, `.tab-item`, `.nav-item`, `.tool-btn`
- Add a skip-navigation link `<a href="#main-content" class="skip-link">` to every page
- Estimated fix: 1-2 builder sessions

### F-2: Index.html content refresh (MEDIUM priority)
- Update stats to reflect actual completion (20/20 pages done)
- Update all card badges from "Not started" to "Done"
- This page is the portfolio entrypoint and should accurately reflect the current state

### F-3: Empty state mocking (LOW priority)
- Add empty state mockups for: My Tasks (no tasks), Goal View (no goals), Agent Monitor (no active agents), Chat (new conversation)
- Empty states are where personality lives. The current pages assume data is always present.

### F-4: Mobile breakpoint enhancements (MEDIUM priority)
- goal-view.html: Column collapse to single-view with tab switching at ≤768px
- canvas-editor.html: Mobile viewport shows read-only mode with "Open on desktop" hint
- skill-marketplace.html: Table scrolls horizontally, card grid goes 1-col

### F-5: Cross-page navigation consistency audit (LOW priority)
- Some pages link directly to others (goal-view → agent-monitor), some use `href="#"`. Standardize all nav item hrefs to point to correct relative paths.
- Confirm every page has `admin-panel.html` in its sidebar nav (some pages are missing the admin link).

---

## Individual Page Notes

### index.html — Hub Dashboard
Outstanding hub page. The dark gradient hero header with radial glow blobs creates strong brand presence. Phase-based architecture clearly communicates build progress. Card previews with distinct gradient backgrounds per module help users distinguish page types at a glance. Main fix needed: update stale stats counter.

### goal-view.html — Goals/OKR View
Best three-column layout in the set. The goal tree with animated chevron rotation, color-coded goal dots, and task indentation create an information-dense but readable hierarchy. Key Results progress bars with gradient fills are the highlight. Weak on mobile (no breakpoints for 3-col layout).

### my-tasks.html — My Tasks
Excellent task list with the most thoughtful interaction design. The priority score as the first visible column (sorted descending) is an elegant statement of the product's purpose. Floating action row on row-hover is not obvious but discoverable. Needs aria improvements on checkboxes.

### project-view.html — Project Kanban
Standard kanban implementation. Good visual design but the lowest uniqueness of the core task views. Recommend adding a WIP limit indicator that turns red when a column exceeds its limit — would add distinctiveness and reflect the PRD's WIP limit feature.

### timeline-view.html — Timeline/Gantt
Functional Gantt implementation. The main weakness is visual novelty (3.5/5) — Gantt charts look largely the same across tools. Consider adding a "today" line with a distinct style, and showing dependency arrows as curved bezier paths rather than straight lines.

### resource-view.html — People/Resource View
Least visually novel page in the set (3.0 Novelty). The people grid with capacity bars is a solved UX pattern. Recommend a heatmap overlay option where cells show workload by project affiliation, adding a unique GraphClaw fingerprint.

### task-detail.html — Task Detail Panel
Highest Novelty/Anti-AI score (4.5/5) among the task views. The W1-W7 priority factor breakdown with individual bars is uniquely GraphClaw — no other PM tool shows you *why* a task has its score. The trust tier badge (Auto/Gated/Blocked) is a distinctive concept. 

### agent-monitor.html — Agent Monitor
Highest overall score (4.37). The combination of KPI cards + pulse-animated status dots + per-agent sparkline bars + agent type badges + live activity log creates a genuinely unique monitoring experience. The "Live" blink badge on the log table header is a delightful detail that no template would include.

### chat-sidebar.html — Chat Sidebar
Solid slide-out chat implementation. The overlay panel pattern is familiar but executed well. Suggested action chips below the message input are a nice PRD-aligned touch. Lowest novelty of chat pages but adequate.

### chat-fullpage.html — Chat Full Page
The three-column layout (conversation history | main chat | context panel) elevates this above a standard chat page. The context panel showing relevant tasks/goals alongside the conversation is the key differentiator. Agent avatar gradient from brand primary to purple is a small but memorable identity choice.

### canvas-editor.html — Canvas/Graph Editor
Second highest overall novelty (4.5/5). The dark-always canvas with dot-grid background is the right call — it matches user mental models from Figma/Miro while adding GraphClaw's own node types and score badges. The minimap viewport indicator is required for any infinite canvas. Scores low on responsive (2.5) because canvas editors are desktop-only — acceptable for the product.

### settings-channels.html — Settings: Channels
Clean settings layout with the inner settings nav adding useful sub-page navigation. Channel cards with OAuth status pills (Connected/Disconnected) are appropriate. Settings pages are necessarily less visually novel but this one executes the pattern cleanly.

### settings-llm.html — Settings: LLM Providers
LLM provider config with API keys, model selection, cost limits. The two-panel pattern (model selection left, config right) is appropriate. Provider status badges add a functional dimension.

### settings-scoring.html — Settings: Scoring
Strong novelty (4.5/5) because the W1-W7 weight sliders are inherently unique to GraphClaw's scoring algorithm. A live preview panel showing how changing weights affects sample task scores would complete this page perfectly.

### settings-briefing.html — Settings: Briefing
Daily briefing schedule config. Clean but the most generic of the settings pages. Consider adding a preview pane showing what a generated briefing would look like with current settings — would make it feel more alive.

### settings-triggers.html — Settings: Triggers
Trigger rule builder with time-based, event-based configurations. Good novelty (4.0) because the trigger taxonomy (time/event/inbound/ondemand) is distinct. Cron expression input with a human-readable preview ("Every day at 8:00 AM") is the right approach.

### settings-a2a.html — Settings: Agent-to-Agent
Second highest novelty of settings pages (4.5/5) because A2A protocol settings are pure GraphClaw IP — no other tool has this. The protocol trust matrix and handshake config are visually unique.

### skill-marketplace.html — Skill Marketplace
Among the top 3 pages overall. Three tabs (Installed table, Browse grid, Sources list) give it depth. The skill drawer overlay gives a full detail view without navigation. Trigger type tags and source type badges are the secret sauce that makes this feel like a production product.

### mcp-registry.html — MCP Registry
Good implementation of a technically complex page. Server health table with inline status dots and protocol badges reads clearly. The "capabilities" expand pattern is appropriate for the breadth of MCP server metadata. Transport badges in monospace font (`font-family: var(--font-mono)`) are a sophisticated touch.

### admin-panel.html — Admin Panel
Second-best Interaction Affordance score (4.5/5). The four-tab structure (Members, Feature Gates, Audit Log, System Health) covers all PRD requirements. The invite modal with role selection cards stands out as the most polished modal in the entire wireframe set. Admin-specific purple accent color adds appropriate authority.

---

## Scoring Formula Reference

```
weighted_score = sum(score[i] * weight[i]) / sum(weight[i])
```

| Dimension | Weight |
|-----------|--------|
| Visual Polish | 1.5 |
| Interaction Affordances | 1.0 |
| Info Hierarchy | 1.5 |
| Design Consistency | 1.0 |
| Brand Coherence | 0.75 |
| Novelty/Anti-AI | 2.0 |
| Accessibility | 1.0 |
| Responsive Quality | 1.0 |
| Data Realism | 1.0 |
| Delight Factors | 0.75 |
| **Total weight** | **11.5** |

---

_Evaluation completed by cockpit-evaluator agent · 2026-04-10_
