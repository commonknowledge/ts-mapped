import z from "zod";

export enum OrganisationUserRole {
  Admin = "Admin",
  Member = "Member",
}

export const organisationUserRoleSchema = z.enum(OrganisationUserRole);

export const organisationUserSchema = z.object({
  id: z.number(),
  organisationId: z.string(),
  userId: z.string(),
  role: organisationUserRoleSchema,
});

export type OrganisationUser = z.infer<typeof organisationUserSchema>;
