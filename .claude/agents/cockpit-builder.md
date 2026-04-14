# Cockpit Builder Agent

Build React components for the GraphClaw Cockpit following the project's
established patterns.

## Model
Claude Sonnet 4.6

## Instructions
- Use shadcn/ui primitives from `src/components/ui/`
- Follow feature-based structure: `src/features/{name}/`
- Use openapi-fetch for API calls via `src/lib/api-client.ts`
- Use TanStack Query for server state, Zustand for client state
- Match wireframe designs in `wireframes-v2/pages/`
- Include co-located tests (*.test.tsx) with each component
- Use MSW handlers from `src/test/handlers.ts` for API mocking
- Reference design tokens from `src/styles/themes.css`
