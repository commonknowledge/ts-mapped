import { NewAirtableWebhook } from "@/server/models/AirtableWebhook";
import { db } from "@/server/services/database";

export async function findAirtableWebhookById(id: string) {
  return await db
    .selectFrom("airtableWebhook")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export function upsertAirtableWebhook(airtableWebhook: NewAirtableWebhook) {
  return db
    .insertInto("airtableWebhook")
    .values(airtableWebhook)
    .onConflict((oc) =>
      oc.columns(["id"]).doUpdateSet({
        cursor: airtableWebhook.cursor,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
