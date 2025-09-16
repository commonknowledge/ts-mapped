import z from "zod";
import type { Generated, Insertable, Updateable } from "kysely";

export const organisationUserSchema = z.object({
  id: z.number(),
  organisationId: z.string(),
  userId: z.string(),
});

export type OrganisationUser = z.infer<typeof organisationUserSchema>;

export type OrganisationUserTable = OrganisationUser & {
  id: Generated<number>;
};
export type NewOrganisationUser = Insertable<OrganisationUserTable>;
export type OrganisationUserUpdate = Updateable<OrganisationUserTable>;
