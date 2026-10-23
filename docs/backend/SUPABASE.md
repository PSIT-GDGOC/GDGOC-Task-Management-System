# Supabase PostgreSQL setup

Supabase is the chosen hosted PostgreSQL provider instead of Neon. This changes
the database hosting plan; Express, Prisma 5, Google login and PostgreSQL sessions
keep their current design. The club project is now created and reports Healthy:
`vbxvyrbombsjqkuuymng`. Follow `DEPLOYMENT_HANDOFF.md` for current deployment
progress and verification; the older audit records a previous snapshot.

## Club project and connections

1. Create/select a project owned by the club account/organization associated with
   `gdgoc.psit@gmail.com`. Share access with named maintainers. Keep database
   passwords in club-controlled secret storage.
2. Follow Supabase's Prisma guide to create a database role for Prisma. This
   repository uses Prisma 5: retain the existing `schema.prisma` datasource and
   client initialization; do not copy newer Prisma adapter/config code into it.
3. In **Connect**, copy the **Session pooler** URL on port **5432**. Its IPv4
   support suits the persistent Express backend, Prisma and the PostgreSQL session
   adapter. Use that mode for both URLs initially. `DIRECT_URL` is the variable
   consumed by migration commands; it can use the session pooler when the direct
   endpoint is unreachable. Do not use transaction-pooler port 6543 for migrations.
4. Keep `schema=public` and require SSL. URL-encode the password, and copy the
   actual hostname/user from the dashboard rather than guessing them:

```dotenv
# Illustrative placeholders only; enter real values in backend/.env or hosting secrets.
DATABASE_URL="postgresql://prisma.PROJECT_REF:PASSWORD_URL_ENCODED@SESSION_POOLER_HOST:5432/postgres?schema=public&sslmode=require"
DIRECT_URL="postgresql://prisma.PROJECT_REF:PASSWORD_URL_ENCODED@SESSION_POOLER_HOST:5432/postgres?schema=public&sslmode=require"
```

## Keep the application boundary

The frontend continues calling Express `/api/v1`; it does not query Supabase
tables directly. Our roles, invitations and task permissions live in Express.
Disable the project's **Data API** before adding application tables, as Supabase
recommends for Prisma-only access. Current migrations do not create RLS policies;
do not expose these tables through a separate API that bypasses backend checks.

Supabase Auth has Google login, but it still needs Google OAuth credentials.
Adopting it would be a separate authentication migration, not part of this
database-provider change. Keep the existing frontend authentication contract.

## Apply and verify

On an approved fresh project, using the backend secret environment:

```sh
npm run prisma:validate
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run prisma:status
```

Set `SYSTEM_OWNER_EMAIL=gdgoc.psit@gmail.com` before seeding. For an existing
populated project, inspect/baseline first; never reset it. Verify connection,
migrations, session persistence and API permissions before calling setup complete.
Continue running integration tests against a disposable local PostgreSQL database,
not this shared project. Leave real credentials out of Git and frontend `.env`.

Sources: [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma),
[PostgreSQL connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres),
[Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google).
