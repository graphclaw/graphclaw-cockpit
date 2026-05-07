# Evaluation: UI Changes — nav.js + theme.js
**Date:** 2026-04-10
**Files reviewed:** `wireframes-v2/assets/nav.js`, `wireframes-v2/assets/theme.js`
**Tester screenshots:** No

---

## Scoring Rubric (per-change)
| Dimension         | Weight |
|-------------------|--------|
| Visual Polish     | 1.5    |
| Interaction Affordances | 1.0 |
| Accessibility     | 1.0    |
| Novelty           | 1.0    |
| Brand Coherence   | 0.75   |
| **Total weight**  | **5.25** |

Weighted avg = Σ(score × weight) / 5.25

---

## Change 1 — Theme Picker Dropdown (6 themes)

### What was built
Replaced `#theme-toggle` button with a pill-shaped dropdown. Themes: Light, Dark, Solarized Light, Solarized Dark, Midnight Blue, High Contrast. Each option shows a color swatch, label, and check mark. Full CSS variables for the 4 new themes (Solarized Light/Dark, Midnight, High Contrast) injected via `gc-theme-css` style tag. Picker persists selection to `localStorage`.

### Scores
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Polish | 4/5 | 1.5 | 6.00 |
| Interaction Affordances | 4/5 | 1.0 | 4.00 |
| Accessibility | 3/5 | 1.0 | 3.00 |
| Novelty | 4/5 | 1.0 | 4.00 |
| Brand Coherence | 4/5 | 0.75 | 3.00 |
| **Weighted Average** | | | **3.81** |

### Notes
**Visual Polish (4):** Pill button (border-radius:999px), 11px swatch circle, scale+translateY entry animation, check mark SVG on active item — all polished. Minor deduction: swatch border uses hardcoded `rgba(0,0,0,0.15)` which goes nearly invisible in dark themes.

**Interaction Affordances (4):** Button correctly shows current theme name + swatch; chevron signals dropdown; click-outside-to-close works; active state is visually clear. Minor: no Up/Down arrow cycling within open menu.

**Accessibility (3):** `role="menu"` + `role="menuitemradio"` + `aria-checked` is correctly structured. `aria-haspopup`/`aria-expanded` on trigger button is correct. `aria-label` on trigger updates dynamically. Gap: ARIA menu pattern requires Up/Down arrow key navigation between `menuitemradio` items — only `Escape` and `ArrowDown` (on the button itself to open) are implemented. Navigating within the open menu by arrow key is absent.

**Novelty (4):** 6-theme picker is uncommon in admin UIs. Solarized themes add developer authenticity. `box-shadow:inset 0 0 0 1px rgba(255,255,255,0.2)` on swatches is a CSS detail that signals care.

**Brand Coherence (4):** Active state uses `--brand-primary-light`/`--text-brand` from token stack. Font sizes (12px button, 13px options) are on-scale. Rounded 7px item corners and 12px menu corners feel product-specific.

---

## Change 2 — Collapsible Sidebar (hamburger ≡, 56px icon rail)

### What was built
`#sidebar-toggle` (three 14×1.5px spans) in logo header. Click toggles `.sidebar-collapsed` class on `<html>`. CSS transitions sidebar width `220px → 56px` in `0.22s ease`. Labels, badges, section labels hidden via `display:none !important`. Icon items centered with `justify-content:center`. State persisted to `localStorage`.

### Scores
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Polish | 4/5 | 1.5 | 6.00 |
| Interaction Affordances | 4/5 | 1.0 | 4.00 |
| Accessibility | 3/5 | 1.0 | 3.00 |
| Novelty | 3/5 | 1.0 | 3.00 |
| Brand Coherence | 4/5 | 0.75 | 3.00 |
| **Weighted Average** | | | **3.62** |

### Notes
**Visual Polish (4):** Thin-bar hamburger (not blocky), smooth 0.22s ease width transition, icon centering in rail, hover state using CSS vars — all refined. The toggle button itself has clean 6px border-radius and uses `var(--bg-inset)` on hover. Minor: no matching animation for label fade-out (labels snap off vs sidebar animating).

