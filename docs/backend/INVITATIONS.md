# Admin invitation lifecycle

Routes remain under `/api/v1/auth/invitations`, with active session and CSRF
required for writes. Only SYSTEM_OWNER/PRESIDENT can list or issue invitations.
Only SYSTEM_OWNER may issue, list, or revoke PRESIDENT invitations. Owner grants
are forbidden. President lists are restricted to ADMIN invitations.

- POST `/`: role (ADMIN default or PRESIDENT), position, teamId, recipient email,
  and expiresInHours (integer 1–168, default 48). Team must exist. Recipient email
  is optional; when supplied it is normalized and enforced during redemption.
- GET `/?status=ACTIVE|USED|EXPIRED|REVOKED&page=1&limit=20`: metadata/status only.
- POST `/:id/revoke`: idempotent revocation of an unused invitation. Used tokens
  return 409 rather than undoing a role grant.
- POST `/redeem`: `{ "code": "inv_..." }` grants the intended role and optional
  team-head membership. The response rotates the session and includes a fresh
  csrfToken; replace the frontend's previous token before the next write.

Tokens contain 32 random bytes. Only their SHA-256 digests are stored. A raw code
is returned exactly once during creation and is absent from lists and logs. Share
an unbound code as a bearer credential; prefer recipient email binding. An email
field does not send an email—delivery remains manual via an authorized channel.

Redemption checks account/issuer activity, current issuer authority, recipient,
expiry, revocation, prior use, and role hierarchy. Owner accounts and presidents
cannot be downgraded by ADMIN invitations. Redemption updates the token, role,
team membership, and audit event in one serializable transaction. Competing
redemptions have one winner; losers receive 409. Revocation cannot race to leave
an invitation both revoked and granted. Outstanding invitations from an issuer
who loses grant authority are rejected. Expiry/status use PostgreSQL time.

The AdminEvent table records creation, revocation, and redemption without raw
codes or token digests. Invite management is rate limited per authenticated user.
Used records and audit events remain available for investigation; expired/revoked
codes cannot be revived. Multiple president-role accounts are supported; a policy
requiring exactly one president would need an explicit organizational rule.
