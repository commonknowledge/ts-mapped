/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`SET TIME ZONE UTC`.execute(db);

	await sql`
	  ALTER TABLE "data_source"
      ALTER COLUMN "created_at"
			  SET DATA TYPE TIMESTAMP
        USING "created_at"::timestamp with time zone;
	`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
	.alterTable("dataSource")
	.alterColumn("createdAt", (col) =>
		col.setDataType("text")
	)
	.execute();
}
