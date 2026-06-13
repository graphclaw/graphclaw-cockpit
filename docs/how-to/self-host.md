# Self-Host Deployment Guide

This guide is the canonical operator entrypoint for running GraphClaw Cockpit with the backend stack.

## Scope

- Cockpit is deployed as a web UI container.
- Backend services run from the backend repository stack.
- Launch model is self-host only.

## Prerequisites

- Docker Desktop (or Docker Engine) with Compose v2.
- A local checkout of both repositories:
  - `graphclaw`
  - `graphclaw-cockpit`

## Current Deployment Path (Pre-v0.1.0)

1. Start backend stack first (required because cockpit compose attaches to `docker_default` network):

```bash
cd ../graphclaw
cp docker/.env.example docker/.env
# Fill in docker/.env values before starting services
docker compose -f docker/docker-compose.yml up -d
```

2. Start cockpit stack:

```bash
cd ../graphclaw-cockpit
docker compose up -d --build
```

3. Verify:

- Cockpit UI: http://localhost:3000
- Backend API docs: http://localhost:8080/docs

## Planned Release-Pinned Path (v0.1.0)

At release cut, use tagged checkouts for both repos before running compose:

```bash
cd ../graphclaw
git checkout v0.1.0
docker compose -f docker/docker-compose.yml up -d

cd ../graphclaw-cockpit
git checkout v0.1.0
docker compose up -d --build
```

Verification checklist (to run at release cut):

1. `docker compose -f ../graphclaw/docker/docker-compose.yml ps` shows backend services healthy.
2. `docker compose ps` in cockpit repo shows cockpit healthy.
3. `http://localhost:3000` and `http://localhost:8080/docs` both load.

## Related Docs

- `docs/how-to/release.md`
- `docs/explanation/versioning.md`
- `docs/explanation/deprecations.md`
- `../testing/TESTING.md`
