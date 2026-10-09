# AgriRent Backend Test Suite

> **Tests run exclusively against a dedicated local/staging test database.**
> They will **never** run against the production Neon database.

---

## How tests use the database

| Variable | Used by | Source file |
|---|---|---|
| `DATABASE_URL` | Application server (`server.js`) | `backend/.env` |
| `TEST_DATABASE_URL` | Test suite (`npm test`) | `backend/.env.test` |

The test runner loads **only** `backend/.env.test`.
`backend/.env` is **never** loaded or read during testing.

---

## Safety guards in `bookingAvailability.test.js`

1. **Missing `TEST_DATABASE_URL`** → immediate `process.exit(1)` with a visible
   error banner. The test runner never reaches the first DB connection.
2. **`TEST_DATABASE_URL` host contains `neon.tech` or `neondb.io`** → same
   immediate abort. This prevents an accidental Neon staging URL from touching
   production data.

---

## Setting up a local test database

### Prerequisites

- PostgreSQL 14+ installed locally (e.g. via [Postgres.app](https://postgresapp.com/) on macOS,
  `apt install postgresql` on Ubuntu, or the Windows installer).
- `psql` on your PATH.

### Step 1 — create the database

```bash
psql -U postgres -c "CREATE DATABASE agrirent_test;"
```

### Step 2 — apply the schema

```bash
psql -U postgres -d agrirent_test -f backend/db/schema.sql
```

Run the migration files in order if the schema alone is insufficient:

```bash
psql -U postgres -d agrirent_test \
  -f backend/db/migrations/20261005_add_agreement_acceptances.sql \
  -f backend/db/migrations/20261006_add_status_events_and_statuses.sql \
  -f backend/db/migrations/20261006_add_booking_overlap_exclusion.sql
```

### Step 3 — create `backend/.env.test`

Create the file **`backend/.env.test`** (it is git-ignored by `.gitignore`):

```env
# Test database — local only. NEVER point this at Neon or production.
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agrirent_test

# The application still needs a DATABASE_URL to boot the Prisma client
# (bookingController imports prisma/client). Re-use the test DB here too.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agrirent_test
```

> **Why `DATABASE_URL` is also needed here:**
> `bookingController.js` imports `../prisma/client` at module load time.
> The Prisma client reads `DATABASE_URL`. Setting it to the test database in
> `.env.test` ensures Prisma also targets the test database and not production.

### Step 4 — run the tests

```bash
cd backend
npm test
```

Expected first two lines of output:

```
====================================================
RUNNING AGRIRENT BOOKING AVAILABILITY & CONFLICT TESTS
====================================================

Test database: localhost:5432
```

---

## What the tests do

- Insert **temporary users, equipment, and bookings** directly into the test database.
- Run all 14 availability/conflict/state-machine assertions.
- **Delete every temporary record** in the `finally` block before exit — the test
  database is left clean after each run.
- Exit **0** on all-pass, **1** on any failure.

---

## What the tests do NOT do

- They do **not** use `BEGIN / ROLLBACK` transactions (the test data is real rows
  that Prisma can see through the connection pool).
- They do **not** touch `backend/.env` or the production `DATABASE_URL`.
- They do **not** commit or push any code.
