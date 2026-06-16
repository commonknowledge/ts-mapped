import type { WebhookRefreshLog } from "@/models/WebhookRefreshLog";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type WebhookRefreshLogTable = Omit<
  WebhookRefreshLog,
  "id" | "createdAt"
> & {
  id: Generated<string>;
  createdAt: ColumnType<string, string | undefined, never>;
};
export type NewWebhookRefreshLog = Insertable<WebhookRefreshLogTable>;
export type WebhookRefreshLogUpdate = Updateable<WebhookRefreshLogTable>;
