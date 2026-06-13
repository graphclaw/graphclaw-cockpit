# Wireframes v2 Baseline Archive

This document archives detailed baseline and evaluation metadata for the `wireframes-v2` checkpoint.

## Baseline Checkpoint

- Baseline version tag: `v2-baseline`
- Baseline date: 2026-04-10
- Scope summary at baseline:
  - 25 pages complete
  - navigation wired
  - themes implemented
  - evaluator pass

## Baseline Assets

| Asset | Description |
|-------|-------------|
| `wireframes-v2/index.html` | Hub page with 25 pages and phase navigation |
| `wireframes-v2/pages/*.html` | Page wireframes |
| `wireframes-v2/assets/tokens.css` | Design tokens (light/dark/solarized/midnight/high-contrast) |
| `wireframes-v2/assets/components.css` | Component library |
| `wireframes-v2/assets/layout.css` | Shell, sidebar, responsive breakpoints |
| `wireframes-v2/assets/utilities.css` | Helpers, animations, scrollbar behavior |
| `wireframes-v2/assets/nav.js` | Shared sidebar injection (logo, links, settings sub-nav) |
| `wireframes-v2/assets/theme.js` | Theme picker + collapsible sidebar |
| `wireframes-v2/assets/logo.png` | GraphClaw logo asset |
| `wireframes-v2/reviews/` | Evaluator reports |

## Shared Navigation Summary

- Pages are wired via `data-page` attributes and `assets/nav.js` injection.
- Sidebar supports expanded and compact modes with persisted state.
- Theme picker includes Light, Dark, Solarized Light, Solarized Dark, Midnight Blue, and High Contrast.

## Evaluation Snapshot

- Overall: 4.03 / 5.0
- Top-scoring pages:
  - Agent Monitor (4.37)
  - Skill Marketplace (4.28)
  - Task Detail (4.25)
- UI change notes from baseline review:
  - Theme picker (3.81)
  - Logo rework (3.81)
  - Sidebar collapse behavior (3.62)
