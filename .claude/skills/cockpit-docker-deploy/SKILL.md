---
name: cockpit-docker-deploy
description: Docker build and deployment patterns for GraphClaw Cockpit. Use when building, debugging, or modifying Docker config.
---

# Cockpit Docker Deploy

## Architecture
- Cockpit: nginx serving React SPA on port 3000
- nginx proxies /app/v1/* and /auth/* to gateway:8000
- Backend gateway: FastAPI/uvicorn on port 8000
- Infra: Postgres+AGE (:5432), Redis (:6379), MinIO (:9000)

## Build
```bash
docker compose build cockpit    # Build frontend only
docker compose up -d            # Start full stack
docker compose logs cockpit -f  # Watch frontend logs
```

## E2E Testing
```bash
docker compose --profile test run --rm e2e
```

## Debugging
- Cockpit health: http://localhost:3000/health
- Backend health: http://localhost:8000/health
- Backend API docs: http://localhost:8000/docs
- MinIO console: http://localhost:9001

## Environment
- `VITE_API_URL`: empty string for Docker (nginx proxies)
- `VITE_API_URL=http://localhost:8000` for local dev
