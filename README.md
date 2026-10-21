# GDGOC Club Task Management System

A role-governed, concurrency-safe Kanban task management system designed specifically for student club workflows and open-source contribution tracking.

---

## 📌 Project Overview & Problem Statement

Student technical clubs often struggle with:
1. **Unorganized Task Assignment & Collision:** Multiple members attempting to claim the same free task simultaneously, causing duplication of effort.
2. **Disconnected Git Workflows:** Tasks tracked in standalone spreadsheet/chat tools become decoupled from the actual GitHub Pull Requests and code changes.
3. **Unclear Review Loops:** Members lack a transparent send-back mechanism with actionable review comments and clear audit logs.
4. **Scope Creep & Overprivileged Roles:** Team leads editing other teams' work without strict team-level authorization boundaries.

The **GDGOC Club Task Management System** solves this by uniting a Kanban lifecycle (**Free → Assigned → In Progress → In Review → Done**) with GitHub branch/PR mapping, atomic concurrency-safe claims, role and team separation, and TanStack Query polling synchronization.

---

## 🎯 Goals & Core Features

- **Kanban Board Lifecycle:** Clear progression from `Free` to `Done` with drag-and-drop support (`dnd-kit`).
- **Atomic Concurrency-Safe Claiming:** Eliminates double claims using database-safe atomic transactions (`updateMany` conditional lock). If two members claim at the same millisecond, the loser receives `HTTP 409 Conflict`.
- **Decoupled Roles, Positions & Teams:** System roles (`SYSTEM_OWNER`, `PRESIDENT`, `ADMIN`, `USER`), club positions ("President", "Tech Lead"), and team memberships (`Tech`, `Media`, `Content`) are modeled independently.
- **Team-Scoped & Whole-Club Tasks:** Tasks can be claimed only by members of that team, or across the whole club when marked `WHOLE_CLUB`.
- **Append-Only Activity Audit Trail:** Every status change, assignment, review, and comment is permanently recorded in a transaction with the task mutation.
- **GitHub PR Linkage & Webhooks:** Members submit PR links for review; an HMAC SHA-256 verified webhook endpoint catches GitHub events safely.
- **Zero Socket Overhead:** Real-time cross-user synchronization is achieved via configurable TanStack Query background polling (10–15s window-active refetch, refetch on reconnect/focus), keeping the stack simple and serverless/PaaS-friendly.

---

## 👥 Roles & Permissions Matrix

| Capability / Action | System Owner (`SYSTEM_OWNER`) | Club President (`PRESIDENT`) | Core Admin / Team Head (`ADMIN`) | Regular Member (`USER`) | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **System Bootstrapping** | ✅ Automatic via server config | ❌ | ❌ | ❌ | Bootstrapped from verified `SYSTEM_OWNER_EMAIL`. |
| **Issue / Revoke Admin Invites** | ✅ | ✅ | ❌ | ❌ | Uses expiring, single-use SHA-256 hashed invite tokens. |
| **Remove / Demote Admin Privileges** | ✅ | ✅ | ❌ | ❌ | The System Owner **cannot** be demoted or removed by any admin. |
| **Create / Soft-Delete Tasks** | ✅ | ✅ | ✅ (Own Team Scope) | ❌ | Team heads are restricted to their team; admins to all. |
| **Assign / Reassign Tasks** | ✅ | ✅ | ✅ (Own Team Scope) | ❌ | Transactional mutation with activity log. |
| **Claim Free Task** | ✅ | ✅ | ✅ | ✅ (Eligible Team / Whole Club) | Atomic claim with team membership check. |
| **Move to In Progress** | ✅ | ✅ | ✅ | ✅ (Own Assigned Task) | Requires assignee identity. |
| **Submit Work for Review** | ✅ | ✅ | ✅ | ✅ (Own Assigned Task) | Requires PR URL and optional note. |
| **Approve Task to Done** | ✅ | ✅ | ✅ (Own Team Scope) | ❌ | Regular members **cannot** self-approve tasks. |
| **Send Work Back with Comment** | ✅ | ✅ | ✅ (Own Team Scope) | ❌ | Reverts task to `IN_PROGRESS` with feedback note. |
| **View Contribution History** | ✅ (All Members) | ✅ (All Members) | ✅ (All Members) | ✅ (Own History Only) | Enforced on API level. |

> ⚠️ *Vice President (VP) and Secretary Privileges:* Fine-grained operational permissions for VP and Secretary are pending executive alignment. For now, they inherit standard `ADMIN` privileges when assigned that system role. Faculty is explicitly removed as a separate role.

---

## 🔄 Kanban Lifecycle & GitHub Workflow

