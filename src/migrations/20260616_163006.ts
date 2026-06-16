import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "correspondences" DROP CONSTRAINT "correspondences_theme_id_themes_id_fk";
  
  DROP INDEX "correspondences_theme_idx";
  ALTER TABLE "correspondences" ADD COLUMN "theme_order" jsonb;
  ALTER TABLE "correspondences" DROP COLUMN "theme_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "correspondences" ADD COLUMN "theme_id" integer;
  ALTER TABLE "correspondences" ADD CONSTRAINT "correspondences_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "correspondences_theme_idx" ON "correspondences" USING btree ("theme_id");
  ALTER TABLE "correspondences" DROP COLUMN "theme_order";`)
}
