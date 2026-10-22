# GDGOC — Frontend integration brief

Handoff snapshot: 22 October 2026. This describes the existing backend contract;
frontend implementation remains with the frontend team.

The hosted database plan now uses Supabase PostgreSQL. Keep calling Express and
using its existing login/session contract; Supabase Auth has not been adopted.

**Dependency:** use the latest `feat/backend` work. Backend Redis/build fixes now pass local checks; real Google setup remains
pending. Read `docs/backend/DEPLOYMENT_HANDOFF.md` for the live URL and verification
status. Google login is explicitly disabled until real credentials are supplied.

## 1. Scope and setup

Use the existing applications: `frontend/client` for members and `frontend/admin`
for administrators. Their actual stack is **React + Vite + TypeScript + Tailwind +
TanStack Query**. Continue that structure; the earlier Next.js image is not the
current implementation.

| App    | Sidebar labels, in order                                                    |
| ------ | --------------------------------------------------------------------------- |
| Member | Task Board; My Work History; My Profile                                     |
| Admin  | Task Board; My Work History; My Profile; Members & Teams; Admin Invitations |

Keep login at `/login`; use `/`, `/history`, `/profile`, `/members-teams` and
`/invitations` for the corresponding existing pages. Create/edit/review task
forms can be inline or modals. The wireframe is visual inspiration; do not add
Dashboard, Calendar, Reports or GitHub sidebar pages.

Set `VITE_API_URL=http://localhost:5000/api/v1` in each app's ignored `.env`.
From the repository root, use `npm ci`, then `npm run dev:client` (5173) or
`npm run dev:admin` (5174). Match the backend's configured frontend origins.

## 2. Implement authentication first

1. Navigate to `${API}/auth/google?portal=member` or `portal=admin` for Google
   login. The backend owns the callback and redirects back to the selected app.
2. On return/app startup, request `GET /auth/me`, then `GET /auth/csrf`, using
   `credentials: 'include'`. Auth returns `user`; CSRF returns `csrfToken`.
3. Keep the CSRF token in memory and send `X-CSRF-Token` on every authenticated
   POST/PATCH/PUT/DELETE. The session cookie is HTTP-only; do not store Google
   tokens or invent a bearer-token flow.
4. Logout with `POST /auth/logout`, then clear user/query state. After invitation
   redemption, use its returned new CSRF token and refetch the current user.

Minimal request pattern (add normal loading/error UI around this):

```ts
const API = import.meta.env.VITE_API_URL;
let csrfToken = '';

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(!['GET', 'HEAD', 'OPTIONS'].includes(method) && {
        'X-CSRF-Token': csrfToken,
      }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const payload = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(payload.error?.message ?? 'Request failed'), {
      status: res.status,
      details: payload.error?.details,
    });
  }
  return payload;
}

// After successful login, and again after a full page reload:
const user = (await api('/auth/me')).user;
csrfToken = (await api('/auth/csrf')).csrfToken;

// Example authenticated action:
// await api(`/tasks/${taskId}/start`, 'POST', {});
```

For trusted local work, the backend can explicitly enable `POST /auth/dev-login`
with email/name/role. Use it only in local development, then fetch `/auth/csrf`.
Do not ship a production role selector. Real Google login is not configured yet.

## 3. Connect the pages

All paths below are relative to `/api/v1`.

| Page                | Main API calls                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task Board          | `GET /tasks`, `GET /tasks/:id`; `POST /tasks`; `PATCH /tasks/:id`; `DELETE /tasks/:id`                                                                  |
| Task actions        | `POST /tasks/:id/claim`, `/start`, `/assign`, `/submit`, `/review`                                                                                      |
| My Work History     | `GET /history/me` and `/history/me/statistics`; permitted admin audit uses `/history` and `/history/statistics` within the same page                    |
| My Profile          | `GET /users/me`; `PATCH /users/me` with position/githubUsername only                                                                                    |
| Members & Teams     | `GET /users`, `GET /teams`, `GET /teams/:teamId/members`; owner/president can `POST /users` with email/name, create/edit teams and change member status |
| Membership controls | `PUT /teams/:teamId/members/:userId` with `{}` or `{ isTeamHead: true/false }`; `DELETE` that same path                                                 |
| Admin Invitations   | `GET/POST /auth/invitations`; `POST /auth/invitations/:id/revoke`; redemption uses `POST /auth/invitations/redeem`                                      |