**Interaction Affordances (4):** Collapse/expand is immediately obvious from the transition. Badge counts and section headers cleanly disappear. Footer user row hides in icon rail. `localStorage` persistence means the user's preferred state survives reloads.

**Accessibility (3):** `aria-label="Toggle sidebar"` is present, but no `aria-expanded` on the toggle button — users of screen readers cannot tell the current sidebar state. Nav icon items have `aria-label` attributes on the Lucide icons, so icons retain meaning, but there are no visible tooltips when collapsed for sighted users who've forgotten icon meanings.

**Novelty (3):** Collapsible sidebar is a standard enterprise pattern (GitHub, VSCode, Figma all use it). The custom thin-bar hamburger elevates it slightly above the generic.

**Brand Coherence (4):** 56px is the standard icon-rail width in the design system family this belongs to. CSS variables used throughout. Fits naturally.

---

## Change 3 — Logo mix-blend-mode transparency

### What was built
`.sidebar-logo-img` has `mix-blend-mode:multiply` by default (light themes). Dark themes (`dark`, `solarized-dark`, `midnight`) override with `mix-blend-mode:screen` + `filter:brightness(1.6) saturate(0.85)`. A `transition:filter 0.25s` eases the filter change on theme switch. `onerror` fallback hides broken image.

### Scores
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Polish | 4/5 | 1.5 | 6.00 |
| Interaction Affordances | 3/5 | 1.0 | 3.00 |
| Accessibility | 4/5 | 1.0 | 4.00 |
| Novelty | 4/5 | 1.0 | 4.00 |
| Brand Coherence | 4/5 | 0.75 | 3.00 |
| **Weighted Average** | | | **3.81** |

### Notes
**Visual Polish (4):** `mix-blend-mode:multiply` for white-background PNG logos is the canonical zero-asset solution. `screen` on dark backgrounds is the correct counterpart. `brightness(1.6) saturate(0.85)` is precise rather than arbitrary. `transition:filter 0.25s` is a small detail that polishes theme transitions.

**Interaction Affordances (3):** Decorative — not interactive. Score is neutral/N/A. Transition eases well on theme switch which is the only "interaction" moment.

**Accessibility (4):** `alt="GraphClaw"` on the img is correct. The CSS treatment does not affect screen reader behavior. Contrast of the logo against sidebar backgrounds for each theme should be manually verified (not verifiable without screenshots), but the approach is sound.

**Novelty (4):** `mix-blend-mode` for logo adaptation is uncommon outside CSS expert circles. Combined with `screen` + multi-filter for dark — demonstrates CSS depth beyond typical AI-generated code.

**Brand Coherence (4):** Logo adapts to all 6 theme backgrounds without requiring per-theme image variants. Brand identity (colors, shapes) is preserved.

**Risk:** If `.sidebar` has a `background-image` gradient, `multiply` on the logo will blend with it unexpectedly. `isolation:isolate` should be added to the sidebar container.

---

## Change 4 — Removed "GraphClaw" text label next to logo

### What was built
`logo()` in `nav.js` no longer renders a text span with "GraphClaw" beside the image. The logo area is now: `[img(logo.png)] [em.sidebar-logo-sub("Cockpit")]` + `[#sidebar-toggle]`.

### Scores
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Polish | 4/5 | 1.5 | 6.00 |
| Interaction Affordances | 3/5 | 1.0 | 3.00 |
| Accessibility | 4/5 | 1.0 | 4.00 |
| Novelty | 4/5 | 1.0 | 4.00 |
| Brand Coherence | 4/5 | 0.75 | 3.00 |
| **Weighted Average** | | | **3.81** |

### Notes
**Visual Polish (4):** Cleaner header — the logo image carries the brand without needing a text duplicate. Removes visual competition between product name and "Cockpit" sublabel.

