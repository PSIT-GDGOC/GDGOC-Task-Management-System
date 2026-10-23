# Backend deployment verification — 23 October 2026

**Backend hosting is live and verified. Full application acceptance is pending
Google OAuth and frontend integration.** No frontend source was changed.

## Deployed resources

- API: `https://gdgoc-tracking-backend.onrender.com/api/v1`
- [Readiness](https://gdgoc-tracking-backend.onrender.com/health/ready)
- [Render service](https://dashboard.render.com/web/srv-dbdcd6jncjis739n3bj0)
- [Verified code deployment](https://dashboard.render.com/web/srv-dbdcd6jncjis739n3bj0/deploys/dep-dbdhfr6417fc738k6gd0):
  `3dc29d1934d320b06701f333c94bd8caba2f957a`, branch `feat/backend`.
- [Club Supabase project](https://supabase.com/dashboard/project/vbxvyrbombsjqkuuymng)
- [Render Key Value](https://dashboard.render.com/r/red-dbd4u1favr4c73cdurfg)

Credentials remain in the hosting accounts, not in this report or Git. Resources
use the club-controlled accounts. Render continues tracking `feat/backend` until
the team explicitly switches it to `main` after merging.

## Local verification

**99 tests passed:** 75 PostgreSQL/API tests, 16 unit/config tests and 8 Redis/BullMQ
integration tests. Typecheck, ESLint and production build passed. Backend dependency
scan reported zero known advisories. Tests used isolated local schemas and Redis
namespaces, not the shared club database.

Coverage includes task transitions/concurrent claims, role/team boundaries,
history/statistics, invitation recipient/expiry/reuse rules, Google callback state
and identity verification, cache separation, job retries, scheduler registration
after restart and persistent session creation/read/deletion. Google protocol tests
use fixtures; they do not establish that club Google Cloud setup is complete.

## Hosted checks

All **14 HTTP probes** passed against the deployed service:

| Check | Observed result |
| --- | --- |
| `/health` | 200 |
| `/health/ready` | 200; database and Redis connected; session store query succeeds |
| Unauthenticated `/auth/me`, `/tasks`, `/users`, `/teams`, `/history/me`, `/notifications`, `/auth/invitations` | 401 for all seven |
| Google entry, explicitly disabled | 503 |
| Development login in production | 403 |
| `/auth/csrf` | 200; anonymous session persisted |
| Logout from an untrusted origin | 403; no allowing CORS header |
| Logout from the configured origin using that session | 200; probe session destroyed |

Session cookie attributes: `Secure; HttpOnly; SameSite=None`. HSTS was present and
`X-Powered-By` absent. No production users or tasks were created by these probes.

Supabase read-only checks confirmed four completed migrations, zero unfinished
migrations, 12 public tables, RLS enabled on all 12, one club SYSTEM_OWNER and the
three core teams. Data API is disabled. Security Advisor showed zero errors and
zero warnings, plus 12 informational "RLS Enabled No Policy" entries. With no
policies, unprivileged roles have no row access; authorization for Express requests
is enforced by the backend. The owner database credential bypasses RLS and must
remain server-only.

Live testing exposed a session TLS failure (`SELF_SIGNED_CERT_IN_CHAIN`) despite a
working Prisma connection. The official Supabase public CA is now committed in
`backend/certs/`; the session driver keeps certificate and hostname verification
enabled. Startup/readiness now query the session store too. The live session
probes above passed after this fix. See the provider's
[connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres)
and [node-postgres SSL configuration](https://node-postgres.com/features/ssl).

## Outstanding acceptance and operational work

1. Configure real club Google Cloud credentials, exact callback and frontend
   origins. Enable Google, then test real browser sign-in, both portals, session
   persistence, authenticated CSRF and logout. Production dev login stays disabled.
2. Frontend integration remains team work. Read-only source review found missing
   CSRF handling in both API clients, sample data in Members & Teams and member
   My Work History, sample initial invitations, missing `portal=admin` in admin
   Google login, and development-login controls without a production exclusion.
   These are not completed browser acceptance tests.
3. Frontend workspace dependency audit flagged 12 affected packages: 2 critical,
   5 high and 5 moderate. The critical findings concern development/test tooling
   (Vitest/tinypool). Audit severity alone does not prove production exploitability;
   the frontend team still needs to update and validate these dependencies.
4. Actual GitHub synchronization and ownership verification remain with the team.
   Machine-readable OpenAPI coverage also needs completion for the newer APIs.
5. Establish a least-privilege runtime database role, backup/restore procedure and
   production monitoring before storing sensitive operational data. Database access
   is password-protected and encrypted by the application; provider-level IP
   restrictions and forced SSL were not enabled in this setup.
6. Render Free sleeps while idle, pausing the embedded worker. Free Key Value has
   no disk persistence. Scheduler startup succeeded, and local tests exercised
   job processing/retries; no real member reminder delivery was claimed. Reliable
   always-on reminders require an always-running worker and persistent queue.

Deploy success and these probes establish backend infrastructure readiness. They
do not mean every frontend screen, live identity flow or external integration is
finished, nor do they constitute a guarantee that no vulnerabilities exist.
