import { z } from "zod";

export const invitationSchema = z.object({
  id: z.string(),
  email: z.string().email().trim().toLowerCase(),
  name: z.string().trim(),
  organisationId: z.string(),
  senderOrganisationId: z.string(),
  userId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  used: z.boolean(),
  trialDays: z.number().nullish(),
});

export type Invitation = z.infer<typeof invitationSchema>;
