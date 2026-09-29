## Run with Docker

With Docker running, start the entire application:

```bash
docker compose up --build
```

No local Node.js, pnpm, or `.env` file is required. Compose waits for the database
healthcheck, then the application applies migrations, seeds the profile, and starts
NestJS. If migrations or seed fail, the application does not start.

- Apollo Sandbox: http://localhost:3000/graphql
- CockroachDB UI: http://localhost:8080

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
  }
}
```

Edit `prisma/seed-data/profile.ts` and run `docker compose up --build` again to
update the profile, its links and skills. Seed runs on every application container
start: it deletes the existing profile with its links and skills and creates it
again from `seed-data`, so the database always matches the file and links and
skills follow the order of their arrays. Profile, link and skill ids change on
every run.

Use `docker compose down` to stop and remove the containers; database data stays
in a volume. To change the host ports, copy `.env.example` to `.env` and adjust
`PORT`, `DB_PORT`, or `DB_UI_PORT`. Inside Docker, the app always connects to `db:26257`.

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
```

CockroachDB UI: http://localhost:8080

## Compile and run the project

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Run tests

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

E2E tests need CockroachDB running (`docker compose up -d db`). They use a separate `cardql_test` database on the same server: it is created and migrated automatically before the run, so development data is never touched.

## Database

| Command | Purpose |
|---|---|
| `pnpm db:migrate` | Create and apply a new migration after changing `schema.prisma` |
| `pnpm db:deploy` | Apply existing migrations (fresh setup, CI, Docker) |
| `pnpm db:seed` | Fill the database with profile data, links and skills (safe to re-run) |
| `pnpm db:studio` | Browse data in Prisma Studio |
| `docker compose down -v` | Stop and remove the app and database containers, network, and database data volume |

To start over: `pnpm exec prisma migrate reset`, then `pnpm db:seed` (Prisma 7 no longer seeds on reset).
