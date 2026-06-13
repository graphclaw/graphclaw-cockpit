# Versioning Policy

GraphClaw Cockpit uses Semantic Versioning (SemVer): MAJOR.MINOR.PATCH.

## SemVer Meaning

- MAJOR: incompatible UI/API contract changes.
- MINOR: backward-compatible feature additions.
- PATCH: backward-compatible fixes.

## Pre-1.0 Note

Before 1.0, MINOR releases may include breaking changes when needed. These must be called out clearly in release notes.

## Pre-release Tags

Use pre-release tags for validation:

- X.Y.Z-alpha.N
- X.Y.Z-beta.N
- X.Y.Z-rc.N

## Artifact Version Alignment

A cockpit release tag vX.Y.Z is expected to produce:

- GHCR image: ghcr.io/graphclaw/graphclaw-cockpit:X.Y.Z
- GitHub Release: vX.Y.Z

## Backend Compatibility

Cockpit and backend versions are independent. Compatibility expectations should be documented in release notes when API contracts change.

## Support Window

The target support window is latest and previous MINOR, with security fixes prioritized for supported lines.
