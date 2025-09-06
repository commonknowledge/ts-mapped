import { Insertable, Updateable } from "kysely";
import z from "zod";

export const airtableWebhookSchema = z.object({
  id: z.string(),
  cursor: z.number(),
});

export type AirtableWebhook = z.infer<typeof airtableWebhookSchema>;

export type AirtableWebhookTable = AirtableWebhook;

export type NewAirtableWebhook = Insertable<AirtableWebhookTable>;
export type AirtableWebhookUpdate = Updateable<AirtableWebhookTable>;
