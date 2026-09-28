-- Added by hand: CockroachDB 26.2 creates tables with schema_locked = true by
-- default, and a locked table cannot be auto-unlocked inside the migration
-- transaction, so later migrations adding foreign keys to "profiles" would fail.
SET create_table_with_schema_locked = false;

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" STRING NOT NULL,
    "name" STRING NOT NULL,
    "headline" STRING NOT NULL,
    "description" STRING NOT NULL,
    "location" STRING,
    "email" STRING,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_slug_key" ON "profiles"("slug");
