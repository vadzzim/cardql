-- Added by hand, same as in the init migration: new tables must stay unlocked
-- so the foreign keys below (and later ALTERs) can run inside the transaction.
SET create_table_with_schema_locked = false;

-- CreateTable
CREATE TABLE "experience" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "company" STRING NOT NULL,
    "position" STRING NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_pkey" PRIMARY KEY ("id"),
    -- Added by hand: Prisma schema cannot express CHECK constraints.
    CONSTRAINT "experience_period_check" CHECK ("end_date" IS NULL OR "end_date" >= "start_date")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "experience_id" UUID NOT NULL,
    "description" STRING NOT NULL,
    "position" INT4 NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experience_profile_id_start_date_idx" ON "experience"("profile_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_experience_id_position_key" ON "achievements"("experience_id", "position");

-- AddForeignKey
ALTER TABLE "experience" ADD CONSTRAINT "experience_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
