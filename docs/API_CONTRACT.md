# GDGOC Club Task Management System — API Contract

Base URL: `/api/v1`

All responses follow a consistent JSON format:
```json
// Success Response
{
  "success": true,
  "message": "Optional human-readable confirmation",
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": {
    "message": "Descriptive error message",
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | APP_ERROR",
    "details": { ... }
  }
}
```

---

## 1. Authentication & Identity (`/auth`)

### 1.1 `GET /auth/me`
- **Description:** Returns the currently authenticated user session.
- **Permission:** Any authenticated user.
- **Response `200`:**
  ```json
  {
    "success": true,
    "user": {
      "id": "cuid...",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "USER | ADMIN | PRESIDENT | SYSTEM_OWNER",
      "position": "Tech Lead",
      "githubUsername": "janedoe"
    }
  }
  ```
- **Response `401`:** `{ "success": false, "error": { "message": "Authentication required. Please sign in.", "code": "UNAUTHORIZED" } }`

### 1.2 `POST /auth/logout`
- **Description:** Destroys server-side session and clears `gdgoc.sid` cookie.
- **Permission:** Authenticated user.

### 1.3 `GET /auth/google/url`
- **Description:** Provides Google OAuth 2.0 authorization URL with required scopes (`openid`, `email`, `profile`).

### 1.4 `POST /auth/invitations`
- **Description:** Issues a single-use expiring invitation token.
- **Permission:** Strictly `SYSTEM_OWNER` or `PRESIDENT`.
- **Request Body:**
  ```json
  {
    "role": "ADMIN",
    "position": "Media Lead",
    "teamId": "cuid_media_team_id",
    "expiresInHours": 48
  }
  ```
- **Response `201`:**
  ```json
  {
    "success": true,
    "data": {
      "invitationId": "cuid...",
      "rawCode": "inv_28c94af8...",
      "expiresAt": "2026-10-23T23:00:00.000Z"
    }
  }
  ```

### 1.5 `POST /auth/invitations/redeem`
- **Description:** Redeems an admin invitation code, elevates user role atomically, and records audit timestamps.
- **Permission:** Authenticated user.
- **Request Body:**
  ```json
  {
    "code": "inv_28c94af8..."
  }
  ```
- **Response `200`:** Promoted user profile.
- **Errors:** `400 Bad Request` (expired/invalid/revoked), `409 Conflict` (already redeemed).

---

## 2. Tasks & Board Lifecycle (`/tasks`)

The Kanban columns follow:
`FREE` → `ASSIGNED` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`

### 2.1 `GET /tasks`
- **Description:** Lists active (non-soft-deleted) tasks for board polling and synchronization.
- **Query Parameters:**
  - `teamId` *(string, optional)*: Filter by specific team ID.
  - `scope` *(string, optional)*: `'TEAM' | 'WHOLE_CLUB'`.
  - `status` *(string, optional)*: `'FREE' | 'ASSIGNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'`.
  - `assigneeId` *(string, optional)*: Filter by assigned member ID.
  - `search` *(string, optional)*: Full-text search on title & description.
- **Response `200`:** Array of tasks with team, creator, assignee, and latest submission.

### 2.2 `GET /tasks/:id`
- **Description:** Retrieves task detail, full append-only audit trail (`activities`), and review history (`submissions`).
- **Response `200`:** Task object.
- **Response `404`:** Task not found or deleted.

### 2.3 `POST /tasks`
- **Description:** Creates a new task.
- **Permission:** `SYSTEM_OWNER`, `PRESIDENT`, `ADMIN`, or Team Head for the targeted team.
- **Request Body:**
  ```json
  {
    "title": "Build landing page hero section",
    "description": "Implement responsive layout using Tailwind CSS with club logo assets.",
    "priority": "HIGH",
    "scope": "TEAM",
    "teamId": "cuid_tech_team",
    "deadline": "2026-11-01T18:00:00.000Z",
    "tags": ["frontend", "tailwind", "react"]
  }
  ```
- **Response `201`:** Created task with status `FREE` (or `ASSIGNED` if assigneeId provided).

### 2.4 `POST /tasks/:id/claim`
- **Description:** Concurrency-safe atomic task claim. If two members attempt to claim simultaneously, one succeeds and the other receives `409 Conflict`.
- **Eligibility:**
  - If task `scope` is `TEAM`, claimant must belong to that team in `TeamMembership`.
  - If task `scope` is `WHOLE_CLUB`, any authenticated member may claim.
- **Transition:** `FREE` → `ASSIGNED`
- **Response `200`:** Updated task with assignee.
- **Errors:** `403 Forbidden` (not in team), `409 Conflict` (already claimed / race lost).

### 2.5 `POST /tasks/:id/start`
- **Description:** Member indicates active work has begun.
- **Permission:** Task assignee.
- **Transition:** `ASSIGNED` → `IN_PROGRESS`
- **Response `200`:** Updated task.

### 2.6 `POST /tasks/:id/submit`
- **Description:** Submits completed pull request for review.
- **Permission:** Task assignee.
- **Transition:** `IN_PROGRESS` → `IN_REVIEW`
- **Request Body:**
  ```json
  {
    "prUrl": "https://github.com/PSIT-GDGOC/GDGOC-Task-Management-System/pull/12",
    "note": "Implemented hero component and added responsive breakpoints. Unit tests included."
  }
  ```
- **Response `200`:** Updated task and new pending submission.

### 2.7 `POST /tasks/:id/review`
- **Description:** Reviewer inspects PR and decides outcome.
- **Permission:** `SYSTEM_OWNER`, `PRESIDENT`, `ADMIN`, or Team Head.
- **Request Body:**
  ```json
  {
    "outcome": "APPROVED | SENT_BACK",
    "reviewComment": "Great job on the responsiveness! Merging PR."
  }
  ```
- **Transitions:**
  - If `APPROVED`: `IN_REVIEW` → `DONE` (sets `completedAt`, `approvedById`, `isOnTime`).
  - If `SENT_BACK`: `IN_REVIEW` → `IN_PROGRESS` (stores review comment for member to address).
- **Response `200`:** Updated task.

### 2.8 `DELETE /tasks/:id`
- **Description:** Soft deletes task (`isDeleted = true`, `deletedAt = now()`) and records activity.
- **Permission:** `SYSTEM_OWNER`, `PRESIDENT`, `ADMIN`.

---

## 3. GitHub Webhook (`/webhooks/github`)

### 3.1 `POST /webhooks/github`
- **Description:** Receives PR notifications from GitHub.
- **Security:**
  - Verifies `X-Hub-Signature-256` using HMAC SHA-256 with shared secret.
  - Constant-time comparison prevents timing attacks.
  - Payloads are never trusted without valid signature.
  - Does NOT automatically approve or complete tasks without explicit admin review.
- **Response `200`:** `{ "received": true, "event": "pull_request", "result": { ... } }`
- **Response `401`:** Invalid signature.

---

## 4. System Health (`/health`)

### 4.1 `GET /health`
- **Description:** Returns server uptime, memory usage, timestamp, and environment.
- **Response `200`:**
  ```json
  {
    "status": "healthy",
    "service": "gdgoc-task-management-server",
    "timestamp": "2026-10-21T18:20:00.000Z",
    "uptimeSeconds": 1420,
    "nodeVersion": "v24.14.0",
    "memoryUsageMB": 42
  }
  ```
