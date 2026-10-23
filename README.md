# GDGOC Task Management System

Task management for the PSIT GDGOC club, with separate member and admin portals.
Members claim tasks, submit work for review, and track their contributions.
Administrators manage tasks, teams, memberships, and invitations.

## Project status

The backend is deployed on Render with Supabase PostgreSQL and Render Key Value
(Redis-compatible). Backend changes are merged into `main`, which Render tracks
for automatic deployment.

The application still requires frontend integration and live Google sign-in setup.
Google authentication is implemented in the backend but disabled in production
until club OAuth credentials and frontend URLs are configured. GitHub task
synchronization is also pending.

See the [deployment handoff](docs/backend/DEPLOYMENT_HANDOFF.md) for operational
settings and the [23 October 2026 verification report](docs/backend/VERIFICATION_2026-10-23.md)
for completed checks and outstanding issues.

## Stack

| Component                   | Technology                                      |
| --------------------------- | ----------------------------------------------- |
| Member and admin portals    | React 18, Vite, TypeScript, Tailwind CSS        |
| Board data and interactions | TanStack Query, dnd-kit                         |
| API                         | Express, TypeScript, Zod                        |
| Database                    | PostgreSQL, Prisma                              |
| Authentication              | Google OAuth, PostgreSQL-backed cookie sessions |
| Cache and background jobs   | Redis, BullMQ                                   |
| Tests                       | Vitest, Supertest                               |
| Workspace management        | npm workspaces                                  |

## Repository structure

```text
backend/
  prisma/           Database schema, migrations, and seed data
  src/
    routes/         HTTP endpoints
    schemas/        Request validation
    middleware/     Authentication, request handling, and errors
    security/       Access control and request protection
    services/       Business rules and transactions
    repositories/   Database access
    config/         Environment and application configuration
    lib/            Shared database and Redis clients
    cache/          Cached reads
    jobs/           Background jobs and workers
  tests/            Backend unit and integration tests
  certs/            Public database CA certificate
frontend/
  client/           Member portal
  admin/            Admin portal
docs/
  backend/          Feature documentation and deployment instructions
  team/             Backend and frontend handoff guides
compose.yaml        Local PostgreSQL and Redis services
render.yaml         Backend deployment configuration
```

## Local development

Use Node.js 22 (version 22.12 or later), npm, and Docker with Compose.
Run the following commands from the repository root.

### 1. Install dependencies

```sh
git clone https://github.com/PSIT-GDGOC/GDGOC-Task-Management-System.git
cd GDGOC-Task-Management-System
npm ci
```

### 2. Configure the environment

Copy the example files, then review the values for your environment:

```sh
cp backend/.env.example backend/.env
cp frontend/client/.env.example frontend/client/.env
cp frontend/admin/.env.example frontend/admin/.env
```

In PowerShell, use `Copy-Item` in place of `cp`.

Keep `DATABASE_URL` and `DIRECT_URL` pointed at local PostgreSQL during development.
Replace the example `SESSION_SECRET` with a generated value and keep credentials
out of Git. Both frontend examples point to `http://localhost:5000/api/v1`.

The backend example enables development login for trusted local testing. It must
be disabled in production. Set `GOOGLE_AUTH_ENABLED=false` while Google credentials
are unavailable; see [Google authentication](docs/backend/GOOGLE_AUTH.md) for setup.

### 3. Prepare the database

```sh
docker compose up -d postgres
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

The seed creates the Tech, Media, and Content teams and the club system owner
configured by `SYSTEM_OWNER_EMAIL` (`gdgoc.psit@gmail.com`). Generate Prisma Client
after a fresh dependency installation before building or checking types.

For cache and background jobs, also start Redis:

```sh
docker compose up -d redis
```

Set `REDIS_URL=redis://127.0.0.1:6379/0` in `backend/.env` when using local Redis.
It can remain unset for local database and API work.

### 4. Start the applications

Run each command in a separate terminal:

| Command               | Address                        |
| --------------------- | ------------------------------ |
| `npm run dev:backend` | `http://localhost:5000/api/v1` |
| `npm run dev:client`  | `http://localhost:5173`        |
| `npm run dev:admin`   | `http://localhost:5174`        |

Backend health endpoints are `/health` and `/health/ready`. Interactive API docs
are available locally at `/api/v1/docs`; endpoint coverage is currently incomplete.

## Task workflow and permissions

```text
FREE → ASSIGNED → IN_PROGRESS → IN_REVIEW → DONE
                      ↑             |
                      └─ Sent back ─┘
```

Only the current assignee can start or submit a task. A different authorized
manager must review the submission. Sending work back requires feedback, and each
submission and review remains in the task history.

System owners and presidents manage club-wide work. Admins manage teams they
belong to; members designated as team heads manage teams they head. Other members
can claim eligible tasks and manage their assigned work. The API enforces these
permissions independently of the portal used.

| Portal | Sidebar navigation                                                          |
| ------ | --------------------------------------------------------------------------- |
| Member | Task Board, My Work History, My Profile                                     |
| Admin  | Task Board, My Work History, My Profile, Members & Teams, Admin Invitations |

See the [task workflow](docs/backend/TASK_WORKFLOW.md) and
[users and teams](docs/backend/USERS_AND_TEAMS.md) guides for endpoint details.

## Checks

```sh
npm run typecheck
npm run build
npm run lint --workspace=backend
npm run test --workspace=backend
```

Database/API and Redis integration tests run separately:

```sh
npm run test:database
npm run test:redis
```

Configure `TEST_DATABASE_URL` and `TEST_REDIS_URL` for disposable local test
resources before running integration tests. See [database setup](docs/backend/DATABASE.md)
and the [backend team guide](docs/team/BACKEND_GUIDE.md) for details.

## Deployment

The hosted API is available at
[gdgoc-tracking-backend.onrender.com/api/v1](https://gdgoc-tracking-backend.onrender.com/api/v1).
Use the [readiness endpoint](https://gdgoc-tracking-backend.onrender.com/health/ready)
to check database and Redis connectivity. The API root is not a web page.

`render.yaml` defines the backend build and startup commands. Startup validates
configuration, applies committed migrations, seeds the owner and teams, and starts
the server. Keep production credentials in the hosting environment. Follow the
[Supabase guide](docs/backend/SUPABASE.md) for connection and certificate settings;
never reset the shared database or use `prisma db push` against it.

Render's free web service can sleep, which also pauses its embedded worker. Free
Key Value hosting has no disk persistence. Always-on reminders and durable queues
require a suitable hosting plan.

## Team documentation

- [Backend guide](docs/team/BACKEND_GUIDE.md): setup, responsibilities, and remaining backend work.
- [Frontend brief](docs/team/FRONTEND_BRIEF.md): API integration, sessions, CSRF, and portal behavior.
- [Deployment handoff](docs/backend/DEPLOYMENT_HANDOFF.md): hosting configuration and outstanding deployment work.
- [Work history and statistics](docs/backend/HISTORY.md): history queries and contribution metrics.
- [Admin invitations](docs/backend/INVITATIONS.md): invitation creation and redemption.
- [GitHub workflow](docs/GITHUB_WORKFLOW.md): contribution conventions and webhook scope.
