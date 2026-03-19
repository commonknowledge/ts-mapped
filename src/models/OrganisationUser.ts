import z from "zod";
export const organisationUserSchema = z.object({
  id: z.number(),
  organisationId: z.string(),
  userId: z.string(),
});

export type OrganisationUser = z.infer<typeof organisationUserSchema>;
