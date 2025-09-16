import { db } from "@/server/services/database";
import type { AreaSetCode } from "@/__generated__/types";
import type { NewAreaSet } from "@/server/models/AreaSet";

export async function findAreaSetByCode(code: AreaSetCode) {
  return await db
    .selectFrom("areaSet")
    .where("code", "=", code)
    .selectAll()
    .executeTakeFirst();
}

export function createAreaSet(areaSet: NewAreaSet) {
  return db
    .insertInto("areaSet")
    .values(areaSet)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function listAreaSets() {
  return db.selectFrom("areaSet").selectAll().execute();
}
