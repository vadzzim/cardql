FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@12.6.0

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Prisma CLI and tsx are also needed at runtime for migrations and seed.
RUN pnpm install --frozen-lockfile

COPY . .
# Prisma config requires a URL during generation; the build never connects to it.
RUN DATABASE_URL=postgresql://root@localhost:26257/cardql?sslmode=disable pnpm build

ENV NODE_ENV=production
ENV PATH="/app/node_modules/.bin:$PATH"
USER node
EXPOSE 3000

CMD ["sh", "-c", "prisma migrate deploy && prisma db seed && exec node dist/main.js"]
