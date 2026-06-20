import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_themes_category" AS ENUM('poetic', 'nature', 'abstract', 'urban', 'seasonal');
  CREATE TYPE "public"."enum_themes_language" AS ENUM('en', 'sv', 'fr', 'es', 'de');
  ALTER TABLE "correspondences" ALTER COLUMN "penpal_first_name" DROP NOT NULL;
  ALTER TABLE "correspondences" ADD COLUMN "left_token" varchar;
  ALTER TABLE "correspondences" ADD COLUMN "right_token" varchar;
  ALTER TABLE "themes" ADD COLUMN "category" "enum_themes_category" DEFAULT 'poetic' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "language" "enum_themes_language" DEFAULT 'en' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "correspondences" ALTER COLUMN "penpal_first_name" SET NOT NULL;
  ALTER TABLE "correspondences" DROP COLUMN "left_token";
  ALTER TABLE "correspondences" DROP COLUMN "right_token";
  ALTER TABLE "themes" DROP COLUMN "category";
  ALTER TABLE "themes" DROP COLUMN "language";
  DROP TYPE "public"."enum_themes_category";
  DROP TYPE "public"."enum_themes_language";`)
}
