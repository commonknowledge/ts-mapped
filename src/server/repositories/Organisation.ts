import { NewOrganisation } from "@/server/models/Organisation";
import { db } from "@/server/services/database";

export function upsertOrganisation(organisation: NewOrganisation) {
  return db
    .insertInto("organisation")
    .values(organisation)
    .onConflict((oc) =>
      oc.columns(["name"]).doUpdateSet({
        name: organisation.name,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
