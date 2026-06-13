# Copilot Instructions - GraphClaw Cockpit Lifecycle Guardrails

These instructions are mandatory for all future cockpit development waves, release cycles, and maintenance sessions.

## Primary Objective

Keep delivery consistent with the PR-first software lifecycle established during launch hardening:

- PR-first delivery: the pull request is the unit of record
- issues used for planning, triage, multi-PR tracking, and backlog — not required for every change
- branch-based implementation
- PR-only merge path to main
- evidence-backed closeout (in the PR, or on the linked issue when one exists)
- release discipline through automation

## Do

1. Use main as the only default integration branch.
2. Start from a tracked issue or wave item when one exists; otherwise the PR itself states scope and done criteria. Always use an issue for multi-PR work and wave/epic tracking.
3. Create short-lived branches from origin/main for all work.
4. Use Conventional Commit style in PR titles and commits.
5. Use DCO sign-off for commits (`git commit -s`).
6. Open a PR for every code, docs, CI, or config change.
7. Link each PR to its tracking issue with `Closes #NN` when one exists; always describe scope and validation in the PR body.
8. Run the cockpit quality gate before merge:
   - `npm run typecheck && npm run lint && npm run test`
9. Run `npm run test:e2e` for changes that affect end-to-end workflows or release readiness.
10. Keep launch/evidence docs synchronized with implementation changes when applicable.
11. Verify required checks are green before merge.
12. Use squash merge and delete feature branches after merge.
13. Capture validation evidence in the PR body; when a tracking issue exists, post resolution notes and links on it before closing.
14. Record explicit waiver notes when closing with accepted exceptions.
15. Use release-please and release workflows as the canonical release path.
16. Validate release artifacts after publish (GHCR image, release assets, docs links as applicable).

## Do Not

1. Do not push directly to main.
2. Do not commit directly on main for normal feature development.
3. Do not use master for new work, workflow filters, or documentation references.
4. Do not bypass PR checks unless there is a documented maintainer-approved emergency.
5. Do not merge PRs with failing required checks.
6. Do not close tracking issues without evidence, links, or explicit waiver rationale.
7. Do not create ad-hoc release tags outside release automation unless emergency procedure is documented.
8. Do not leave parent tracker issues stale after child issue state changes.

## Standard Delivery Flow

1. Confirm scope and done criteria — from the issue if one exists, otherwise stated in the PR.
2. Branch from origin/main.
3. Implement incrementally with tests.
4. Update documentation and evidence in the same change set.
5. Run local quality gate.
6. Open PR with validation notes; link the issue with `Closes #NN` when one exists.
7. Wait for required checks.
8. Merge through PR (squash), then delete branch.
9. When a tracking issue exists, add a closeout comment with links to the PR, evidence, and any waivers.
10. Close the issue only after verified completion (auto-closed by `Closes #NN` on merge).

## Release Flow Requirements

1. Release PRs are created/managed by release-please.
2. Release publication occurs through release workflows.
3. Post-release validation must include runtime and artifact checks.
4. Any release exception must be documented in issue comments and evidence docs.

## Conflict Rule

If instructions conflict across docs, apply the stricter rule that preserves:

- branch protection intent
- PR-first workflow
- test and quality gates
- evidence-backed traceability
