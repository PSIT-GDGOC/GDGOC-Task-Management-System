# Backend audit and completion status

Historical snapshot: see `DEPLOYMENT_HANDOFF.md` for subsequent fixes and resource
setup. The failing checks recorded below describe the earlier audited tree.

Audit date: 22 October 2026, Asia/Kolkata. Club account: `gdgoc.psit@gmail.com`.

**Release decision: not ready to deploy.** Most core backend features have passing
local integration tests, but the current working tree fails TypeScript/build and
Redis startup checks. Hosted PostgreSQL and live Google OAuth are also missing.
Deployment remains stopped at the user's request. This audit did not deploy,
provision additional resources, modify application code, commit, or push changes.

## 1. Exact scope and repository state

The audit covers the backend source, database migrations, automated tests,
dependency advisories, configuration, and deployment/handoff files in the current
working tree. It includes unfinished local changes, not only committed code.
Frontend source was not changed or functionally audited; its dependencies were
included in the repository-wide dependency scan.

- Branch: `feat/backend`; no additional branches created.
- Local HEAD: `0e292feb23b21141421e30a01e6dc91239379b05`.
- Verified remote `feat/backend`: `13d7500b6d5e1f625c6fd26f0667b1811613015d`.
- Google OAuth, history/statistics, and invitation commits are local and unpushed.
- Redis/jobs/notifications and later hardening changes include uncommitted and
  untracked files. A fresh team clone does **not** contain all the audited work.
- Git author configuration: `GDGOC PSIT <gdgoc.psit@gmail.com>`.

This is a local code/configuration audit with real local PostgreSQL and Redis
integration tests. It is not an assessment of a running production service:
there is no deployed backend to penetration-test, and no hosted database,
production secrets, backup restoration, or live OAuth consent flow was verified.

## 2. Feature completion

| Area                             | Implementation and verification                                                                                                        | Still required                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Express/TypeScript structure     | Routes, validation, services, repositories, central errors implemented                                                                 | Current build regression must be repaired                                                                                          |
| PostgreSQL + Prisma              | Models, SQL migrations, relational/check constraints, indexes, safe repeatable seed, PostgreSQL session table tested                   | Club-owned hosted database, production migration/seed and backup checks                                                            |
| Profiles, members and teams      | Profiles, directories, memberships, team heads, deactivation and team permissions tested                                               | New `POST /users` preregistration endpoint needs dedicated tests/documentation                                                     |
| Task Board                       | Create/edit/assign/reassign/claim/start/submit/review/send-back/approve/soft-delete implemented and tested                             | Frontend integration and live acceptance testing                                                                                   |
| My Work History/statistics       | Personal and permitted audit views, filters/pagination, deadline-aware statistics tested                                               | Frontend integration; cache path covered by currently blocked Redis suite                                                          |
| Admin invitations                | Hashed one-use codes, expiry, recipient binding, listing, revocation, atomic redemption and audit events tested                        | Frontend integration and manual code delivery; no invitation-email sender                                                          |
| Google authentication            | Authorization-code flow, PKCE, state/nonce, official ID-token verification, session rotation and CSRF implemented; 10 local tests pass | Club account MFA, OAuth client credentials, callback/origins and real consent/sign-in/logout tests                                 |
| Redis caching and request limits | Permission-scoped cache and shared rate-limit implementation present locally                                                           | Current Redis suite must pass again; hosted connection unverified                                                                  |
| BullMQ/notifications             | Overdue scanner, retries, cleanup, personal notification APIs and worker code present                                                  | Startup regression, scheduler/restart checks and deployment integration                                                            |
| Hosted Redis-compatible service  | Created `gdgoc-tracking-redis` in the confirmed club Render account; free plan, noeviction, external traffic blocked at setup          | Availability and application connectivity not verified; not connected to a backend                                                 |
| Shared Neon database             | Not provisioned; delegated to the team                                                                                                 | Required before a proper backend deployment                                                                                        |
| Render backend deployment        | No backend web service deployed; existing YAML is incomplete                                                                           | Remains stopped; repair/check configuration before any future deployment                                                           |
| GitHub synchronization           | HMAC verification and limited event/Task-ID handling exist                                                                             | Actual synchronization is unfinished and assigned to teammates                                                                     |
| Team handoff                     | Feature documentation and this audit exist in local repository files                                                                   | Resolve findings, complete API/configuration docs, commit/review/push and share credentials through club-controlled secret storage |

