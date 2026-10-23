# GDGOC Club Task Management System — API Contract

Base URL: `/api/v1`

Users/teams endpoints and the current role/team permission matrix are documented
in [Users and teams](backend/USERS_AND_TEAMS.md). The implemented OpenAPI contract
is also available at `/api/v1/docs/openapi.json`. Task endpoints require a session
and restrict visibility/actions by the rules in that document.

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

The implemented request/response shapes, permissions, validations, and concurrency
rules are documented in [Task Board workflow](backend/TASK_WORKFLOW.md) and at
`/api/v1/docs/openapi.json`.

| Method and path | Purpose |
| --- | --- |
| GET `/tasks` | Visible tasks with page/limit, team, assignee, scope, status, priority, tag, and search filters |
| GET `/tasks/:id` | Detail with activity and submission/review history |
| POST `/tasks` | Create with optional initial assignee |
| PATCH `/tasks/:id` | Edit metadata before review/completion |
| POST `/tasks/:id/assign` | Assign, reassign, or unassign using assigneeId/null |
| POST `/tasks/:id/claim` | Claim eligible Free work atomically |
| POST `/tasks/:id/start` | Assignee starts Assigned work |
| POST `/tasks/:id/submit` | Assignee submits a PR URL or note |
| POST `/tasks/:id/review` | Authorized non-assignee approves or sends back with feedback |
| DELETE `/tasks/:id` | Soft-delete before review/completion |

List responses preserve success/count/data and add pagination; the default page
contains at most 20 tasks. Mutations return success/data. Self-review is forbidden.
Tasks in review or Done are locked against edits, reassignment, and deletion.
Approval measures timeliness from the approved attempt's submission timestamp.

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
