import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "correspondences"
      ADD COLUMN IF NOT EXISTS "left_token" varchar,
      ADD COLUMN IF NOT EXISTS "right_token" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "correspondences"
      DROP COLUMN IF EXISTS "left_token",
      DROP COLUMN IF EXISTS "right_token";
  `)
}
