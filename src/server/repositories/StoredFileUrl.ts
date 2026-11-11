import { sql } from "kysely";
import { db } from "@/server/services/database";

/**
 * Everywhere the app stores the full URL of a file in the public bucket. Found
 * by scanning every text and JSON column of the production database for the
 * MinIO host; data_record is left out, as imported records never hold
 * uploaded file URLs.
 */
export const STORED_FILE_URL_COLUMNS = [
  "map.imageUrl",
  "publicMap.imageUrl",
  "user.avatarUrl",
  "organisation.avatarUrl",
  "inspectorDataSourceConfig.screenshotUrl",
  "dataSource.defaultInspectorConfig",
] as const;

export type StoredFileUrlColumn = (typeof STORED_FILE_URL_COLUMNS)[number];

const countAndReplace = async ({
  column,
  from,
  to,
  confirm,
}: {
  column: StoredFileUrlColumn;
  from: string;
  to: string;
  confirm: boolean;
}): Promise<number> => {
  // Only URLs that start with the old origin, never other text containing it
  const prefix = `${from}/%`;
  // Inside JSON the URL is a string value, so it follows a quote
  const jsonPattern = `%"${from}/%`;

  const replaceText = (ref: string) =>
    sql<string>`replace(${sql.ref(ref)}, ${from}, ${to})`;

  switch (column) {
    case "map.imageUrl": {
      if (!confirm) {
        const { count } = await db
          .selectFrom("map")
          .where("imageUrl", "like", prefix)
          .select((eb) => eb.fn.countAll<string>().as("count"))
          .executeTakeFirstOrThrow();
        return Number(count);
      }
      const result = await db
        .updateTable("map")
        .set({ imageUrl: replaceText("image_url") })
        .where("imageUrl", "like", prefix)
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    }
    case "publicMap.imageUrl": {
      if (!confirm) {
        const { count } = await db
          .selectFrom("publicMap")
          .where("imageUrl", "like", prefix)
          .select((eb) => eb.fn.countAll<string>().as("count"))
          .executeTakeFirstOrThrow();
        return Number(count);
      }
      const result = await db
        .updateTable("publicMap")
        .set({ imageUrl: replaceText("image_url") })
        .where("imageUrl", "like", prefix)
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    }
    case "user.avatarUrl": {
      if (!confirm) {
        const { count } = await db
          .selectFrom("user")
          .where("avatarUrl", "like", prefix)
          .select((eb) => eb.fn.countAll<string>().as("count"))
          .executeTakeFirstOrThrow();
        return Number(count);
      }
      const result = await db
        .updateTable("user")
        .set({ avatarUrl: replaceText("avatar_url") })
        .where("avatarUrl", "like", prefix)
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    }
    case "organisation.avatarUrl": {
      if (!confirm) {
        const { count } = await db
          .selectFrom("organisation")
          .where("avatarUrl", "like", prefix)
          .select((eb) => eb.fn.countAll<string>().as("count"))
          .executeTakeFirstOrThrow();
        return Number(count);
      }
      const result = await db
        .updateTable("organisation")
        .set({ avatarUrl: replaceText("avatar_url") })
        .where("avatarUrl", "like", prefix)
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    }
    case "inspectorDataSourceConfig.screenshotUrl": {
      if (!confirm) {
        const { count } = await db
          .selectFrom("inspectorDataSourceConfig")
          .where("screenshotUrl", "like", prefix)
          .select((eb) => eb.fn.countAll<string>().as("count"))
          .executeTakeFirstOrThrow();
        return Number(count);
      }
      const result = await db
        .updateTable("inspectorDataSourceConfig")
        .set({ screenshotUrl: replaceText("screenshot_url") })
        .where("screenshotUrl", "like", prefix)
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    }
    case "dataSource.defaultInspectorConfig": {
      const matches = sql<boolean>`default_inspector_config::text LIKE ${jsonPattern}`;
      if (!confirm) {
        const { count } = await db
          .selectFrom("dataSource")
          .where(matches)
          .select((eb) => eb.fn.countAll<string>().as("count"))
          .executeTakeFirstOrThrow();
        return Number(count);
      }
      const result = await db
        .updateTable("dataSource")
        .set({
          defaultInspectorConfig: sql`replace(default_inspector_config::text, ${`"${from}/`}, ${`"${to}/`})::jsonb`,
        })
        .where(matches)
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    }
  }
};

/**
 * Points stored file URLs at a new MinIO origin, for when MinIO moves.
 * `from` and `to` are origins, such as https://old.onrender.com. Without
 * `confirm`, only counts the URLs that would change.
 */
export async function replaceStoredFileOrigin({
  from,
  to,
  confirm,
}: {
  from: string;
  to: string;
  confirm: boolean;
}): Promise<{ column: StoredFileUrlColumn; count: number }[]> {
  const counts: { column: StoredFileUrlColumn; count: number }[] = [];
  for (const column of STORED_FILE_URL_COLUMNS) {
    const count = await countAndReplace({ column, from, to, confirm });
    counts.push({ column, count });
  }
  return counts;
}
