# cardql

A digital business card as a GraphQL API: one profile with links, skills,
work experience with achievements, and projects. Built with NestJS, GraphQL
(Apollo, code-first), Prisma 7 and CockroachDB; runs with one Docker Compose
command.

## Quick start

With Docker running:

```bash
docker compose up --build
```

No local Node.js, pnpm, or `.env` file is required. Compose waits for the database
healthcheck, then the application applies migrations, seeds the profile, and starts
NestJS. If migrations or seed fail, the application does not start.

- Apollo Sandbox: http://localhost:3000/graphql
- CockroachDB UI: http://localhost:8080

Use `docker compose down` to stop and remove the containers; database data stays
in a volume. To change the host ports, copy `.env.example` to `.env` and adjust
`PORT`, `DB_PORT`, or `DB_UI_PORT`. Inside Docker, the app always connects to `db:26257`.

## API

Try this query in Sandbox:

```graphql
query {
  profile {
    name
    headline
    description
    links {
      label
      url
    }
    skills {
      name
    }
    projects {
      name
      url
    }
    experience {
      company
      position
      startDate
      endDate
      achievements {
        description
      }
    }
  }
}
```

- Links, skills, projects and achievements come in the order of the seed file.
- Experience comes newest first. `startDate` and `endDate` are months in `YYYY-MM`
  format; `endDate` is `null` for the current job.
- Without seeded data, `profile` fails with the `NOT_FOUND` error code.

The full schema is in [`schema.gql`](schema.gql), generated from the code on every
development start.

## Profile data

The profile lives in [`prisma/seed-data/profile.ts`](prisma/seed-data/profile.ts).
Edit it and run `docker compose up --build` again.

Seed runs on every application container start: in one transaction it deletes the
card owner's profile with all related data and creates it again from the file, so
the database always matches the file; other profiles are left alone. All ids
change on every run. The file is validated first (required fields, `http(s)` URLs, unique names, `YYYY-MM` months,
end month not before start month); invalid data stops the start and keeps the
previous profile.

### Generated profiles

