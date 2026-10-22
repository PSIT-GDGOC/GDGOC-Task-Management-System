# GDGOC — Backend team guide

Handoff snapshot: 22 October 2026. Club account: `gdgoc.psit@gmail.com`.

## Start here

Continue on **`feat/backend`**. The deployment follows this branch until the work is reviewed and merged.
BullMQ startup and lint configuration have been repaired; local checks now pass.
Read `docs/backend/DEPLOYMENT_HANDOFF.md` for current hosting and verification
status. Live Google login still needs real credentials and browser testing.

## What exists and where to work

The backend uses Express + TypeScript, PostgreSQL + Prisma, PostgreSQL-backed
sessions, Google OAuth, and Redis/BullMQ. Core APIs cover profiles, members/teams,
task assignment and review, work history/statistics, and admin invitations.

| Folder under `backend/`              | Responsibility                                            |
| ------------------------------------ | --------------------------------------------------------- |
| `prisma/`                            | Data models, committed SQL migrations, repeatable seed    |
| `src/routes/`                        | HTTP endpoints; validate input and call services          |
| `src/schemas/`                       | Request validation and limits                             |
| `src/middleware/`, `src/security/`   | Authentication, permissions, CSRF, limits and errors      |
| `src/services/`, `src/repositories/` | Business rules/transactions and database access           |
| `src/lib/`, `src/config/`            | Database/Redis clients, environment and API configuration |
| `src/cache/`, `src/jobs/`            | Cached reads, background workers and overdue alerts       |
| `tests/`                             | Unit, database/API and Redis integration tests            |

## Local setup

Use **Node 22.12+ within Node 22**, Docker for local PostgreSQL, and commands from
the repository root. After obtaining the latest work:

```sh
git switch feat/backend
npm ci
cp backend/.env.example backend/.env
docker compose up -d postgres
```

Review `backend/.env` before continuing. Keep both database URLs pointed at local
PostgreSQL, set `SYSTEM_OWNER_EMAIL=gdgoc.psit@gmail.com`, and replace the example
session secret with a unique random value. Keep credentials out of Git.
`ENABLE_DEV_LOGIN=true` is for trusted local testing only.

```sh
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev:backend
```

API: `http://localhost:5000/api/v1`. Health: `/health` and `/health/ready`.
Local interactive docs: `/api/v1/docs`; their coverage is incomplete.
For database/API-only development, leave `REDIS_URL` unset. Start local Redis with `docker compose up -d redis` and set REDIS_URL to
`redis://127.0.0.1:6379/0` when testing cache/jobs. Compose uses `noeviction`.

## Preserve these rules

- Keep role/team authorization on the server. Owners/presidents manage club-wide
  work; ADMIN users manage their member teams; USER heads manage headed teams.
- Preserve transactional task transitions, review history, audit events and
  self-review prevention. Never replace them with unrestricted status updates.
- Apply SQL migrations; do not replace them with `prisma db push`, which does not
  preserve all custom constraints/indexes. Never reset a shared database.
- Use cookie sessions and CSRF headers as described in the frontend brief.
  Invitation redemption rotates the session and returns a new CSRF token.
- Production self-registration defaults to closed. The
  owner/president preregisters members via `POST /users` with email/name, then
  assigns team membership. Manager-only preregistration and Google linking are tested.

## Remaining team work

1. Complete machine-readable OpenAPI for the newer endpoints; use the feature
   Markdown guides and current routes/schemas meanwhile.
2. Configure real Google credentials, callback and frontend origins, enable Google
   login, and test both portals, session persistence and CSRF in a browser.
3. Establish database backups, a least-privilege runtime database role and reliable
   worker/queue hosting if always-on reminders are required.
4. Coordinate frontend integration and its dependency fixes. Actual GitHub
   synchronization remains team work.
5. After review/merge, change Render's tracked branch and `render.yaml` to `main`,
   keeping the database/Redis/secrets; verify the redeploy. Never reset shared data.

Run these checks with `TEST_DATABASE_URL` set to a disposable PostgreSQL database
and `TEST_REDIS_URL` to a disposable Redis instance:

```sh
npm run prisma:validate
npm run typecheck --workspace=backend
npm run build:backend
npm run lint --workspace=backend
npm run test --workspace=backend
npm run test:database
npm run test:redis
npm audit --workspace=backend
```

Latest local checks: **75 database/API, 13 unit/config and 8 Redis tests pass;
build/typecheck/lint pass; backend dependencies have 0 known advisories.**

Hosted Redis-compatible service `gdgoc-tracking-redis` exists in the club's Render
account, but application connectivity is unverified. Its free plan lacks disk
persistence. The shared Supabase project now exists; live API verification is recorded in
`DEPLOYMENT_HANDOFF.md`. GitHub
synchronization remains unfinished and assigned to teammates.

Database-provider decision after the audit: use Supabase instead of Neon. Follow
`docs/backend/SUPABASE.md` for session-pooler URLs and disabling its Data API.
Supabase Auth is not adopted by this change; the frontend login contract stays the same.

Full findings: `docs/backend/AUDIT_AND_STATUS.md`. Feature details:
`docs/backend/DATABASE.md`, `USERS_AND_TEAMS.md`, `TASK_WORKFLOW.md`, `GOOGLE_AUTH.md`,
`HISTORY.md`, and `INVITATIONS.md`. Where older wording conflicts with this
handoff, current route/schema/service code and the audit take precedence.