`POST /users` preregisters an ordinary member and is limited to owner/president;
assign team membership separately after creating the member.
`PATCH /users/:userId/status` accepts `{ "isActive": false }` or true.
Treat name/email/avatar/role as server-controlled profile fields.

### Task behavior must follow the server

Show the actual states: **FREE → ASSIGNED → IN_PROGRESS → IN_REVIEW → DONE**.
Send-back returns IN_REVIEW to IN_PROGRESS. There is no unrestricted status PATCH:
drag/drop must map only to a permitted action, or be disabled.

| Action            | Example JSON body                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Create team task  | `{ "title": "Prepare banner", "description": "Prepare the final event banner.", "scope": "TEAM", "teamId": "<id>", "priority": "HIGH" }` |
| Assign / unassign | `{ "assigneeId": "<id>" }` / `{ "assigneeId": null }`                                                                                    |
| Submit            | `{ "note": "Ready for review" }` and/or `prUrl` containing an HTTPS GitHub PR URL                                                        |
| Approve           | `{ "outcome": "APPROVED" }`                                                                                                              |
| Send back         | `{ "outcome": "SENT_BACK", "reviewComment": "Please include the mobile version." }`                                                      |

Only the assignee starts/submits. An authorized different manager reviews; no
self-review. Review/Done tasks cannot be edited/reassigned/deleted. Scope/team are
fixed after creation. PATCH accepts title, description, priority, deadline and tags.
Reassignment of in-progress work resets it to ASSIGNED. Use ISO timestamps with
timezone for deadlines. Validate title 3–150 characters and description 10–10,000.

## 4. Permissions and data handling

- Owner/president: manage all scopes. ADMIN: manage teams they belong to. USER
  with `isTeamHead` membership: manage those headed teams. Derive controls from
  the current user's role **and memberships**, not a role-name check alone.
- Only owner/president manage invitations; only owner grants PRESIDENT. Admin
  history audit is club-wide, but that does not grant club-wide task management.
  Ordinary members see their own history; USER heads audit their headed teams.
- Invitation creation can send `{ "role": "ADMIN", "email": "<recipient>",
"expiresInHours": 48 }` plus optional position/teamId. Display/copy
  `data.rawCode` once. Lists contain status/metadata, not recoverable raw codes.
  Redemption sends `{ "code": "inv_..." }`; the response has top-level `user`
  and `csrfToken`. No invitation email is sent automatically.
- Most item responses use `{ success, data }`; lists add `pagination`. Task-list
  `count` is page length, not total. Lists default to 20 and allow at most 100
  records per page; use `pagination.totalPages` or load each board column by status.
- History filters: teamId/userId/from/to/timing; `from` includes its timestamp,
  `to` excludes it. Statistics endpoints reject page/limit. Display null rates as
  “—”; on-time rate excludes tasks without deadlines. Lead time means
  creation-to-approval hours, not hours spent working.
- Use TanStack Query keys containing user ID and filters; invalidate board,
  detail/history/statistics after relevant mutations. Clear cached user data on
  logout/account switch. Refetch on focus and use the agreed 10–15-second active
  board polling; no WebSocket interface is implemented.
- Handle 400 validation, 401 login needed, 403 denied/inactive/CSRF, 404 missing,
  409 stale state, 429 limits and 503 unavailable. On 409, refetch and let the user
  retry deliberately; do not automatically replay claims, submissions or reviews.

## 5. Acceptance and remaining work

Verify member/admin/head roles, cross-team denial, duplicate claims, send-back
feedback, session expiry, logout, invitation token rotation and paginated boards.
Treat backend permissions as authoritative even when a button was visible.

Optional in-app notifications can use `GET /notifications?unreadOnly=true` and
`PATCH /notifications/:id/read` with `{}` in existing UI; this depends on a running Redis worker. No new sidebar page is required.

Before release, resolve frontend dependency findings from the audit, coordinate
final origins/cookie behavior, and test real Google login in a browser. GitHub
synchronization/ownership verification is still team work; accepting a PR URL
does not verify that PR or automatically complete the task.

Detailed contracts live in `docs/backend/`. OpenAPI is incomplete; consult the
current routes/schemas/services and `AUDIT_AND_STATUS.md` for discrepancies.