```mermaid
flowchart LR
    Free["1. FREE"] -->|Atomic Claim| Assigned["2. ASSIGNED"]
    Assigned -->|Start Work| InProgress["3. IN PROGRESS"]
    InProgress -->|Submit PR Link| InReview["4. IN REVIEW"]
    InReview -->|Admin Approved| Done["5. DONE"]
    InReview -->|Send Back with Notes| InProgress
```

### Member Development Steps:
1. Pull latest `main`: `git checkout main && git pull origin main`
2. Create branch matching task: `git checkout -b feature/task-<TASK_ID>`
3. Commit and push: `git commit -m "feat(module): description [task-<TASK_ID>]"`
4. Open Pull Request on GitHub targeting `main`.
5. On the Club Board, click **"Submit PR"** on your task, paste the PR URL, and add notes.
6. Admin reviews the PR on GitHub and approves or sends back on the Board.

---

## 🛠️ Technology Stack & Rationale

| Layer | Chosen Technology | Rationale |
| :--- | :--- | :--- |
| **Monorepo** | npm workspaces (`client/`, `server/`) | Consistent dependency resolution, single root scripts, clean separation. |
| **Frontend** | React 18 + Vite + TypeScript | Lightning-fast HMR, strict type safety, zero build friction. |
| **Styling** | Tailwind CSS v3 | Rapid utility-first styling with GDG brand color tokens. |
| **Board State & Sync**| TanStack Query v5 | Efficient 10-15s polling without WebSocket connection maintenance or stateful socket server overhead. |
| **Drag & Drop** | `@dnd-kit/core` | Accessible, touch-compatible, modern drag and drop primitives. |
| **Backend** | Express + Node.js (TypeScript) | Proven architecture, clean separation of routes, services, and middlewares. |
| **Database & ORM** | PostgreSQL + Prisma ORM | Relational consistency, atomic transaction support (`$transaction`), typed models. |
| **Sessions** | `express-session` + `connect-pg-simple` | Secure, HTTP-only, server-controlled session store in PostgreSQL. |
| **Validation** | Zod | Runtime type safety and clean 400 error payloads for request bodies, params, and queries. |
| **Testing** | Vitest + Supertest | Blazing fast ESM-first unit and integration testing. |

---

## 📁 Repository Structure

```
GDGOC-Task-Management-System/
├── .github/
│   └── pull_request_template.md    # PR template with task-ID checklist
├── docs/
│   ├── API_CONTRACT.md             # REST API specifications and error models
│   └── GITHUB_WORKFLOW.md          # Git branching, PR rules, and webhook guide
├── client/
│   ├── src/
│   │   ├── api/client.ts           # Central fetch wrapper with session credentials
│   │   ├── components/
│   │   │   ├── Board/              # Board, Column, TaskCard (dnd-kit)
│   │   │   └── Layout.tsx          # Top navbar, GDG logo, session profile
│   │   ├── hooks/useTasks.ts       # TanStack Query polling & mutation hooks
│   │   ├── pages/                  # BoardPage, LoginPage, HistoryPage
│   │   ├── types/task.ts           # TypeScript models matching schema
│   │   ├── App.tsx                 # Routes and QueryClientProvider
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/
│   ├── prisma/
│   │   ├── schema.prisma           # Relational schema (8 models, enums, indexes)
│   │   └── seed.ts                 # Seeds Tech, Media, Content & System Owner
│   ├── src/
│   │   ├── config/env.ts           # Zod-validated runtime environment variables
│   │   ├── lib/prisma.ts           # Prisma singleton
│   │   ├── middleware/             # auth, errorHandler, validate, verifyWebhook
│   │   ├── routes/                 # auth, health, task, webhook, docs
│   │   ├── services/               # auth, task, webhook business logic
│   │   ├── app.ts                  # Express application configuration
│   │   └── index.ts                # Server entrypoint
│   ├── tests/                      # Vitest + Supertest integration tests
│   ├── .env.example
│   └── package.json
├── .gitignore
├── .prettierrc
├── package.json                    # Root npm workspace
└── README.md
```

---

## ⚙️ Environment Variables

### Server (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend listen port | `5000` |
| `NODE_ENV` | Environment mode (`development` \| `production` \| `test`) | `development` |
| `CLIENT_ORIGIN` | Allowed CORS origin for frontend | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/gdgoc_tasks?schema=public` |
| `SESSION_SECRET` | 32+ character random secret for cookies | `your-secure-random-32-byte-hex-secret` |
| `SYSTEM_OWNER_EMAIL` | Verified Google email bootstrapped to System Owner | `aditya.lead@example.com` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth 2.0 Client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console OAuth 2.0 Client Secret | `your-google-client-secret` |
| `GOOGLE_CALLBACK_URL` | Redirect URL registered in Google Console | `http://localhost:5000/api/v1/auth/google/callback` |
| `GITHUB_WEBHOOK_SECRET` | Shared secret configured in GitHub Webhooks | `your-github-webhook-shared-secret` |

