import { z } from "zod";

export const webhookRefreshActionSchema = z.enum([
  "created",
  "recreated",
  "kept",
  "removed",
  "noop",
  "failed",
]);

export const webhookRefreshLogSchema = z.object({
  id: z.string(),
  runId: z.string(),
  dataSourceId: z.string(),
  dataSourceType: z.string(),
  enabled: z.boolean(),
  success: z.boolean(),
  action: webhookRefreshActionSchema,
  oldWebhookIds: z.array(z.string()),
  newWebhookIds: z.array(z.string()),
  details: z.record(z.string(), z.unknown()).nullish(),
  error: z.string().nullish(),
  createdAt: z.string(),
});

export type WebhookRefreshAction = z.infer<typeof webhookRefreshActionSchema>;
export type WebhookRefreshLog = z.infer<typeof webhookRefreshLogSchema>;