**Interaction Affordances (3):** Slight reduction in first-time-user context — there's no text to confirm "this is GraphClaw." Offset by the logo itself and the `alt="GraphClaw"` attribute. In a shipping product with users who know the brand this is fine.

**Accessibility (4):** `alt="GraphClaw"` handles the screen reader case. No regression from removing visible text since alt text provides the same information.

**Novelty (4):** "Just the logo" sidebar header is a hallmark of confident premium product design (Linear, Vercel, Notion). Removing text reduces the AI-template feeling significantly.

**Brand Coherence (4):** Logo image alone is sufficient brand anchor. The "Cockpit" sublabel provides product context without redundancy.

---

## Change 5 — Italic "Cockpit" label below logo

### What was built
`<em class="sidebar-logo-sub sidebar-logo-title" style="font-size:11px;font-style:italic;color:var(--text-tertiary);white-space:nowrap;line-height:1;margin-top:1px;">Cockpit</em>` rendered inside the logo link. Hidden when sidebar collapses (`.sidebar-logo-title` class).

### Scores
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Polish | 4/5 | 1.5 | 6.00 |
| Interaction Affordances | 3/5 | 1.0 | 3.00 |
| Accessibility | 3/5 | 1.0 | 3.00 |
| Novelty | 4/5 | 1.0 | 4.00 |
| Brand Coherence | 4/5 | 0.75 | 3.00 |
| **Weighted Average** | | | **3.62** |

### Notes
**Visual Polish (4):** 11px italic in `--text-tertiary` is visually subordinate and elegant. `line-height:1` keeps it tight. Hides cleanly on collapse. A small, intentional detail that adds character.

**Interaction Affordances (3):** Purely informational, no interaction expected.

**Accessibility (3):** The `<em>` element has semantic meaning in HTML — it signals verbal emphasis ("stress emphasis") which screen readers may announce with changed intonation. Using `<em>` for a presentational italic label is a semantic misuse. Should be `<span style="font-style:italic">` for a decorative-only label.

**Novelty (4):** "Product area in italic under the logo" is an uncommon but instantly recognizable premium UI pattern. The italic tone adds personality and signals product hierarchy (brand → product area) without noise.

**Brand Coherence (4):** "Cockpit" is the correct module name and belongs in this position. `--text-tertiary` correctly subordinates it to the logo.

---

## Summary Table

| Change | VP | IA | Acc | Nov | BC | Wtd Avg |
|--------|----|----|-----|-----|----|---------|
| 1. Theme picker | 4 | 4 | 3 | 4 | 4 | **3.81** |
| 2. Collapsible sidebar | 4 | 4 | 3 | 3 | 4 | **3.62** |
| 3. Logo mix-blend-mode | 4 | 3 | 4 | 4 | 4 | **3.81** |
| 4. Removed "GraphClaw" text | 4 | 3 | 4 | 4 | 4 | **3.81** |
| 5. Italic "Cockpit" label | 4 | 3 | 3 | 4 | 4 | **3.62** |
| **Average across all** | | | | | | **3.73** |

All 5 changes **PASS** (≥ 3.5, no dimension below 2). Accessibility is the consistent weak spot at 3/5 across 3 of the 5 changes.

---

## Builder Instructions

The following numbered fixes address all identified issues. Priority order: accessibility gaps first, then visual regressions, then polish.

1. **[ACCESSIBILITY] Add `aria-expanded` to sidebar toggle button.**
   In `wireSidebarToggle()` in `theme.js`, call `btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')` inside `setCollapsed()`. Initialize it on load: if `savedCollapsed()` is true, set `aria-expanded="false"` on mount, otherwise `"true"`. Without this, screen reader users cannot determine whether the sidebar is open or closed.

2. **[ACCESSIBILITY] Add Up/Down arrow key navigation inside theme picker menu.**
   In `wirePicker()` in `theme.js`, add a `keydown` listener on `.gc-tp-menu` that handles `ArrowDown` (focus next `.gc-tp-opt`) and `ArrowUp` (focus previous `.gc-tp-opt`), wrapping around at boundaries. This is required by the ARIA `role="menu"` / `role="menuitemradio"` pattern, which mandates arrow-key navigation between items.