### Client (`client/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API base endpoint | `http://localhost:5000/api/v1` |

> 🔒 **Security Notice:** Never commit `.env` files or expose backend secrets in `VITE_` variables.

---

## 🚀 Local Setup & Quickstart

### Prerequisites
- Node.js `v20+` (tested on Node `v24.14.0`)
- npm `v10+`
- PostgreSQL `v14+` instance (local or managed like Supabase / Neon)

### 1. Clone & Install Dependencies
```bash
# Windows PowerShell or Unix Bash
git clone https://github.com/PSIT-GDGOC/GDGOC-Task-Management-System.git
cd GDGOC-Task-Management-System

# Install all workspace dependencies
npm install
```

### 2. Configure Environment Files
```bash
# PowerShell
Copy-Item .env.example server\.env
Copy-Item client\.env.example client\.env

# Unix / macOS
cp .env.example server/.env
cp client/.env.example client/.env
```

### 3. Generate Prisma Client & Migrate Database
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Seed initial teams (Tech, Media, Content) & System Owner
npm run prisma:seed
```

### 4. Development Commands
```bash
# Start both client and server concurrently
npm run dev

# Or run separately in dedicated shells:
npm run dev:server    # Starts backend on http://localhost:5000
npm run dev:client    # Starts frontend on http://localhost:5173
```

---

## 🧪 Quality Checks & Test Suite

```bash
# Run TypeScript compilation checks across all workspaces
npm run typecheck

# Run test suites (Vitest + Supertest)
npm run test

# Code style formatting check
npm run format:check

# Production build test
npm run build
```

---

## 📖 API Documentation & Contract

- **Interactive Swagger UI:** Accessible when running locally at:
  `http://localhost:5000/api/v1/docs`
- **Markdown Specification:** Full endpoint schema, error codes, and transition rules in [`docs/API_CONTRACT.md`](file:///docs/API_CONTRACT.md).
- **Health Check Endpoint:** `GET http://localhost:5000/health`.

---

## 🚢 Deployment Outline (Vercel & Render)

1. **Frontend (Vercel):**
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_API_URL=https://<your-render-backend-url>/api/v1`

2. **Backend (Render / Railway):**
   - Build command: `npm install && npm run build --workspace=server && npm run prisma:generate --workspace=server`
   - Start command: `npm run start --workspace=server`
   - Set environment variables (`DATABASE_URL`, `SESSION_SECRET`, `SYSTEM_OWNER_EMAIL`, `CLIENT_ORIGIN`, `GITHUB_WEBHOOK_SECRET`).

3. **CORS & Secure Cookies Caveat:**
   - When frontend and backend reside on different domains, ensure `sameSite: 'none'` and `secure: true` are enabled on the session cookie, and `CLIENT_ORIGIN` matches the exact Vercel URL.

---

## 👥 Team Responsibilities Split

| Team Member | Core Focus & Modules |
| :--- | :--- |
| **Aditya** | System foundation, Google OAuth 2.0 bootstrapping, session security layer, GitHub webhook HMAC verification, and repository governance. |
| **Shikhar** | Task engine, atomic concurrency claiming, status state transitions, soft deletes, and append-only activity logging. |
| **Sajid** | User profiles, team scopes & memberships, single-use admin invitation hashing, contribution history, and performance stats. |
| **Muskan** | Frontend implementation, Vite + React + Tailwind board UI, dnd-kit drag-and-drop interactions, and TanStack Query polling synchronization. |

---

## 🔍 Known Limitations & Unimplemented Items

To maintain transparent engineering integrity, the following items are scaffolded but require production infrastructure credentials or planned follow-ups:
1. **Google OAuth 2.0 Credentials:** Scaffolding and URL generation are implemented. A local development role-switcher (`POST /api/v1/auth/dev-login`) is provided for testing while production Google Cloud credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are being issued.
2. **PostgreSQL Database Connection:** Prisma models and migrations are defined. Running migrations requires a live `DATABASE_URL`. The session middleware safely falls back to memory store in local dev if PostgreSQL is temporarily unreachable.
3. **Automated GitHub PR Status Sync:** Webhook HMAC verification and event receipt are fully implemented and verified with tests; automated task state updates based on PR merge events will be enabled after production webhook endpoint registration.
