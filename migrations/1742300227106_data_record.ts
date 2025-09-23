/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("dataRecord")
    .addColumn("id", "bigserial", (col) => col.notNull())
    .addColumn("externalId", "text", (col) => col.notNull())
    .addColumn("json", "jsonb", (col) => col.notNull().defaultTo("{}"))
    .addColumn("dataSourceId", "uuid", (col) => col.notNull())
    .addColumn("createdAt", "text", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addUniqueConstraint("dataRecordUnique", ["externalId", "dataSourceId"])
    .addForeignKeyConstraint(
      "dataRecordDataSourceIdFKey",
      ["dataSourceId"],
      "dataSource",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("dataRecord").execute();
}
