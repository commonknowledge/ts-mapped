import { db } from "@/server/services/database";
import { NewAirtableWebhook } from "../models/AirtableWebhook";

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