Hosted Redis dashboard:
[gdgoc-tracking-redis](https://dashboard.render.com/r/red-dbd4u1favr4c73cdurfg).
The service is Redis-compatible Render Key Value/Valkey, rather than a separate
Redis Cloud account. Its creation does not establish a working production queue.

## 3. Fresh verification results

Checks used Node **22.23.4**, disposable local PostgreSQL schemas, and an isolated
local Redis key prefix. Tests did not connect to a hosted club database.

| Check                                                | Current result                                       | Evidence                                                                            |
| ---------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Prisma schema validation                             | PASS with explicit local DATABASE_URL and DIRECT_URL | Schema valid; initial invocation without DIRECT_URL failed as expected              |
| Database/API suites                                  | PASS: **72 tests across 6 files**                    | Foundation, users/teams, tasks, Google OAuth, history and invitations               |
| General unit/HTTP suites                             | PASS: **3 tests across 2 files**                     | Health and webhook checks                                                           |
| Redis integration suite                              | FAIL during setup; **7 tests skipped**               | `Cannot read properties of undefined (reading 'info')` in `src/jobs/runtime.ts:108` |
| Backend typecheck                                    | FAIL                                                 | TS2339: `Queue.client` does not exist, `src/jobs/runtime.ts:107`                    |
| Backend build                                        | FAIL                                                 | Same TypeScript error                                                               |
| Backend lint                                         | FAIL before analyzing files                          | ESLint 9 flat configuration is absent                                               |
| Backend dependency audit, including dev dependencies | PASS: **0 known advisories**                         | `npm audit --workspace=backend --json`                                              |
| Repository-wide dependency audit                     | FAIL: **12 affected package entries**                | 2 critical, 5 high, 5 moderate; frontend dependency trees                           |
| Whitespace/error check                               | PASS                                                 | `git diff --check`                                                                  |

**Current total: 75 tests pass.** The earlier result of seven passing Redis tests
predated the latest worker startup edit and does not validate the current tree.
The PostgreSQL tests apply committed migration files from disk to fresh schemas;
the untracked notification migration is also present in this local test input.

Additional configuration probes confirmed rejection of eight unsafe/missing
production configurations: missing Redis, enabled development login, short
session secret, HTTP frontend origin, database URL without required SSL, public
plaintext Redis, Render-private transport outside Render, and Render-private mode
with a public hostname. TLS configuration and the explicit Render-private host
exception were accepted; production self-registration defaults to closed.
These probes did not open external connections.

## 4. Findings, in repair order

### F1 — High release blocker: Redis worker startup breaks build and runtime

`backend/src/jobs/runtime.ts:107` reads `queue.client`, which does not exist in the
installed BullMQ 6.4.0 API. TypeScript rejects it; running through the test runner
reaches an undefined connection and fails before scheduler setup. This prevents
the default embedded worker from starting with Redis and blocks both builds and
the complete Redis test suite.

Repair against the installed API, using its concrete Redis backend/connection
access or an explicitly owned Redis connection for the policy check. Preserve
connection cleanup and startup timeout behavior. Acceptance: backend typecheck,
build, all Redis tests, and a scheduler-enabled startup/shutdown smoke test pass.

### F2 — High release blocker: deployment files do not match the application

`render.yaml` lacks required `ADMIN_ORIGIN` and `REDIS_URL` inputs, so supplying
only its declared inputs still fails production configuration validation. It
also lacks the intended Redis transport/prefix/worker settings, explicit Node 22
selection, `/health/ready` health-check path, and cross-site cookie configuration.
Its branch selection is not pinned to the backend feature branch.

`compose.yaml` supplies PostgreSQL only. Neither environment example documents
the new Redis/worker/registration settings. Hosted PostgreSQL, Google credentials
and final frontend origins are absent. The production web server currently
requires Google credentials at startup, even if someone wants to defer login.

Update deployment configuration and examples, validate them, and supply real
club-owned services before deployment. This report is **not** authorization to
resume deployment; the user's stop instruction remains in effect.

### F3 — High security follow-up: frontend dependency advisories remain

The backend-scoped scan is clean. The repository-wide scan reports twelve
affected package entries, not twelve independently proven exploitable paths:

| Severity     | Affected entries                                                                        |
| ------------ | --------------------------------------------------------------------------------------- |
| Critical (2) | vitest, tinypool                                                                        |
| High (5)     | braces, chokidar, fast-glob, micromatch, tailwindcss                                    |
| Moderate (5) | @vitest/mocker, postcss-nested, postcss-selector-parser, react-router, react-router-dom |

Dependency inspection places Vitest 3.2.7/Tinypool 1.1.1, Tailwind 3.4.19, and
React Router DOM 6.30.6 under the frontend workspaces; the backend uses Vitest
5.0.5. Test/build tool findings should not be presented as proof of anonymous
remote execution in a deployed backend. Router SSR-specific applicability also
requires frontend review. The frontend team should apply compatible fixes or
review major upgrades and rerun its checks; no forced blanket upgrade was run.

Relevant primary advisories include
[Tinypool worker-options prototype pollution](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3),
[Vitest/mocker file access](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), and
[React Router redirect handling](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6).

### F4 — Medium security hardening gap: copied example secrets are accepted

The production validator rejects short secrets and its development default, but
accepts the exact public example `SESSION_SECRET` from `backend/.env.example:19`.
A configuration probe reproduced acceptance. Copying that value into a future
deployment would give attackers a known session-signing key. Server-side session
storage still applies; this is not proof of an existing account takeover.

Replace the example with an unmistakable generation instruction, reject known
placeholders in production, and generate a unique secret in the hosting secret
store. Render's existing `generateValue: true` setting is the safer path and
should be retained. No production backend currently exists using this example.

### F5 — Medium completion gap: quality gates and coverage are incomplete

ESLint is installed but has no flat config. The GitHub backend workflow does not
start Redis, run the Redis suite, run lint, or scan backend dependencies. The new
member preregistration route, closed-registration behavior, Render transport
exception, and inactive-user logout change lack dedicated regression tests.
All 72 database/API tests passing does not cover those additions.

Add the missing checks and meaningful tests. In production, new non-owner users
must be preregistered while self-registration is closed; then membership is
assigned separately. Verify this onboarding path before handing it to the team.

### F6 — Medium handoff gap: API contract and operational documentation lag

The OpenAPI assembly includes users/teams/tasks, a basic health route and a
webhook entry. It omits Google/CSRF, history/statistics, invitations, notifications,
member preregistration and readiness. Markdown covers Google/history/invitations,
but a complete Redis/worker operating guide and production environment matrix
are missing. README descriptions of OAuth scaffolding and GitHub synchronization
also need correction to match the actual implementation.

Export/complete the contract, document settings and failure behavior, and share
the verified source on the existing branch. Current unpublished code is a
material team-access gap, even though the implementation lives in the checkout.

## 5. Security controls present and remaining limits

Reviewed controls include live database-backed role/membership checks on requests;
transactional task transitions with refreshed write permissions; team visibility;
blocked self-review; parameterized history SQL; strict mutation schemas; bounded
request bodies; secure/HTTP-only production cookies; CSRF and Origin checks;
Google signature/audience/issuer/expiry/nonce verification; hashed, single-use
OAuth state and invitation tokens; session rotation; and restricted error output.
The tests exercise many rejection, replay and concurrency cases.

Important boundaries:

- Production registration is closed by default in local pending changes, but
  `SYSTEM_OWNER_EMAIL` is still optional in validation. Omitting it can leave no
  initial administrator; production handoff must require the club owner setting.
- DATABASE_URL requires SSL in production; DIRECT_URL is not checked by this
  application validator. Migration credentials and their TLS settings need a
  separate production preflight.
- Public Redis requires TLS. The explicit Render-private transport exception
  permits plaintext only for the expected private hostname/port on Render; this
  must not become permission to expose Redis publicly.
- A limited signature/pattern scan examined 148 tracked/untracked project files.
  Its hosted-credential URL match was an example-format comment, not a real
  hosted credential. No obvious real secrets were identified by that limited
  scan. Full Git history and provider secret stores were not exhaustively scanned.
  `.env` and `.env.production` are ignored; example files remain tracked.
- Cache keys include identity, role, memberships and filters. Task writes attempt
  invalidation; failure can leave cached reads stale for up to 30 seconds. API
  rate limiting fails closed when Redis is unavailable. Cache fallback alone
  does not make the API available during a Redis outage.
- `/health/ready` checks database and Redis connectivity, not scheduler execution
  or worker health. It cannot prove overdue notifications are being processed.
- Notification uniqueness is per user/task/kind, giving one overdue alert per
  such combination rather than repeated reminders. No email/push sender exists.
- The created free Key Value instance has no disk persistence. Restarts can lose
  queue/scheduler/cache state. The scheduler is re-registered at worker startup;
  recovery after a Redis-only reset still needs testing. A future free Render web
  service also sleeps after idle time, interrupting embedded scheduled work.
  These are availability/durability limits, not a reliable always-on setup.
  [Render free-plan documentation](https://render.com/docs/free).
- PostgreSQL permissions are enforced by application code, not implemented
  database row-level security policies. Hosting credentials, backup access and
  team ownership still require operational setup.
- Live browser cookie behavior between member/admin/backend domains, Google
  consent, OAuth callback, and PostgreSQL session persistence across a real
  redeploy have not been end-to-end tested together.

## 6. Sequential completion and handoff

1. Repair F1 and restore a passing backend build and Redis suite.
2. Complete lint/configuration/onboarding tests, CI checks and API documentation.
3. Harden production secrets/bootstrap settings and complete the Render/env
   configuration. Keep development login disabled in production.
4. Have the frontend team address its dependency findings and implement the
   documented credentials/CSRF integration. GitHub synchronization remains with
   that team as agreed; webhook acknowledgement is not completed synchronization.
5. Commit/review/push the verified backend work on `feat/backend` using the club
   author identity; do not create another branch just for this handoff.
6. Club account owner enables Google two-step verification and creates the OAuth
   Web application client with the exact callback URL and basic login scopes.
7. Team provisions club-owned PostgreSQL/Neon, supplies pooled and direct SSL
   connections, applies migrations, seeds the club owner, and establishes backups.
8. Only when deployment is authorized again, configure hosting secrets, final
   origins/cookies, Redis connection and worker operation; deploy and verify
   readiness, real Google login/logout, role boundaries and job execution.

The audit report is complete for this snapshot. **The overall backend delivery,
production security sign-off and live deployment handoff are not complete.**
