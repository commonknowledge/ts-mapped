import { db } from "@/server/services/database";
import type { NewWebhookRefreshLog } from "@/server/models/WebhookRefreshLog";

export function createWebhookRefreshLog(log: NewWebhookRefreshLog) {
  return db
    .insertInto("webhookRefreshLog")
    .values(log)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function findWebhookRefreshLogsByDataSourceId(dataSourceId: string) {
  return db
    .selectFrom("webhookRefreshLog")
    .where("dataSourceId", "=", dataSourceId)
    .selectAll()
    .orderBy("createdAt", "desc")
    .execute();
}