`pnpm db:seed:fake --count 500` adds generated profiles for development and load
tests; they are never seeded on container start. A hand-written factory
([`fake-profile.ts`](prisma/seed-data/fake-profile.ts)) builds each one with
[Faker](https://fakerjs.dev) and passes it through the same validation and seed
code as the real profile. Faker supplies names, companies and places; skills,
job titles and achievements come from short curated lists, because Faker has no
technology vocabulary. Careers are consecutive jobs without overlaps.

Profile `N` always comes out the same: every index has its own generator seeded
with that index, and periods count back from a fixed month, not today. A re-run
replaces all generated profiles (slugs `fake-0`, `fake-1`, …) and keeps the card
owner's one; `--count 0` removes them. Each profile is written in its own
transaction, since one large transaction would contend and retry on CockroachDB.

## Architecture

```
src/
  profile/       Profile query; links, skills and projects
  experience/    Profile.experience and achievements
  prisma/        PrismaService, shared by all repositories
  config/        environment validation
  common/        GraphQL error formatting, per-request DataLoader helpers
prisma/
  schema.prisma, migrations/
  seed-data/     profile data, its validation schema, fake profile factory
test/            e2e tests against a real CockroachDB, smoke test
```

Each feature module has three layers:

- **Resolver** — the GraphQL API: schema types and field resolution, through
  per-request loaders for relations.
- **Service** — business logic: which profile is the card owner's, what happens
  when it is missing, how batched rows map to entries.
- **Repository** — data access: the only layer that queries the database.

Services throw Nest's standard exceptions and know nothing about GraphQL; a single
`formatError` maps them to GraphQL error codes and hides internal error messages
in production.

## Design decisions

- **Relations are resolved lazily.** Every relation is a separate field resolver,
  so a query pays only for the fields it asks for.
- **No N+1 for nested lists.** Every relation (`links`, `skills`, `projects`,
  `experience`, `achievements`) goes through a DataLoader: it collects the parent
  ids of one request and loads all their rows with a single
  `WHERE parent_id IN (...)` query, so the number of queries depends on the shape
  of the query, not on the amount of data. Today there is one profile, but
  `experience { achievements }` already has many parents, and a list of profiles
  needs no changes in the relation resolvers. E2e tests check that each relation
  is queried once per request.
- **Loaders are per request without request-scoped providers.** Nest's
  `Scope.REQUEST` would spread to the resolvers and recreate them on every
  request. Instead, a singleton keeps loaders in a `WeakMap` keyed by the
  request's GraphQL context.
- **`experience` is its own module.** It adds the `Profile.experience` field from
  its side, so the profile module does not depend on it.
- **Periods have month precision**, as in a CV. The database stores a `DATE` (the
  first day of the month); the API returns `YYYY-MM`. A `CHECK` constraint added
  to the migration by hand keeps the end month from preceding the start month,
  since Prisma schema cannot express it.
- **Order is data.** Links, skills, projects and achievements have a `position`
  column with a unique index per parent, filled from the array order in the seed
  file. Experience needs no such column: it is ordered by dates.
- **Seed recreates instead of upserting.** Upserts would have to find and delete
  rows removed from the file; recreating in one transaction is simpler and always
  exact. The seed validation schema is checked against the Prisma types at compile
  time, so a schema change cannot silently break the seed.
- **UUID primary keys generated by the database**, as CockroachDB recommends over
  sequential ids to spread writes across ranges.
- **Startup fails fast.** Environment variables are validated with Zod, and the
  app runs a real query on start, because Prisma's driver adapter connects lazily.
- **One-stage Docker image with dev dependencies.** The container applies
  migrations with the Prisma CLI and runs the TypeScript seed with `tsx` before
  NestJS starts, so both have to be in the runtime image anyway; a separate
  production-only stage would save little and add a second dependency install.

## Local development

Stop the Docker application first if it is running (`docker compose stop app`),
so the HTTP port is available for the local NestJS process.

```bash
pnpm install
cp .env.example .env
docker compose up -d db
pnpm db:deploy
pnpm prisma:generate
pnpm db:seed
pnpm start:dev
```

## Tests

```bash
# everything that does not need a database: format, lint, typecheck, unit tests
pnpm check

# e2e tests, need the database: docker compose up -d db
pnpm test:e2e

# query a running app (docker compose up) and compare it with seed-data
pnpm smoke

# unit test coverage
pnpm test:cov
```

`pnpm check` regenerates the Prisma client first, because typecheck and type-aware
lint need its types; like `prisma generate`, it needs `DATABASE_URL` (from `.env`).

E2E tests use a separate `cardql_test` database on the same server: it is created
and migrated automatically before the run, so development data is never touched.

CI (GitHub Actions) runs on every push to `main` and every pull request:
`pnpm check`, e2e tests against CockroachDB from `docker compose`, and
`pnpm build`. Then it starts the whole application from scratch with
`docker compose up --build`, waits for the app healthcheck and runs `pnpm smoke`:
the API must return exactly the profile from `prisma/seed-data`.

## Database

| Command | Purpose |
|---|---|
| `pnpm db:migrate` | Create and apply a new migration after changing `schema.prisma` |
| `pnpm db:deploy` | Apply existing migrations (fresh setup, CI, Docker) |
| `pnpm db:seed` | Recreate the profile from `prisma/seed-data` (safe to re-run) |
| `pnpm db:seed:fake --count N` | Replace generated profiles with `N` new ones (default 100) |
| `pnpm db:studio` | Browse data in Prisma Studio |
| `docker compose down -v` | Stop and remove the app and database containers, network, and database data volume |

To start over: `pnpm exec prisma migrate reset`, then `pnpm db:seed` (Prisma 7 no longer seeds on reset).
