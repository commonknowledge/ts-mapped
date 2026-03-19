import z from "zod";

export const airtableWebhookSchema = z.object({
  id: z.string(),
  cursor: z.number(),
});

export type AirtableWebhook = z.infer<typeof airtableWebhookSchema>;
