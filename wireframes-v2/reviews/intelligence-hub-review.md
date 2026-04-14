# Evaluation: intelligence-hub.html (Intelligence Hub)
**Date:** 2026-04-12
**PRD reference:** docs/prd/15-intelligence-hub.md (§15.1–15.9)
**Evaluator:** cockpit-evaluator agent

---

## Scores

| # | Dimension | Score | Weight | Weighted |
|---|-----------|-------|--------|---------|
| 1 | Visual Hierarchy | 4.5 | 1.5x | 6.75 |
| 2 | Design System Adherence | 4.5 | 1.5x | 6.75 |
| 3 | Component Fidelity | 4.5 | 1.2x | 5.40 |
| 4 | Information Density | 4.0 | 1.0x | 4.00 |
| 5 | Interactive Realism | 4.5 | 1.2x | 5.40 |
| 6 | Dark Mode Quality | 3.5 | 1.0x | 3.50 |
| 7 | Responsive Design | 3.5 | 1.0x | 3.50 |
| 8 | Accessibility | 4.0 | 1.0x | 4.00 |
| 9 | Anti-AI Authenticity | 5.0 | 1.3x | 6.50 |
| 10 | PRD Completeness | 4.5 | 1.3x | 5.85 |
| **Total** | | | **12.0x** | **51.65** |

**Weighted average: 51.65 / 12.0 = 4.30**

---

## Verdict: PASS

Score 4.30 exceeds the 3.8 threshold. This is the strongest wireframe in the v2 series on data realism and PRD completeness.

---

## Scoring Rationale

### 1. Visual Hierarchy (4.5/5)
The three-level hierarchy — topbar with breadcrumb/agent selector → left-nav with group labels → content panel with `panel-header` / `editor-shell` — reads cleanly. The `ih-breadcrumb-icon` gradient (`#6366f1 → #8b5cf6`) creates a distinctive entry point. The `panel-title` / `panel-subtitle` pairing sets clear section context before the editor. Minor deduction: the Skill Authoring list view's action bar (`.skill-action-bar`) sits below the `panel-header`, which creates two visual "top zones" and slightly dilutes the hierarchy. The episodic table header's all-caps `11px` label row is tight but effective.

### 2. Design System Adherence (4.5/5)
All color references use tokens: `var(--brand-primary)`, `var(--bg-surface)`, `var(--border-default)`, `var(--state-progress)`, `var(--state-delayed)`, `var(--state-blocked)`, `var(--shadow-4)`, `var(--radius-xl)`, `var(--duration-fast)`, `var(--space-*)`, `var(--text-*)`, `var(--weight-*)`. The hardcoded exceptions are intentional design choices: the breadcrumb icon gradient (`#6366f1 → #8b5cf6`, per Intelligence brand), warning banner rgba tints (`rgba(245, 158, 11, 0.08)`), and modal overlay scrim (`rgba(0,0,0,0.4)`) — all acceptable patterns for contextual overlays. JetBrains Mono is used for all editor and monospace content. Minor gap: the skill tag badges in `renderSkillList()` use inline `rgba(59,130,246,0.1)` rather than a token; this could use `var(--brand-primary-light)` with `var(--brand-primary)` text.

### 3. Component Fidelity (4.5/5)
Buttons match the design system's `btn btn-sm btn-primary / btn-ghost / btn-danger` hierarchy throughout. The editor shell (gutter + textarea + status bar) is a faithful Monaco simulation using JetBrains Mono, live line-number generation (`updateGutter()`), scroll sync (`syncScroll()`), and character count. The modal pattern (overlay + scale transition `0.96→1`) and slide-over (`translateX(100%)→0`) are production-ready. The validation panel's two states (`.validation-panel.valid` / `.invalid`) with green/red border and header background are polished. Row-action buttons (`.ra-btn`) have correct hover and danger-hover state. The `warn-banner` with amber tint matches the PRD §15.3.2 requirement exactly. Minor gap: the skill editor view has `display:none;height:100%;display:none;` — a duplicate `display:none` at line 819 that would prevent the flex layout from applying correctly in some browsers.

### 4. Information Density (4.0/5)
Each panel is well-proportioned for its content type. The episodic table's `grid-template-columns: 140px 180px 1fr 110px` gives appropriate weight to date, label, and name. Semantic Memory's three-panel-within-panel (200px topic list + flex editor) is the right breakdown for the task. The skill list table's `200px 1fr 120px` column split is clean. Minor concern: the Working Memory editor is shown with a large-content warning banner already visible (simulating the 9 240 char scenario) which creates a noisy first-impression for the wireframe demo. The panel header's static subtitle text slightly pads vertical space that could tighten at smaller viewport heights.

