# My Work History and statistics

All routes require a current active session. Lists use page/limit (defaults 1/20,
maximum 100 records per page), deterministic completedAt/ID descending ordering,
and the standard success/data/pagination response.

- GET `/api/v1/history/me`: own completed work, even after leaving an old team.
- GET `/api/v1/history/me/statistics`: own completion statistics.
- GET `/api/v1/history`: administrative completion audit.
- GET `/api/v1/history/statistics`: audit statistics and top ten contributors.

ADMIN, PRESIDENT, and SYSTEM_OWNER can audit club-wide completed work, matching
the original history permission matrix. This read-only audit permission does not
expand their task management or member-directory permissions. A USER who heads a
team can audit only the teams they head; ordinary USER accounts use personal
routes. Personal routes reject attempts to request someone else's history.

Both list and statistics endpoints support teamId, userId, from, to, and timing
(on-time/late/no-deadline). Dates are ISO timestamps; from is inclusive and to is
exclusive. Invalid/inverted ranges return 400. Statistics and lists apply the same
scope/filters and use consistent database snapshots. Only nondeleted DONE tasks
are counted; unfinished work is excluded.

Statistics return totalCompleted, onTime, late, noDeadline, onTimeRate,
averageLeadTimeHours, and byTeam. Audit responses also return topContributors
(maximum ten, sorted deterministically). Lead time is creation-to-approval elapsed
hours, not hours of active effort. The on-time percentage excludes tasks without
an explicit deadline; if no deadline-bearing tasks exist, onTimeRate is null.
Empty results return zero counts, null averages/rates, and empty breakdowns.

Timeliness itself is recorded at approval using the approved submission attempt's
submittedAt, as documented in TASK_WORKFLOW.md. Statistics do not recalculate old
results from today's date. API responses retain approver/completer labels and the
latest approved submission so frontends can render work history directly.