3. **[ACCESSIBILITY] Replace `<em>` with `<span style="font-style:italic">` for "Cockpit" label.**
   In `logo()` in `nav.js`, change:
   ```html
   <em class="sidebar-logo-sub sidebar-logo-title" style="...font-style:italic...">Cockpit</em>
   ```
   to:
   ```html
   <span class="sidebar-logo-sub sidebar-logo-title" aria-hidden="true" style="...font-style:italic...">Cockpit</span>
   ```
   `<em>` carries semantic "stress emphasis" meaning. A decorative italic sub-label should be presentational only. `aria-hidden="true"` is appropriate here since the logo's `alt="GraphClaw"` already names the product.

4. **[ACCESSIBILITY] Add `title` tooltips to collapsed sidebar nav items.**
   When `.sidebar-collapsed` is active, nav labels are hidden. Add `title="{label}"` to each `<a>` element in `mainNav()` (e.g., `title="Dashboard"`, `title="My Tasks"`) so browsers show native tooltips on hover in icon-rail mode. This is the minimum viable solution. A CSS-based tooltip (`::after` pseudoelement on `.sidebar-collapsed .nav-item[title]`) would be more stylistically consistent.

5. **[VISUAL] Fix swatch border color in dark themes.**
   In `theme.js` CSS block, `.gc-tp-swatch` uses the custom property `--btn-swatch-border` with a fallback of `rgba(0,0,0,0.15)`. This fallback renders near-invisible in dark-background swatches. Add explicit definitions:
   ```css
   /* in light/solarized-light/high-contrast themes */
   --btn-swatch-border: rgba(0,0,0,0.2);
   /* in dark/solarized-dark/midnight themes */
   --btn-swatch-border: rgba(255,255,255,0.25);
   ```
   This makes every swatch circle legible regardless of its fill color.

6. **[VISUAL] Sync picker button swatch border-color on theme change.**
   In `wirePicker()` in `theme.js`, after a theme option is clicked, `swatchEl.style.background` is updated but `swatchEl.style.borderColor` is not. The THEMES array already defines a `border` color per theme. Update the click handler to also set `swatchEl.style.borderColor = s.border` so the button's swatch ring matches the selected theme's swatch ring in the menu.

7. **[VISUAL] Add `isolation:isolate` to the sidebar element.**
   Without it, `mix-blend-mode:multiply` on `.sidebar-logo-img` will blend the logo against whatever is visually behind the sidebar (e.g., page content gradients, cards). In `theme.js` CSS block, add to the sidebar rule:
   ```css
   aside.sidebar, nav.sidebar { overflow: hidden; transition: width 0.22s ease; isolation: isolate; }
   ```
   This creates a stacking context that confines blend-mode effects to within the sidebar.

8. **[POLISH] Add label fade-out transition to match sidebar width animation.**
   Currently labels snap to `display:none` instantly while the sidebar width animates over 0.22s. This creates a visual jump. Replace the `display:none` approach for `.nav-label`, `.sidebar-logo-sub`, `.nav-badge`, `.sidebar-section-label` with `opacity:0; pointer-events:none; width:0; overflow:hidden` transitions running in sync with the 0.22s sidebar transition. This makes the collapse feel seamless.

9. **[POLISH] Verify `.nav-badge.green` and `.nav-badge.amber` contrast in Midnight Blue theme.**
   The Midnight Blue theme defines `--bg-sidebar:#0A1222`. If `nav-badge.green` uses a hardcoded light-green background and `nav-badge.amber` a yellow, those need to be checked for 3:1 contrast against `#0A1222`. If they fail, map badge bg/text to existing midnight theme state tokens (`--state-progress:#34D399` for green, `--state-delayed:#FCD34D` for amber) which were designed for this background.
