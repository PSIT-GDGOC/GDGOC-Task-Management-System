# Database foundation

The backend uses Express, Prisma 5, and PostgreSQL. Keep the existing `src/config`,
`src/lib`, `src/routes`, `src/services`, and `src/repositories` structure. Database
models, migrations, and seed data belong in `backend/prisma`; database integration
tests belong in `backend/tests/database`. Frontend files are outside this change.

## Local setup

Run these commands from the repository root:

```sh
npm ci
cp backend/.env.example backend/.env
# Start Docker Desktop first, or use your own local PostgreSQL installation.
docker compose up -d --wait postgres
npm run prisma:validate
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run prisma:status
npm run dev:backend
```

Do not overwrite an existing `.env`. The example URLs match the local Compose
service. If port 5432 is occupied, change both the Compose host port and the URLs.
Compose binds PostgreSQL to localhost and stores its data in a named volume.
`docker compose stop postgres` stops it while retaining data.

The committed configuration uses `SYSTEM_OWNER_EMAIL=gdgoc.psit@gmail.com` for the
club-owned bootstrap account. Use the same value in hosted environments. Omit it
only when you deliberately want to seed Tech, Media, and Content without an owner. Seeding is transactional
and repeatable: existing team customizations, profiles, memberships, and inactive
account status are preserved. An existing matching user is promoted to owner.
Changing this variable does not demote previously created owners. No demo tasks,
passwords, invitations, or sessions are seeded.

## Connection settings

- `DATABASE_URL`: application connection; use Neon's pooled URL when appropriate.
- `DIRECT_URL`: direct, non-pooler connection for Prisma migrations. Locally it is
  identical to `DATABASE_URL`.
- `TEST_DATABASE_URL`: explicit connection for database integration tests. Use a
  dedicated disposable local database and a role allowed to create/drop schemas.

Put secrets only in ignored `.env` files or hosting environment variables. Preserve
Neon's SSL parameters when copying connection URLs. Prisma CLI and seed commands
run in the backend workspace and load `backend/.env`.

## Models and invariants

| Model                 | Purpose                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| User                  | Identity, system role, profile, and account deactivation                    |
| Team / TeamMembership | Teams, unique user/team membership, and team-head flag                      |
| Task                  | Team or club scope, assignee, priority, deadline, completion, soft deletion |
| TaskSubmission        | Submission attempts, optional PR evidence, review results                   |
| TaskActivity          | Actor and task event history                                                |
| AdminInvitation       | Token hash, issuer, optional existing team, expiry, redemption              |
| Session               | PostgreSQL sessions used by `connect-pg-simple`                             |

Database constraints require normalized lowercase trimmed email addresses; team
scope with a team and club scope without one; free tasks without an assignee and
other states with one; paired deletion fields; and complete completion metadata
for Done tasks. The default task scope is `WHOLE_CLUB`, so default task creation
cannot produce a team task with no team.

A task can have at most one pending submission. Completed review records require
reviewer, outcome, and review time. Invitations permit ADMIN or PRESIDENT roles,
require a future expiry relative to creation, and pair redeemed user/time within
the validity period. Owner bootstrap is separate from invitations.

Foreign keys preserve task audit references and prevent deletion of referenced
users/teams. Use account deactivation and task soft deletion. Membership records
still cascade when an otherwise unreferenced user/team is removed.

CHECK constraints and the partial pending-submission index are handwritten SQL in
the initial migration because this Prisma schema version cannot express them.
Use **migrations**, not `prisma db push`, to install the complete foundation. Future
migrations must retain these safeguards. Indexes cover board filtering, work
history, activity timelines, invitations, and session expiry.

Users/teams authorization and the Task Board lifecycle are now implemented; see
[Users and teams](USERS_AND_TEAMS.md) and [Task Board workflow](TASK_WORKFLOW.md).
Verified Google identity, history/statistics APIs, invitation redemption concurrency,
and GitHub synchronization remain work for later phases. Database checks validate record
shape; they do not establish the caller's identity or permissions. Activity records
are protected from cascading deletion, but append-only access enforcement is not
implemented by this foundation.

## Migration workflow

The initial migration creates a fresh database schema. If connecting an existing
populated database, inspect and baseline it before applying this migration; do not
reset it or mark migrations applied without comparing its schema.

For later local schema changes:

```sh
npm run prisma:migrate -- --name describe_change
npm run prisma:generate
```

Commit schema and migration SQL together. Apply committed migrations in hosted
environments using `npm run prisma:deploy`. Never use `migrate dev` or reset on a
production database. The Render blueprint accepts external database URLs (such as
Neon), generates Prisma Client before building, and deploys migrations before
starting the server. Configure both URLs in Render; owner seeding is an explicit
one-time administrative command. No hosted database is provisioned by this code.

The server checks database access and required user/session tables before opening
its HTTP port, then disconnects clients on shutdown. Prisma migrations own the
session table; the session adapter does not create tables. Normal development and
production use PostgreSQL sessions and surface database failures. Tests outside
the database suite use an explicit memory session store.

## Verification

```sh
npm run typecheck --workspace=backend
npm run build:backend
npm run test --workspace=backend
# Set TEST_DATABASE_URL in backend/.env to a disposable PostgreSQL database first.
npm run test:database
```

The database suite creates a random `gdgoc_test_*` schema, applies committed
migrations, verifies seed idempotency, foreign keys and constraints, concurrent
claims, transaction rollback, history retention, and actual session adapter
persistence. It drops only its generated schema at the end. Missing
`TEST_DATABASE_URL` fails the suite rather than silently skipping it or using the
application database.

## Team ownership and access

Use `gdgoc.psit@gmail.com` as the project contact and bootstrap identity. Create
Neon, Render, Google OAuth, and any future Redis resources under club-controlled
accounts or organizations, and invite the maintainers through those providers.
The email setting alone does not provision these resources or grant anyone access.

All source, migrations, seed code, Compose configuration, automated checks, and
setup instructions are versioned in this repository. Localhost URLs are portable
development defaults, not shared service addresses. Each teammate can start their
own database with Compose; shared environments must use hosted connection URLs.
No application feature requires the original developer's machine or file paths.

Keep actual database credentials and OAuth secrets in the hosting providers'
environment settings and a club-controlled password manager with named access
for maintainers. Do not commit credentials or share account passwords in the repo.
Record non-secret service URLs and responsible maintainers here once provisioned.

The backend GitHub Actions workflow provisions PostgreSQL for every run and runs
schema validation, client generation, type checks, build, and both test suites. It
uses a temporary database and requires no private hosted database credentials.

For changes authored on behalf of the club, repository-local Git identity can be
configured as follows (this does not change the GitHub account used to push):

```sh
git config --local user.name "GDGOC PSIT"
git config --local user.email "gdgoc.psit@gmail.com"
```
