/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS "postgis";`.execute(db);

  await db.schema
    .createTable("areaSet")
    .addColumn("id", "bigserial", (col) => col.primaryKey())
    .addColumn("code", "text", (col) => col.unique().notNull())
    .addColumn("name", "text", (col) => col.unique().notNull())
    .execute();

  await db.schema
    .createTable("area")
    .addColumn("id", "bigserial", (col) => col.primaryKey())
    .addColumn("code", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("geography", sql`geography`, (col) => col.notNull())
    .addColumn("areaSetId", "bigint", (col) => col.notNull())
		.addUniqueConstraint("areaUnique", ["code", "areaSetId"])
		.addForeignKeyConstraint("areaSetIdFKey", ["areaSetId"], "areaSet", ["id"], 
      (cb) => cb.onDelete("cascade").onUpdate("cascade")
    )
    .execute();

	await sql`CREATE INDEX area_geography_gist ON area USING GIST (geography)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("area").execute();
  await db.schema.dropTable("areaSet").execute();
}
