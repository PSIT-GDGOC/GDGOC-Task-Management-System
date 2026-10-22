# GDGOC Club Task Management System

A role-governed, concurrency-safe Kanban task management system designed specifically for student club workflows and open-source contribution tracking, featuring dedicated **Member** and **Admin** portals.

---

## 📌 Project Overview

The **GDGOC Club Task Management System** organizes student club operations into a unified Kanban lifecycle (**Free → Assigned → In Progress → In Review → Done**) linked directly to GitHub development workflows.

To maintain clear operational boundaries and security, the system provides two distinct frontend portals backed by a single robust Express + PostgreSQL API:
1. **Member Portal (`frontend/client/`):** Dedicated to regular club contributors to claim tasks, track active work, submit PR links for review, and inspect personal contribution history.
2. **Admin Portal (`frontend/admin/`):** Dedicated to club executives (System Owner, President, Core Admins, Team Heads) to create tasks, assign work, review GitHub PR submissions, approve tasks to Done, send back work with feedback notes, maintain teams, and issue single-use admin invitation tokens.

---

## 🔒 Strict Scope Lock — Approved Application Pages

The page structure for both applications is finalized. No additional pages or navigation items exist beyond this exact approved list:

### 1. Member Application (`frontend/client/`)
- **Login:** Google OAuth entry point (`/login`)
- **Task Board:** Kanban board (`/`) — View tasks, claim eligible free tasks, start assigned work, submit PR link for review.
- **My Work History:** (`/history`) — View personal completed tasks, approvals, and on-time statistics.
- **My Profile:** (`/profile`) — View verified Google email, manage position title, and link GitHub username.

*Member Sidebar Navigation:*
1. `Task Board`
2. `My Work History`
3. `My Profile`

---

### 2. Admin Application (`frontend/admin/`)
- **Login:** Google OAuth entry point (`/login`)
- **Task Board:** Kanban board (`/`) — Create tasks (via inline modal), filter scopes, review submissions, approve to Done, or send back to In Progress.
- **My Work History:** (`/history`) — Audit task completions across all members and teams.
- **My Profile:** (`/profile`) — View administrative privileges, update position title, and manage GitHub identity.
- **Members & Teams:** (`/members-teams`) — Manage team structures (`Tech`, `Media`, `Content`), assign team heads, and view member roles.
- **Admin Invitations:** (`/invitations`) — Generate, track, and copy single-use 48-hour expiring invitation codes.

*Admin Sidebar Navigation:*
1. `Task Board`
2. `My Work History`
3. `My Profile`
4. `Members & Teams`
5. `Admin Invitations`

---

## 📁 Repository Structure

