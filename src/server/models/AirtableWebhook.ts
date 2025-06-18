import { Insertable, Selectable, Updateable } from "kysely";

export interface AirtableWebhookTable {
  id: string;
  cursor: number;
}

export type AirtableWebhook = Selectable<AirtableWebhookTable>;
export type NewAirtableWebhook = Insertable<AirtableWebhookTable>;
export type AirtableWebhookUpdate = Updateable<AirtableWebhookTable>;