### 5. Interactive Realism (4.5/5)
The JS interactions are thorough and coherent:
- Skeleton loaders (350ms timeout simulating API fetch) for Profile and Working Memory.
- Dirty-state tracking across all editors with dot indicator in nav and status bar text change.
- Unsaved-changes guard on section navigation (`confirm()` dialog — acceptable for a wireframe).
- Compact modal: submit button correctly disabled until summary ≥ 10 chars; archives entry, reloads editor, dismisses warning banner.
- Episodic slide-over: open/close, read-only editor, gutter sync.
- Semantic: topic switch with dirty guard, slug validation regex, Enter/Escape keyboard handling.
- Skill editor: ID validation regex, fork flow, `validateSkillContent()` parsing real YAML frontmatter.
- `localStorage` persistence for agent ID.
- Agent selector reloads current section.
- Escape key closes all overlays.
Minor gap: `discardProfile()` / `discardWorking()` call `markClean()` without actually resetting editor content to original — a `confirm()` is shown but the content is not reverted. This is a known wireframe limitation.

### 6. Dark Mode Quality (3.5/5)
The file uses `data-theme="light"` as default with `tokens.css` dark mode overrides applied via `[data-theme="dark"]` in that stylesheet. All color references use tokens, so dark mode is structurally sound. However, the following hardcoded values do not adapt:
- Breadcrumb icon gradient (`#6366f1/#8b5cf6`) — acceptable as brand-fixed.
- Warning banner raw rgba tints (`rgba(245,158,11,0.08)` and `rgba(245,158,11,0.25)`) — amber-on-dark should use a slightly higher opacity (0.12 / 0.35) for sufficient contrast in dark mode.
- Validation panel rgba tints (`rgba(16,185,129,0.1)` and `rgba(239,68,68,0.08)`) — the valid/success tint at 0.1 opacity can appear nearly invisible on `--bg-surface` dark (`#111827`). Should be 0.15 for dark mode.
- Skill tag badges inline rgba in JS (`rgba(59,130,246,0.1)`) — does not adapt.
No dark-mode–specific overrides in the page's `<style>` block exist; the file relies entirely on `tokens.css`. There is no `theme.js` import (nav.js is present but theme.js is not), so the dark mode toggle is only available if nav.js injects it.

### 7. Responsive Design (3.5/5)
The `@media (max-width: 767px)` block handles the key breakpoints:
- `.ih-body` switches to `flex-direction: column`.
- `.ih-nav` becomes a horizontal scrolling tab bar (hides dividers, group labels, title).
- Editor font drops to 12px.
- Episodic table columns shrink.
Gaps:
- The three-panel Semantic Memory layout (`.sem-body`) has no mobile override — the 200px topic list + editor side-by-side will overflow on phones.
- The Skill Authoring editor header (`.skill-editor-header`) with multiple buttons inline has no wrapping/stacking rule below 600px.
- The Compact modal (520px wide) will hit `95vw` capping but the textarea at `min-height: 80px` and modal body padding is acceptable.
- No "best viewed on desktop" notice per PRD §15.10 Phase G.7 for mobile (the `.mobile-notice` class exists but is never populated with content).

### 8. Accessibility (4.0/5)
Strong baseline:
- `<nav aria-label="Intelligence Hub sections">` on the left nav.
- `<div role="region" aria-live="polite">` on the content area.
- All panels have `role="tabpanel"` and `aria-label`.
- Nav items have `aria-current="page"` on active item.
- `role="separator"` on nav dividers.
- All icon buttons have `aria-label`.
- Form inputs have explicit `<label for="">` pairing in the Compact modal.
- Delete modal has `aria-labelledby` and `aria-modal`.
- Slide-over has `aria-modal` and `aria-labelledby`.
- Toast container has `aria-live="polite" aria-atomic="true"`.
- Warning banner has `aria-live="assertive"`.
- Episodic table uses `role="row"`, `role="columnheader"`, `role="cell"`.
Gaps:
- No focus trap in modals or slide-over. Keyboard users can Tab out of the modal/slide-over into the obscured background content (same issue as skill-marketplace-review flagged for the drawer).
- Dirty-dot `<span class="dirty-dot">` has `aria-label="Unsaved changes"` which is correct, but the parent nav item does not announce dirty state dynamically — an `aria-description` on the button when dirty would surface this to screen readers without visual inspection.
- `.ep-table-header` uses `role="row"` but the wrapping container has no `role="table"` or `role="grid"`, making the table semantics incomplete.

