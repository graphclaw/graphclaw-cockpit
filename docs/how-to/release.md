# Release Process (Maintainers)

This guide defines the cockpit release flow for graphclaw-cockpit.

## Prerequisites

- You have maintainer write access to graphclaw/graphclaw-cockpit.
- Branch protection checks on main are green.
- PR title and commits follow Conventional Commits + DCO.
- Local quality gate passes:
  - npm run typecheck
  - npm run lint
  - npm run test

## Standard Release Flow

1. Merge the release-please pull request on main.
2. Confirm release-please creates the release tag (vX.Y.Z).
3. The release workflow (release.yml) runs automatically on tag push.
4. Verify release jobs succeed:
  - Build and push Docker image
  - Attach release assets (when configured)
5. Verify artifacts:
  - GHCR: ghcr.io/graphclaw/graphclaw-cockpit
  - GitHub Release includes expected release notes and build artifacts.

## Required Post-Release Checks

- docker pull ghcr.io/graphclaw/graphclaw-cockpit:X.Y.Z succeeds.
- docker pull ghcr.io/graphclaw/graphclaw-cockpit:latest succeeds.
- Backend compatibility is validated for the target deployment matrix.

## Failure Handling

- GHCR push/transient signing failure: rerun failed jobs.
- Tag/version mismatch: correct with a new release tag.
- Do not publish cockpit as npm package in launch scope.

## Notes

- Cockpit release path is container-focused for launch.
- Keep workflow changes small and traceable.
