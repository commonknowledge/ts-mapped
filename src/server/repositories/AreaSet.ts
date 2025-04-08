import { AreaSetCode } from "@/__generated__/types";
import { NewAreaSet } from "@/server/models/AreaSet";
import { db } from "@/server/services/database";

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