### 9. Anti-AI Authenticity (5.0/5)
Exceptional. This is the standout dimension:
- **Agent Profile content:** Realistic, opinionated persona with domain expertise (`Kubernetes infrastructure`, `OKR planning`, `Data pipeline design`) and behavioral instructions that read as genuinely authored, not generated filler.
- **Working Memory content:** Specific K8s incident narrative (`graphclaw-embed-5f9d`, `gke-prod-pool-3-abc12`, `MemoryPressure=True since 02:50 UTC`, HPA min replicas, exact PR numbers) with pending decisions that name real team members (`@marcus`, `@priya-ops`). The `Last compact: 2026-04-10 · research-phase-1` footer is a nice internal cross-reference.
- **Episodic entries:** Five distinct summaries across different domains (vector embedding research, K8s incident, OKR planning, scoring calibration, engineer onboarding). Each has structured content with checkboxes, specific dates, and concrete decisions. The scoring weight changes (`W1: 0.30 → 0.28`) directly reference the GraphClaw scoring algorithm from the project memory.
- **Semantic topics:** `users.md` names specific team members with communication preferences. `patterns.md` references real module paths (`graphclaw/state_machine.py`, `graphclaw/errors.py`, `tests/conftest.py`). `projects.md` links to `docs/prd/15-intelligence-hub.md` by exact path.
- **SKILL.md contents:** `data-summariser` and `code-review-assist` are fully authored with version history (0.3.1, 0.2.0), specific output format templates, and realistic metadata.
- No placeholder text anywhere. Empty states have voice ("Use the Compact operation in Working Memory to archive sessions here."). Skill tags use the actual GraphClaw trigger taxonomy (`ON_DEMAND`, `SCHEDULED`, `EVENT`).

### 10. PRD Completeness (4.5/5)
All major PRD §15 features are present and working:

| PRD Feature | Present | Notes |
|-------------|---------|-------|
| Agent Profile editor (§15.2) | ✅ | Monaco sim, Save/Discard, dirty state, starter template pre-filled |
| Working Memory viewer (§15.3) | ✅ | Monaco sim, large-context warning banner at 8000+ chars, Compact shortcut |
| Episodic Memory browser (§15.4) | ✅ | Table with Date/Label/Name/Actions, View slide-over (read-only), Delete confirm |
| Semantic Memory editor (§15.6) | ✅ | Three-panel layout, topic list, editor, New Topic slug input with validation |
| Compact dialog (§15.5) | ✅ | Session label, summary textarea, disabled submit until ≥ 10 chars, archives to episodic |
| Skill Authoring list (§15.7) | ✅ | Table with Edit/Fork/Delete, + New Skill, Import SKILL.md |
| Skill Editor (§15.7.3) | ✅ | Monaco sim, Skill ID field with validation, Validate/Save/Discard/Fork toolbar |
| Validation Panel (§15.7.4) | ✅ | Valid: green banner + KV table. Invalid: red banner + error list. Parses real YAML frontmatter |
| Agent selector (§15.1.2) | ✅ | Dropdown, localStorage persistence, reloads all panels |
| Dirty state (§15.8.2) | ✅ | Dot in nav, status bar text, confirm on navigate-away |
| Skeleton loaders (§15.8.3) | ✅ | Profile and Working Memory panels |
| Delete confirmations | ✅ | Unified delete modal for episodic entries, topics, skills |
| Fork workflow (§15.7.6) | ✅ | Fork from list and from editor, toast with fork ID |
| Import SKILL.md (§15.7.5) | ✅ | Simulated (no real file picker — acceptable for wireframe) |
| Left-nav two-panel layout (§15.1.2) | ✅ | 200px nav + flex content panel |
| Empty states (§15.4.2, §15.7.2) | ✅ | Episodic and skill list both have empty state with prompt action |

Gaps (minor):
- Episodic entry viewer (`viewEntry()`) opens a slide-over with read-only editor but does **not** show a "read-only" badge or status bar indicator per §15.4.3 ("Entry content is read-only — episodic memory is an archive"). The textarea has `readonly` attribute but no visual affordance signals this to the user.
- PRD §15.8.3 specifies an **API error banner** with a Retry button. No error state is simulated for any section — an error-state mockup for at least one panel would complete the pattern.
- PRD §15.8.2 specifies that navigating away with unsaved changes shows a confirmation. The `confirm()` native dialog is used, which works but is not styled to match the design system's delete modal pattern.

---

## Top Issues

