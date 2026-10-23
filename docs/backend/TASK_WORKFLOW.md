# Task Board backend workflow

All endpoints are under `/api/v1` and require a session. The owner/contact remains
`gdgoc.psit@gmail.com`. Use the development login and PostgreSQL setup documented
in `USERS_AND_TEAMS.md` and `DATABASE.md`. Google OAuth remains deferred.

## Endpoints

| Method and path          | Purpose                                          | Who can act                                        |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------- |
| GET `/tasks`             | Paginated, filtered board tasks                  | Any active signed-in user, within visibility scope |
| GET `/tasks/:id`         | Detail, activity, all submission/review attempts | Same visibility scope                              |
| POST `/tasks`            | Create a task, optionally assigned               | Authorized manager                                 |
| PATCH `/tasks/:id`       | Edit task metadata                               | Authorized manager                                 |
| POST `/tasks/:id/assign` | Assign, reassign, or unassign                    | Authorized manager                                 |
| POST `/tasks/:id/claim`  | Claim a Free task                                | Eligible active user                               |
| POST `/tasks/:id/start`  | Start Assigned work                              | Current assignee                                   |
| POST `/tasks/:id/submit` | Submit In Progress work for review               | Current assignee                                   |
| POST `/tasks/:id/review` | Approve or send back                             | Authorized manager other than the assignee         |
| DELETE `/tasks/:id`      | Soft-delete editable work                        | Authorized manager                                 |

Owners and presidents manage all scopes. ADMIN users manage teams they belong to;
USER team heads manage teams they head. Only owners/presidents manage whole-club
tasks. Team tasks are visible to their members and club managers; whole-club tasks
are visible to all active signed-in users. Filters never expand visibility.

## State transitions

| Trigger                             | Required state              | Result               |
| ----------------------------------- | --------------------------- | -------------------- |
| Create without assignee             | New task                    | FREE                 |
| Create with assignee                | New task                    | ASSIGNED             |
| Claim                               | FREE                        | ASSIGNED to claimant |
| Assign/reassign to a different user | FREE, ASSIGNED, IN_PROGRESS | ASSIGNED to new user |
| Unassign using null                 | ASSIGNED, IN_PROGRESS       | FREE                 |
| Start                               | ASSIGNED                    | IN_PROGRESS          |
| Submit                              | IN_PROGRESS                 | IN_REVIEW            |
| Approve                             | IN_REVIEW                   | DONE                 |
| Send back with feedback             | IN_REVIEW                   | IN_PROGRESS          |

Assigning the same user preserves the current state. Unassigning an already Free
task is a no-op. Repeated no-op assignments/metadata updates create no new activity.
Tasks in review or Done cannot be edited, reassigned, or deleted. Send back work
before changing its requirements. Done is terminal in this version; reopening or
cancelling work in review is not implemented.

There is no arbitrary status-update endpoint. Scope and team are fixed after
creation. Assignee changes must use `/assign`; status transitions must use their
dedicated actions. A former assignee cannot start or submit reassigned work.

## Creation and metadata edits

Create a task with:

```json
{
  "title": "Prepare event graphics",
  "description": "Produce the final event banner and announcement graphics.",
  "scope": "TEAM",
  "teamId": "<team-id>",
  "priority": "HIGH",
  "deadline": "2026-11-01T18:00:00+05:30",
  "tags": ["media", "design"]
}
```

`title` is trimmed and must contain 3–150 characters; `description` is trimmed and
must contain 10–10,000. Priority is LOW, MEDIUM (default), HIGH, or URGENT. Deadlines
accept an ISO timestamp with Z or a UTC offset, or null for no deadline. Up to 10
tags of 1–32 characters are trimmed, lowercased, and deduplicated. Unknown fields
are rejected. `creatorId`, status, and completion fields are always server-controlled.

If scope is omitted, a provided team implies TEAM; otherwise scope is WHOLE_CLUB.
TEAM requires an existing teamId; WHOLE_CLUB requires no teamId. Optional assigneeId
must identify an active user who belongs to the team for a team-scoped task.

