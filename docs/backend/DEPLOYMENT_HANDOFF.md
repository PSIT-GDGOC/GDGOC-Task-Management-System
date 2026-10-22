# Deployment follow-up and operations

This document supersedes the release-blocker status in the earlier
`AUDIT_AND_STATUS.md` snapshot. The original audit is retained as history.

## Verified locally

- Fixed the BullMQ 6 connection API used by the worker policy check.
- Typecheck, build and ESLint pass. Tests pass: 75 database/API, 13 unit/config,
  and 8 Redis integration tests, including scheduler registration across restarts.
- Backend dependency scan reports zero known advisories. Frontend dependency
  findings in the earlier audit remain assigned to the frontend team.
- Production rejects known example session secrets, requires the owner setting
  and migration URL, checks SSL for application/migration URLs, disables local
  role-switching, and closes self-registration by default.
- CI now includes Redis, lint and backend dependency checks. Local Compose also
  offers Redis with persistence and noeviction.

## Club resources

- Supabase organization: GDGOC PSIT, confirmed account `gdgoc.psit@gmail.com`.
- Project: [gdgoc-tracking-system](https://supabase.com/dashboard/project/vbxvyrbombsjqkuuymng),
  West US/North California. The dashboard reports Healthy. Data API is disabled.
- Session pooler host: `aws-0-us-west-1.pooler.supabase.com`, port 5432,
  database `postgres`, username `postgres.vbxvyrbombsjqkuuymng`.
- Render Key Value: [gdgoc-tracking-redis](https://dashboard.render.com/r/red-dbd4u1favr4c73cdurfg),
  Oregon. The dashboard reports Available. Free plan, noeviction, no disk
  persistence; external access is blocked. Its private URL stays within Render.
- Render backend creation is prepared as `gdgoc-tracking-backend`, Node 22.23.4,
  free compute, Oregon, branch `feat/backend`, health path `/health/ready`.
  Until a deploy has been verified, this is configuration work, not a live API.

Real database passwords, database URLs containing passwords and session secrets
belong only in the hosting environment/club password manager, never in Git or
frontend environment variables. The initial connection uses the project's owner
database credential; a separate least-privilege runtime role is a follow-up before
handling sensitive production data.

## Initial deployment contract

Render builds only the backend workspace and generates Prisma Client. Before
opening its HTTP port, startup validates configuration, applies committed Prisma
migrations, seeds the core teams/club owner idempotently, and checks database and
Redis access. A seed does not create an authenticated session.

Set `DATABASE_URL` and `DIRECT_URL` to the Supabase **session pooler** URI, with
the real password percent-encoded and `?schema=public&sslmode=require` appended.
Use port 5432 rather than the transaction pooler. Generate a unique SESSION_SECRET
in Render. `SYSTEM_OWNER_EMAIL` is `gdgoc.psit@gmail.com`.

Google Cloud setup is unfinished, so the initial deployment explicitly sets
`GOOGLE_AUTH_ENABLED=false`. Google entry routes return 503; protected APIs still
require authentication and return 401 without a valid session. Development login
stays disabled. This deploy can verify infrastructure but cannot offer member
sign-in until OAuth is configured.

When Google is disabled and frontend URLs have not been assigned, a Render web
service defaults its allowed origins to its own `RENDER_EXTERNAL_URL`. It does
not allow arbitrary origins. Before enabling Google, explicitly set CLIENT_ORIGIN,
ADMIN_ORIGIN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and the exact HTTPS
GOOGLE_CALLBACK_URL, then set GOOGLE_AUTH_ENABLED=true. Test browser login,
session persistence, CSRF, both portals and logout afterward.

## Branch and migration workflow

The deployment follows `feat/backend` while its changes are unmerged. Deploying
the older `main` now would omit these features. After review/merge, change the
Render service's tracked branch **and** the `branch` field in `render.yaml` to
`main`, then redeploy and verify. Keep the same database, Redis and secret values.
Never reset the shared database. Migrations remain forward-only; an older code
rollback must be checked for compatibility with already-applied schema changes.

## Live acceptance and remaining limits

Verify the deployed commit, successful migration/seed logs, `/health/ready` 200,
unauthenticated protected requests 401, disabled dev login 403, disabled Google
503, and scheduler operation. Inspect Supabase table RLS/grants and advisors after
migrations. Test application sessions and role boundaries once OAuth is enabled.

Free Render web compute sleeps when idle; its embedded worker then stops too.
Free Key Value can lose queue/scheduler state after restart. PostgreSQL remains
the source of truth for tasks and notifications. Reliable always-on reminders
require persistent queue storage and an always-running worker; neither a paid
plan nor an external keep-alive workaround has been enabled automatically.

Machine-readable OpenAPI coverage still lags the newer APIs; the feature Markdown
guides and current routes/schemas give their exact contracts. Actual GitHub
synchronization and frontend integration remain with the team.