### BLOCKER

**1. No focus trap in modals or slide-over (Accessibility)**
The Compact modal (`#compact-modal`), Delete modal (`#delete-modal`), and episodic slide-over (`#slideover-panel`) open without trapping keyboard focus. Tab continues to cycle to content behind the overlay. This is the same class of issue flagged in `skill-marketplace-review.md`.

Fix: In each open handler, move focus to the first interactive element inside the dialog and add a keydown listener that wraps Tab/Shift-Tab within the modal boundary. On close, return focus to the triggering element.

Example fix location — `openCompactModal()` (line ~1136):
```js
function openCompactModal() {
  document.getElementById('compact-modal').classList.add('open');
  var firstFocusable = document.getElementById('compact-label');
  firstFocusable.focus();
  trapFocus(document.getElementById('compact-modal'));
}
```

---

### HIGH

**2. Skill editor view CSS double `display:none` (line 819)**
The skill editor view element has `style="display:none;height:100%;display:none;flex-direction:column;"`. The second `display:none` overrides `flex-direction:column` in the inline style, meaning `openSkillEditor()` sets `ev.style.display = 'flex'` correctly at runtime, but the initial declaration is malformed and may confuse some CSS parsers or devtools inspection.

Fix at `intelligence-hub.html` line 819 — change to:
```html
<div id="skill-editor-view" style="display:none;flex-direction:column;height:100%;">
```

---

**3. Dark mode rgba tints too low opacity for `--bg-surface` dark (#111827)**
`rgba(16,185,129,0.1)` (validation valid banner) and `rgba(239,68,68,0.08)` (validation invalid banner) become nearly invisible against `--bg-surface: #111827` in dark mode. Same issue with the warning banner `rgba(245,158,11,0.08)`.

Fix — add a `[data-theme="dark"]` block in the page `<style>`:
```css
[data-theme="dark"] .warn-banner {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.35);
}
[data-theme="dark"] .validation-panel.valid .vp-header { background: rgba(16,185,129,0.15); }
[data-theme="dark"] .validation-panel.invalid .vp-header { background: rgba(239,68,68,0.14); }
```

---

**4. Semantic Memory layout has no mobile breakpoint (Responsive)**
`.sem-body` uses `display:flex` with a 200px topic list column. At ≤ 767px, this layout is not overridden and the topic list + editor side-by-side will overflow or compress to unusable widths.

Fix — add to the existing `@media (max-width: 767px)` block (around line 454):
```css
.sem-body { flex-direction: column; }
.sem-topics { width: 100%; border-right: none; border-bottom: 1px solid var(--border-default); max-height: 160px; }
.sem-editor-wrap { padding: var(--space-3); }
```

---

**5. Episodic table missing `role="table"/"grid"` wrapper (Accessibility)**
The episodic memory table uses `role="row"`, `role="columnheader"`, and `role="cell"` on individual elements, but the containing `<div class="ep-table-wrap">` has no `role="table"` or `role="grid"`. This breaks the ARIA table semantics — assistive technologies need the parent `role` to announce column count and navigate between rows correctly.

Fix — at `intelligence-hub.html` around line 715:
```html
<div class="ep-table-wrap" role="table" aria-label="Episodic memory entries">
```
And change the header div to `role="rowgroup"` wrapping the header `role="row"`, or simply add `role="rowgroup"` to `ep-table-body`.

---

## What Worked Well

- **Data authenticity is exceptional.** The working memory content, episodic summaries, and semantic topics form a coherent, cross-referencing knowledge graph (K8s incident → open action items → patterns.md → projects.md). This feels like a real agent's memory, not a demo. It is the best mock data in the entire v2 series.
- **Compact workflow is fully functional end-to-end.** The complete round-trip — warning banner → modal → archive to episodic → reload editor → dismiss banner — is implemented correctly and even handles the archived entry appearing in the episodic table immediately.
- **Skill validation parses real YAML frontmatter** using a regex and field extraction loop. It distinguishes missing required fields from a fully valid parse, and renders two visually distinct result panels. This is the highest-fidelity simulation of a backend call in the wireframe series.
- **Dirty-state management is comprehensive** — it spans nav-dot, status bar, confirm-on-navigate, confirm-on-topic-switch, and confirm-on-discard. Very few wireframes implement multi-axis dirty tracking.
- **Left nav group labels** (`Memory` group with `Working / Episodic / Semantic`) match the PRD's mental model perfectly and give the subsection structure at a glance.
- **localStorage persistence for agent ID** is a tiny detail that no other page bothers with and immediately signals production intent.
