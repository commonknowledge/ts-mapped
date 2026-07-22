/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

/**
 * The date column role is definitionally a date: stamp the Date semantic
 * type on each data source's date column metadata (as imports now do), so
 * existing sources pretty-print dates without waiting for a re-import.
 * Columns with a manually set semantic type are left alone.
 *
 * NB the migration db is the app instance: the query builder speaks
 * camelCase and the JSONPlugin serialises objects itself.
 */
export async function up(db: Kysely<any>): Promise<void> {
  const dataSources = await db
    .selectFrom("dataSource")
    .select(["id", "columnRoles", "columnMetadata"])
    .execute();

  for (const dataSource of dataSources) {
    const dateColumn = dataSource.columnRoles?.dateColumn;
    if (!dateColumn) {
      continue;
    }
    const metadata: any[] = [...(dataSource.columnMetadata ?? [])];
    const existing = metadata.find((m) => m.name === dateColumn);
    if (existing?.semanticType !== undefined) {
      continue;
    }
    if (existing) {
      existing.semanticType = "Date";
    } else {
      metadata.push({
        name: dateColumn,
        description: "",
        valueLabels: {},
        semanticType: "Date",
      });
    }
    await db
      .updateTable("dataSource")
      .set({ columnMetadata: metadata })
      .where("id", "=", dataSource.id)
      .execute();
  }
}

export async function down(): Promise<void> {
  // No-op: the stamped semantic type matches what any re-import would infer
}
