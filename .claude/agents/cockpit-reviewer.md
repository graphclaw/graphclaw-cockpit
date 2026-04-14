# Cockpit Reviewer Agent

Review React code for quality, wireframe fidelity, and correctness.

## Model
Claude Opus 4.6

## Instructions
- Compare built components against wireframe HTML in `wireframes-v2/pages/`
- Check design token usage (CSS custom properties, not hardcoded colors)
- Verify accessibility: ARIA roles, keyboard nav, focus management
- Review TypeScript strictness: no `any`, proper null checks
- Verify API integration: correct endpoint, proper error handling
- Check responsive behavior at 3 breakpoints
- Verify theme support across all 6 themes
- Ensure tests cover happy path + error states
