# Base44 Dev Environment

## Quick Start
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
Preview is on port 3000 (Vite dev server). Backend API is on port 8000.

## Architecture
- **Frontend**: React 19 + Vite (dev server on port 5173, mapped to host 3000). Live reload via Vite HMR.
- **Backend**: Django 6.0 + DRF + Channels (Daphne ASGI via `runserver` on port 8000). Auto-reload enabled.
- **Worker**: Celery worker (processes email + booking confirmation tasks via Redis broker).
- **Database**: PostgreSQL 16 (compose service `db`).
- **Cache/Broker**: Redis 7 (compose service `redis`, used for Django cache, Celery broker, and Channels layer).

## Environment Variables
- **Required at boot**: `SETTINGS_SECRET_KEY` (Django secret key — generated dev placeholder delivered via `/run/base44/app.env`).
- **Local infra** (set in compose `environment:`): `DATABASE_URL` (postgres), `FRONTEND_URL` (set to `*` for ALLOWED_HOSTS in dev).
- **External credentials** (placeholders in `.env.base44-defaults`, override via dashboard):
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — image storage for service listings and profile photos.
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — payment gateway for online bookings.
  - `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` — SMTP for welcome and booking confirmation emails.

## Key Dev Wiring
- Frontend connects to backend via `VITE_API_BASE_URL` (includes `/api` prefix) and `VITE_WS_BASE_URL` (for websocket notifications).
- Backend `ALLOWED_HOSTS` reads `FRONTEND_URL` env var; set to `*` in dev compose.
- `CORS_ALLOW_ALL_ORIGINS = True` in settings (already permissive).
- Migrations run as a one-shot `migrate` compose service before the server starts.

## Verification
- Backend health: `curl http://localhost:8000/api/services/` → `{"count":0,...}`
- Frontend health: `curl http://localhost:3000/` → HTML with Vite dev scripts
- All services: `docker compose -f docker-compose.base44.yml ps` → all healthy
