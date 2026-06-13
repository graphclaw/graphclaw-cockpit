# Deprecation Policy

This policy defines how GraphClaw Cockpit deprecates UI behavior, routes, and client-side API usage.

## Baseline Rule

A deprecated surface remains supported for at least one full MINOR release window before removal.

## Deprecation Lifecycle

1. Announce
- Mark deprecation in docs and release notes.
- Provide replacement guidance.

2. Warning Period
- Keep compatibility during the warning window.
- Surface warnings where practical (UI hints, logs, docs).

3. Removal
- Remove after the published deprecation window.
- Document removal and migration impact.

## Required Documentation

Every deprecation entry must include:

- Deprecated surface.
- Reason.
- Replacement.
- Earliest removal release.

## Emergency Exceptions

Security, privacy, or compliance risks may require faster removal. When this happens, document the exception and provide immediate mitigation guidance.
