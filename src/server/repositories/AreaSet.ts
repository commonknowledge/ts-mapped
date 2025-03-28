import { NewAreaSet } from "@/server/models/AreaSet";
import { db } from "@/server/services/database";
import { AreaSetCode } from "@/types";

export async function findAreaSetByCode(code: AreaSetCode) {
  return await db
    .selectFrom("areaSet")
    .where("code", "=", code)
    .selectAll()
    .executeTakeFirst();
}

export function insertAreaSet(areaSet: NewAreaSet) {
  return db
    .insertInto("areaSet")
    .values(areaSet)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function listAreaSets() {
  return db.selectFrom("areaSet").selectAll().execute();
}
