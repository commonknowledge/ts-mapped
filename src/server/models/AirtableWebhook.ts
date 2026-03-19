import type { AirtableWebhook } from "@/models/AirtableWebhook";
import type { Insertable, Updateable } from "kysely";

export type AirtableWebhookTable = AirtableWebhook;
export type NewAirtableWebhook = Insertable<AirtableWebhookTable>;
export type AirtableWebhookUpdate = Updateable<AirtableWebhookTable>;
