import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add category and language columns to the themes table
  await db.execute(sql`
    ALTER TABLE "themes"
      ADD COLUMN IF NOT EXISTS "category" varchar NOT NULL DEFAULT 'poetic',
      ADD COLUMN IF NOT EXISTS "language" varchar NOT NULL DEFAULT 'en';
  `)

  // Backfill all existing themes to Poetic / English
  await db.execute(sql`
    UPDATE "themes"
    SET "category" = 'poetic', "language" = 'en'
    WHERE "category" IS NULL OR "language" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "themes"
      DROP COLUMN IF EXISTS "category",
      DROP COLUMN IF EXISTS "language";
  `)
}
