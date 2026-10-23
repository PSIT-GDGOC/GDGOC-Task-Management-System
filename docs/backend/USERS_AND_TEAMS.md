# Users, teams, and access rules

This is the backend stage following the database foundation. It keeps Express,
uses the existing development login for local testing, and does not implement
Google OAuth or change frontend files. All paths below are relative to `/api/v1`.

## Permission rules

| Capability                                            | System owner / President | ADMIN                   | USER team head          | Ordinary USER |
| ----------------------------------------------------- | ------------------------ | ----------------------- | ----------------------- | ------------- |
| Read/update own profile                               | Yes                      | Yes                     | Yes                     | Yes           |
| View team names/descriptions                          | All                      | All                     | All                     | All           |
| View team rosters                                     | All                      | Joined teams            | Joined teams            | Joined teams  |
| Search member directory                               | All members              | Members of joined teams | Members of headed teams | No            |
| Create/edit teams                                     | Yes                      | No                      | No                      | No            |
| Add/remove ordinary members                           | All teams                | Joined teams            | Headed teams            | No            |
| Appoint/demote heads or change privileged memberships | Yes                      | No                      | No                      | No            |
| Activate/deactivate USER or ADMIN accounts            | Yes                      | No                      | No                      | No            |
| Create/review/delete team tasks                       | All teams                | Joined teams            | Headed teams            | No            |
| Create/review/delete whole-club tasks                 | Yes                      | No                      | No                      | No            |

Being an ADMIN does not grant access to unrelated teams. `isTeamHead` is scoped to
one membership; it does not promote the user's global role. Multiple heads are
allowed because the schema represents the flag per membership. Team summaries
contain no roster; roster responses include member contact/profile information.

`requireAuth` loads the user, active flag, role, and memberships from PostgreSQL
on every authenticated request. A session identifies an account and is not the
source of permission truth. Role/head/membership revocations apply to the next
request without requiring logout. Inactive accounts receive 403; missing accounts
or sessions receive 401. Permissions checked for an already-running request are
not retroactively cancelled by a later account update.

## Profile endpoints

- `GET /users/me`: own profile, active status, memberships, and team summaries.
- `PATCH /users/me`: accepts `position` and/or `githubUsername`. Both accept null
  to clear them. Position is trimmed (1–100 characters); GitHub username is
  normalized to lowercase, validated (1–39 characters), and unique.

Email, verified name, avatar, role, active status, and memberships cannot be
changed through profile editing. Unknown fields and empty updates return 400.
GitHub username entry is a profile association, not proof of GitHub ownership.

Example request:

```json
{ "position": "Backend Developer", "githubUsername": "example-contributor" }
```

## Directory and account status

- `GET /users?page=1&limit=20`: scoped member directory.
- Optional filters: `search` (name/email), `teamId`, `role`, and
  `isActive=true|false`. A forbidden team filter returns 403.
- `PATCH /users/:userId/status`: `{ "isActive": false }` or
  `{ "isActive": true }`; club managers only.

Leadership accounts, the configured club bootstrap email (`gdgoc.psit@gmail.com`),
and the acting user's own account are protected from status changes through this
endpoint. No role-change endpoint is provided; role elevation remains in the
invitation workflow. Deactivation preserves records and assignment history; task
reassignment is a later lifecycle feature.

## Team endpoints

- `GET /teams`: paginated team summaries.
- `GET /teams/:teamId`: one summary.
- `POST /teams`: create using `{ "name": "Design", "slug": "design",
"description": "Club design work" }`; club managers only.
- `PATCH /teams/:teamId`: update any of those fields; club managers only.
- `GET /teams/:teamId/members`: paginated roster in an authorized team.
- `PUT /teams/:teamId/members/:userId`: send `{}` to add an ordinary member or
  preserve their existing head flag. Club managers may send
  `{ "isTeamHead": true }` or `{ "isTeamHead": false }` to set the flag.
- `DELETE /teams/:teamId/members/:userId`: remove a membership, not the user.

Name is trimmed (2–80 characters). Slug is normalized to lowercase and permits
letters, numbers, and single hyphen separators (2–80 characters). Description is
optional/nullable with a maximum of 1,000 characters. Duplicate name/slug returns 409. Missing records return 404 when the caller has the relevant scope.

Inactive users cannot be added. Scoped managers cannot alter heads or privileged
accounts. Repeated PUT requests do not create duplicate memberships. Active,
nondeleted team task assignments must be reassigned before removing a membership;
otherwise removal returns 409. Completed work and audit history are retained.
Task creation, task claims, and membership changes use serializable transactions
to prevent concurrent claims/assignments from bypassing membership removal
checks. A transaction conflict returns 409; refetch current state before retrying.

## Response format and errors

Single-record responses use `{ "success": true, "data": { ... } }`.
Directories and rosters use:

```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

Page defaults to 1 (maximum 100,000); limit defaults to 20 (maximum 100). Lists
have deterministic ordering. Deletion returns a success/message response. Errors
use the existing `{ "success": false, "error": { "message": "...", "code": "..." } }`
envelope with 400, 401, 403, 404, or 409 as appropriate. Conflicts do not expose raw
database messages.

Interactive documentation: `/api/v1/docs`; machine-readable contract:
`/api/v1/docs/openapi.json`. Send session cookies on authenticated requests.

## Existing task API changes

Task reads now require a session. Members, admins, and heads see club-wide tasks
plus tasks in teams they belong to. Club managers see all tasks. Filtering or
searching cannot widen that scope. Creating, reviewing, and deleting tasks checks
the owning team's management permission. Only club managers manage club-wide
tasks. An initial assignee must be active and belong to the task's team when the
task is team-scoped. Claim/start/submit still require their existing assignee and
membership conditions. The completed task workflow, including assignment,
metadata edits, pagination, nontechnical submissions, and review rules, is
documented in [Task Board workflow](TASK_WORKFLOW.md).

## Local testing and production boundary

Use the setup in `DATABASE.md`, then:

```sh
npm run dev:backend
```

For local development, `POST /api/v1/auth/dev-login` accepts an email and optional
role (`USER`, `ADMIN`, `PRESIDENT`, `SYSTEM_OWNER`). Use
`gdgoc.psit@gmail.com` for the club owner; other fixture identities should be
synthetic. Save the response cookie and send it with subsequent API requests.
The development endpoint can intentionally switch roles and must not be exposed
as a public authentication mechanism. It rejects production requests and inactive
accounts. Login regenerates the session identifier; logout destroys the session
and clears `gdgoc.sid`.

Google OAuth remains deferred. The backend is ready for local/team API testing,
not a completed production sign-in flow. Hosted production requires real Google
verification before users can sign in.

Run `npm run test:database` with an explicit `TEST_DATABASE_URL` for real API
permission tests against PostgreSQL. The same suite runs in the repository's
backend GitHub Actions workflow without private hosted database credentials.
