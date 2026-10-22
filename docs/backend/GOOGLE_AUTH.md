# Google sign-in and browser sessions

The server implements Google's authorization-code flow with PKCE S256, random
state and nonce, ten-minute expiry, and an atomic PostgreSQL state-consumption
record. The official `google-auth-library` verifies token signature, audience,
issuer, and expiry. The application also requires a matching nonce and verified
email. Google subject (`sub`), rather than email, is the permanent identity key.
No Google access/refresh/ID token is returned to the frontend or saved in a session.

## Club configuration

Use a Google Cloud project controlled by `gdgoc.psit@gmail.com` and grant named
maintainers access. Create a Web application OAuth client and configure the
consent screen. Basic sign-in requests only openid, email, and profile scopes.
Configure the exact callback URI for each environment, for example:

- Local: `http://localhost:5000/api/v1/auth/google/callback`
- Hosted: `https://<backend-host>/api/v1/auth/google/callback`

Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in the backend
secret environment. CLIENT_ORIGIN and ADMIN_ORIGIN must be exact frontend origins
(no trailing slash/path). The callback redirects only to one of those configured
origins; arbitrary return URLs are rejected. Google credentials are not in Git.

The configured owner email bootstraps the club owner only after verified Google
sign-in or explicit database seeding. Inactive accounts cannot sign in. An existing
email record can be linked automatically only for Google's authoritative Gmail or
Workspace identity; conflicting subjects or non-authoritative preexisting email
links fail closed for administrator review. A matching subject may update the
verified name/email/avatar, subject to unique email constraints.

## Frontend integration (no frontend files changed)

1. Navigate the browser to `GET /api/v1/auth/google?portal=member` (or admin), or
   fetch `/auth/google/url?portal=member` with credentials and navigate to its URL.
2. Google redirects back to the backend callback, which verifies the identity,
   rotates the session identifier, saves an HTTP-only session cookie, and redirects
   to the configured frontend origin. Tokens never appear in that redirect.
3. Fetch `GET /api/v1/auth/me` with `credentials: 'include'` for the current user.
4. Fetch `GET /api/v1/auth/csrf` with credentials. Keep its csrfToken in memory.
5. Send that value as `X-CSRF-Token` with every POST/PATCH/PUT/DELETE that uses the
   authenticated session. Refresh the token after login/session rotation.
6. POST `/api/v1/auth/logout` with credentials and CSRF header. It destroys the
   server session and clears `gdgoc.sid`.

Cross-origin requests must use one of the two configured frontend origins. CORS
allows credentials only for those origins. Mutating requests with an untrusted
Origin are rejected, even when they carry a CSRF token. Requests without Origin
(such as command-line tools) still require the CSRF token when cookie-authenticated.
Signed GitHub webhook requests use HMAC instead of browser CSRF protection.

Production cookies are secure/HTTP-only. Set COOKIE_SAME_SITE=none for frontends
on different sites; browsers may block third-party cookies regardless, so prefer
same-site custom domains for reliable production use. Callback state/nonce checks
also protect sign-in itself. Application responses use no-store cache headers.

## Local development boundary

The development login now requires explicit ENABLE_DEV_LOGIN=true and is always
rejected in production. It is only for a trusted local/test environment, because
it intentionally lets the tester choose a role. The example local environment
opts in; a missing variable leaves it disabled. Production validation refuses
insecure defaults, missing Google/Redis/database settings, non-HTTPS application
URLs, non-TLS Redis, and a database connection that does not require SSL.

Sign-in and invitation routes are rate limited. Production uses Redis-backed
limits when Redis is configured; local tests can use in-memory limits. All Google
network calls have a timeout and do not automatically replay token exchange.

## Verification boundary

Automated tests sign real RS256 test identities and mock only Google's network
responses/certificate retrieval. They exercise PKCE, state/nonce, audience, issuer,
expiry, signature rejection, replay/concurrent callback prevention, session login,
and CSRF/origin rejection. This does not replace a live Google consent test.

A real consent-screen sign-in is pending until the club creates/configures the
Google Cloud OAuth client and deploys the callback URL. Do not mark this external
step complete based on local tests alone.

References: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect),
[Google server OAuth flow](https://developers.google.com/identity/protocols/oauth2/web-server).
