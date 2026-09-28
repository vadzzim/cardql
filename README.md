## Project setup

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

## Database

| Command | Purpose |
|---|---|
| `pnpm db:migrate` | Create and apply a new migration after changing `schema.prisma` |
| `pnpm db:deploy` | Apply existing migrations (fresh setup, CI, Docker) |
| `pnpm db:seed` | Fill the database with profile data (safe to re-run) |
| `pnpm db:studio` | Browse data in Prisma Studio |
| `docker compose down -v` | Stop CockroachDB and drop its data volume |

To start over: `pnpm exec prisma migrate reset`, then `pnpm db:seed` (Prisma 7 no longer seeds on reset).