```text
GDGOC-Task-Management-System/
│
├── frontend/
│   ├── client/                  # Member-facing application (Vite + React + Tailwind)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   │   └── Board/       # Board, Column, TaskCard (dnd-kit)
│   │   │   ├── layouts/
│   │   │   │   └── MainLayout.tsx # Strict 3-item sidebar
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── TaskBoard.tsx
│   │   │   │   ├── MyWorkHistory.tsx
│   │   │   │   └── MyProfile.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useTasks.ts  # TanStack Query 12s polling hook
│   │   │   ├── services/
│   │   │   │   └── api.ts       # Central fetch client with credentials
│   │   │   ├── types/
│   │   │   │   └── task.ts
│   │   │   ├── router/
│   │   │   │   └── index.tsx
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── admin/                   # Admin-facing application (Vite + React + Tailwind)
│       ├── public/
│       ├── src/
│       │   ├── assets/
│       │   ├── components/
│       │   │   ├── Board/       # Board, Column, TaskCard with review actions
│       │   │   └── CreateTaskModal.tsx # In-board task creation
│       │   ├── layouts/
│       │   │   └── AdminLayout.tsx # Strict 5-item admin sidebar
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── TaskBoard.tsx
│       │   │   ├── MyWorkHistory.tsx
│       │   │   ├── MyProfile.tsx
│       │   │   ├── MembersTeams.tsx
│       │   │   └── AdminInvitations.tsx
│       │   ├── hooks/
│       │   │   └── useTasks.ts
│       │   ├── services/
│       │   │   └── api.ts
│       │   ├── types/
│       │   │   └── task.ts
│       │   ├── router/
│       │   │   └── index.tsx
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── backend/                     # Node.js + Express + Prisma + PostgreSQL
│   ├── src/
│   │   ├── config/              # Zod runtime environment validation (env.ts)
│   │   ├── middleware/          # requireAuth, requireRole, errorHandler, verifyWebhook
│   │   ├── routes/              # task, auth, health, webhook, docs
│   │   ├── services/            # task.service, auth.service, webhook.service
│   │   ├── repositories/        # task.repository.ts
│   │   ├── lib/                 # prisma.ts singleton
│   │   ├── utils/               # sha256 hash and timingSafeEqual helpers
│   │   ├── app.ts               # Express configuration, sessions, helmet, CORS
│   │   └── server.ts            # HTTP server entrypoint
│   ├── prisma/
│   │   ├── schema.prisma        # 8 Prisma models, enums, composite indexes
│   │   ├── migrations/          # Managed migration directory
│   │   └── seed.ts              # Seeds Tech, Media, Content & System Owner
│   ├── tests/                   # Vitest + Supertest integration tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/
│   ├── API_CONTRACT.md          # REST API schema and state transitions
│   └── GITHUB_WORKFLOW.md       # Branch naming and webhook signature verification
│
├── .github/
│   └── pull_request_template.md # PR template with task ID checklist
│
├── .gitignore
├── .prettierrc
├── .env.example
├── package.json                 # Root npm workspace
├── package-lock.json
├── README.md
└── render.yaml                  # Render deployment blueprint
```

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Monorepo** | npm workspaces (`frontend/client`, `frontend/admin`, `backend`) | Native node workspace management, shared scripts, zero extra monorepo bloat. |
| **Frontend Apps** | React 18 + Vite + TypeScript | Blazing fast HMR, strict type safety. Port 5173 (Member) & 5174 (Admin). |
| **Styling** | Tailwind CSS v3 | Utility-first styling with custom Google Developer Group brand tokens. |
| **Board State & Sync** | TanStack Query v5 | Cross-user synchronization using 10–15s window-active polling. **No Socket.IO**. |
| **Drag and Drop** | `@dnd-kit/core` | Accessible drag-and-drop primitives for Kanban column transitions. |
| **Backend** | Express + TypeScript | Modular architecture separating routes, services, repositories, and middlewares. |
| **Database & ORM** | PostgreSQL + Prisma ORM | ACID compliance, relational integrity, conditional atomic updates (`$transaction`). |
| **Sessions** | `express-session` + `connect-pg-simple` | Secure, HTTP-only server sessions in PostgreSQL; explicit memory store for isolated tests. |
| **Validation** | Zod | Runtime schema validation for request bodies, queries, and params. |
| **Testing** | Vitest + Supertest | Ultra-fast unit and API integration testing. |

---

## 👥 Roles & Permissions Matrix

| Capability | System Owner (`SYSTEM_OWNER`) | President (`PRESIDENT`) | Core Admin / Team Head (`ADMIN`) | Member (`USER`) |
| :--- | :---: | :---: | :---: | :---: |
| **Bootstrap System** | ✅ via `SYSTEM_OWNER_EMAIL` | ❌ | ❌ | ❌ |
| **Issue / Revoke Admin Invites** | ✅ | ✅ | ❌ | ❌ |
| **Create / Soft-Delete Tasks** | ✅ | ✅ | ✅ (Own Team Scope) | ❌ |
| **Claim Free Tasks** | ✅ | ✅ | ✅ | ✅ (Team Scope / Whole Club) |
| **Submit PR for Review** | ✅ | ✅ | ✅ | ✅ (Assignee Only) |
| **Approve Task to Done** | ✅ | ✅ | ✅ (Own Team Scope) | ❌ |
| **Send Back with Comment** | ✅ | ✅ | ✅ (Own Team Scope) | ❌ |
| **View Contribution History** | ✅ (All Members) | ✅ (All Members) | ✅ (All Members) | ✅ (Own History Only) |

