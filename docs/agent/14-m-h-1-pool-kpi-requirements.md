# M-H-1 Requirements - Agents Pool KPI Cards

## Requirement

Deliver Agents panel KPI cards for Wave M-H-1 on `/agent-monitor/agents`.

## Source References

- `build-plan.md` (Wave M, M-H-1)
- `docs/agent/02-wave-plan.md` (M-H section)
- `docs/agent/01-data-sources.md` (Agents: Pool KPIs)
- `docs/prd/03-agent-monitor.md` (Section 8.1)

## Functional Requirements

1. Add an Agents pool KPI strip with four cards:
   - Active runners (`X/Y`),
   - Queue depth,
   - Average duration,
   - Stale heartbeats.
2. Primary data source: `GET /app/v1/agents/pool/status`.
3. Add typed API hook in `src/lib/api-hooks.ts` for pool status payload.
4. Include resilient fallbacks where fields are absent:
   - active/total fallback from `/app/v1/agents`,
   - queue depth fallback from `/app/v1/agent/status`.
5. Stale heartbeats card should apply alert styling when stale count > 0.
6. Add stable test ids for KPI root and each card value.

## Edge Cases

- Endpoint may return null/partial object.
- Numeric fields can be missing or string-typed.
- Agents list may be empty while endpoint still unavailable.

## Verification Plan

- Component tests:
  - renders KPI values from pool status payload,
  - fallback values from agents/status hooks,
  - stale-heartbeat alert styling.
- Agent Monitor route test:
  - `/agent-monitor/agents` renders KPI strip.
- Playwright:
  - agents route renders panel and KPI section.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05

## Validation Results

- `npm test -- src/features/agent-monitor/components/AgentsPoolKpis.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx` (pass)
- `npm run typecheck` (pass)
- `npx playwright test e2e/agent/agent-monitor.spec.ts` (pass)
- `node scripts/check-test-headers.mjs --files src/features/agent-monitor/components/AgentsPoolKpis.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx e2e/agent/agent-monitor.spec.ts` (pass)
