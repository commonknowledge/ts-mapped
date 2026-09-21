/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

/**
 * The "Name columns" multi-select used to save the column name after cmdk had
 * trimmed it, and String.prototype.trim() also strips a leading byte order
 * mark. A column named "﻿Title" was therefore stored as "Title" in the
 * data source's column roles, which no record key matches, and public maps
 * created from that data source copied the broken name into their listing
 * config. Restore the real column name wherever a stored name matches no
 * column def but a column def trims to it.
 *
 * NB the migration db is the app instance: the query builder speaks
 * camelCase and the JSONPlugin serialises objects itself.
 */

/**
 * Map a stored column name to the real column def name: unchanged when it
 * already matches a column def, otherwise the unique column def that trims
 * to it, otherwise unchanged (nothing to restore).
 */
const restoreName = (name: string, columnNames: string[]): string => {
  if (!name || columnNames.includes(name)) {
    return name;
  }
  const candidates = columnNames.filter((c) => c.trim() === name);
  return candidates.length === 1 ? candidates[0] : name;
};

const restoreConfig = (config: any, columnNames: string[]): any => ({
  ...config,
  nameColumns: (config.nameColumns ?? []).map((n: string) =>
    restoreName(n, columnNames),
  ),
  descriptionColumn: restoreName(config.descriptionColumn ?? "", columnNames),
  dateColumn: restoreName(config.dateColumn ?? "", columnNames),
});

export async function up(db: Kysely<any>): Promise<void> {
  const dataSources = await db
    .selectFrom("dataSource")
    .select(["id", "columnRoles", "columnDefs"])
    .execute();

  const columnNamesById = new Map<string, string[]>();
  for (const dataSource of dataSources) {
    const columnNames: string[] = (dataSource.columnDefs ?? []).map(
      (cd: any) => cd.name,
    );
    columnNamesById.set(dataSource.id, columnNames);

    const roles = dataSource.columnRoles ?? {};
    const restored = {
      ...roles,
      nameColumns: (roles.nameColumns ?? []).map((n: string) =>
        restoreName(n, columnNames),
      ),
      ...(roles.dateColumn
        ? { dateColumn: restoreName(roles.dateColumn, columnNames) }
        : {}),
    };
    if (JSON.stringify(restored) === JSON.stringify(roles)) {
      continue;
    }
    await db
      .updateTable("dataSource")
      .set({ columnRoles: restored })
      .where("id", "=", dataSource.id)
      .execute();
  }

  const publicMaps = await db
    .selectFrom("publicMap")
    .select(["id", "dataSourceConfigs", "draft"])
    .execute();

  for (const publicMap of publicMaps) {
    const restoreConfigs = (configs: any[]) =>
      configs.map((c) =>
        restoreConfig(c, columnNamesById.get(c.dataSourceId) ?? []),
      );

    const dataSourceConfigs = restoreConfigs(publicMap.dataSourceConfigs ?? []);
    const draft = publicMap.draft
      ? {
          ...publicMap.draft,
          dataSourceConfigs: restoreConfigs(
            publicMap.draft.dataSourceConfigs ?? [],
          ),
        }
      : null;

    const unchanged =
      JSON.stringify(dataSourceConfigs) ===
        JSON.stringify(publicMap.dataSourceConfigs ?? []) &&
      JSON.stringify(draft) === JSON.stringify(publicMap.draft);
    if (unchanged) {
      continue;
    }
    await db
      .updateTable("publicMap")
      .set({ dataSourceConfigs, draft })
      .where("id", "=", publicMap.id)
      .execute();
  }
}

export async function down(): Promise<void> {
  // No-op: the restored names are the ones the user originally selected
}