---

## ⚙️ Environment Configuration

### 1. Root & Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gdgoc_tasks?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/gdgoc_tasks?schema=public"
SESSION_SECRET="your-secure-random-32-byte-secret"
SYSTEM_OWNER_EMAIL="gdgoc.psit@gmail.com"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/v1/auth/google/callback"
GITHUB_WEBHOOK_SECRET="your-github-webhook-shared-secret"
```

### 2. Member Frontend (`frontend/client/.env`)
```env
VITE_API_URL="http://localhost:5000/api/v1"
```

### 3. Admin Frontend (`frontend/admin/.env`)
```env
VITE_API_URL="http://localhost:5000/api/v1"
```

---

## Database foundation

See [database setup and verification](docs/backend/DATABASE.md) for PostgreSQL,
Prisma migrations, seeding, Supabase connection settings, and database tests.
See [users, teams, and permissions](docs/backend/USERS_AND_TEAMS.md) for the next
backend stage and the API contract for profile/team integration.
See [Task Board workflow](docs/backend/TASK_WORKFLOW.md) for assignment, lifecycle
actions, review policies, and paginated task reads.

## 🚀 Local Setup & Development Commands

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/PSIT-GDGOC/GDGOC-Task-Management-System.git
cd GDGOC-Task-Management-System

# Install all workspace dependencies
npm install
```

### 2. Configure Environment Files
```bash
# Windows PowerShell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\client\.env.example frontend\client\.env
Copy-Item frontend\admin\.env.example frontend\admin\.env

# Unix / macOS
cp backend/.env.example backend/.env
cp frontend/client/.env.example frontend/client/.env
cp frontend/admin/.env.example frontend/admin/.env
```

### 3. Database Migration & Seed
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply committed migrations (start PostgreSQL and configure both database URLs first)
npm run prisma:deploy

# Seed core teams (Tech, Media, Content) & System Owner
npm run prisma:seed
```

### 4. Running the Applications
```bash
# Run all three services concurrently (Member: 5173, Admin: 5174, Backend: 5000)
npm run dev

# Or run services individually:
npm run dev:client     # Member portal on http://localhost:5173
npm run dev:admin      # Admin console on http://localhost:5174
npm run dev:backend    # Express backend on http://localhost:5000
```

### 5. Quality Checks & Test Suite
```bash
# Typecheck all 3 workspaces (Member, Admin, Backend)
npm run typecheck

# Run automated tests (Vitest + Supertest)
npm run test

# Production build of all three applications
npm run build
```

---

## 🚢 Deployment Outline

### Backend (Render)
- Deploy using the provided `render.yaml` blueprint.
- Configure Supabase PostgreSQL using `DATABASE_URL` and `DIRECT_URL`; follow [Supabase setup](docs/backend/SUPABASE.md) for session pooling, SSL and API access restrictions.
- Set `SESSION_SECRET`, `SYSTEM_OWNER_EMAIL`, and `CLIENT_ORIGIN` in Render dashboard.

### Frontends (Vercel)
- **Member Application:** Set root directory to `frontend/client`, build command `npm run build`, output `dist`, and set `VITE_API_URL`.
- **Admin Application:** Set root directory to `frontend/admin`, build command `npm run build`, output `dist`, and set `VITE_API_URL`.

---

## 🔍 Known Limitations & Planned Follow-Ups

1. **Google OAuth 2.0 Credentials:** URL scaffolding is functional; production Google Cloud credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) must be supplied. A local development role-switcher is included for instant local testing.
2. **Database Provisioning:** A live PostgreSQL database is required for `npm run prisma:migrate`. Startup checks require PostgreSQL and migrated user/session tables; database outages do not silently switch session storage.
3. **Automated GitHub PR Sync:** Webhook signature verification (`crypto.timingSafeEqual`) is fully tested; automated PR status reflection triggers when the webhook is pointed to the live backend URL.
