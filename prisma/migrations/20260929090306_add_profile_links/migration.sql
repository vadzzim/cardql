-- Added by hand, same as in the init migration: new tables must stay unlocked
-- so the foreign key below (and later ALTERs) can run inside the transaction.
SET create_table_with_schema_locked = false;

-- CreateTable
CREATE TABLE "links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "label" STRING NOT NULL,
    "url" STRING NOT NULL,
    "position" INT4 NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "links_profile_id_position_key" ON "links"("profile_id", "position");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