PATCH accepts any nonempty subset of title, description, priority, deadline, and
tags. Use `deadline: null` or `tags: []` to clear them. Every real metadata change
records before/after values in activity. Concurrent edits are serialized; sequential
edits use the latest persisted state and do not provide client revision/ETag checks.

## Assignment

```json
{ "assigneeId": "<user-id>" }
```

Use `{ "assigneeId": null }` to unassign. Ineligible/inactive assignees return 400;
missing users return 404. Reassigning In Progress work resets it to Assigned so the
new assignee must explicitly start. Previous submissions and activity remain in
the audit trail; they are not transferred or rewritten.

## Submission and review

A submission requires a nonblank note, a valid GitHub PR URL, or both:

```json
{ "note": "Final designs are available at the shared team link." }
```

```json
{
  "prUrl": "https://github.com/PSIT-GDGOC/GDGOC-Task-Management-System/pull/12",
  "note": "Ready for review."
}
```

A supplied PR URL must use HTTPS and the `github.com/<owner>/<repo>/pull/<number>`
format. Query strings, trailing slash, and fragment are removed. This is format
validation; repository access, PR existence, and contributor ownership are not yet
verified. Nontechnical teams can submit a note containing links to their work.
Notes and review comments are trimmed and limited to 2,000 characters.

Review requests are one of:

```json
{ "outcome": "APPROVED", "reviewComment": "Reviewed and accepted." }
```

```json
{ "outcome": "SENT_BACK", "reviewComment": "Please include the missing mobile assets." }
```

Send-back feedback is mandatory. A review requires a pending submission belonging
to the current assignee. Reviewers cannot approve or send back their own assigned
work, even when they are an owner/admin/head. A different authorized manager must
review it. Each resubmission creates a new attempt; every prior review is retained.

Approval records completedAt, completedById (assignee), approvedById, and isOnTime.
Timeliness compares the **approved attempt's submittedAt** to the current task
deadline, not the later approval time. Tasks without deadlines are marked on time.
A resubmission after the deadline is late even if an earlier attempt was on time.
Review timestamps come from PostgreSQL's clock at the review statement.

## Reads and response compatibility

GET `/tasks` supports page (default 1, maximum 100,000), limit (default 20, maximum
100), teamId, assigneeId, scope, status, priority, tag, and search. Search is a
case-insensitive substring match on title/description. Tag lookup is normalized to
lowercase. Order is priority descending, creation time descending, then ID descending.
Each read's results/count use one database snapshot.

```json
{
  "success": true,
  "count": 1,
  "data": [{ "id": "<task-id>", "status": "FREE" }],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

Existing `data` and `count` keys remain, but reads now default to the first 20
records. Clients must fetch subsequent pages using pagination.totalPages; Kanban
clients can paginate by status to fill individual columns. Count is page length,
not the total number of matching tasks. Out-of-range pages return an empty data
array with the actual total.

Single-task and mutation responses use `{ "success": true, "data": { ... } }`.
Task detail returns all attempts/activity; list and mutation responses contain only
the latest submission. Soft-deleted tasks are omitted from normal reads and return
404 for subsequent actions. Their activity and submission history stay in storage.
Completed tasks remain visible for later history/statistics APIs.

## Concurrency, errors, and verification

All mutations refresh actor/account/team grants within a serializable transaction.
State changes, submission/review records, and activity commit together. A failure
rolls them all back. State guards and database constraints prevent duplicate claims,
submissions, or reviews. Competing actions return a single winning transition and
409 for stale/conflicting work; clients should refetch before retrying. No automatic
retry can silently apply a different lifecycle action.

Expect 400 for validation failures, 401 for no session/missing account, 403 for
inactive accounts or forbidden scope/ownership, 404 for missing/deleted records,
and 409 for state conflicts or serialization failures. Validation refinements are
reported in error.details._form; field errors remain under their field names.

Run backend type checks, build, regular tests, and `npm run test:database` with an
explicit TEST_DATABASE_URL. API fixtures create/drop only a unique test schema;
permission and workflow tests use the actual middleware, sessions, and PostgreSQL.
The repository's backend CI runs the same commands using a disposable PostgreSQL
service. No device-specific path, hosted secret, or private database is required.
