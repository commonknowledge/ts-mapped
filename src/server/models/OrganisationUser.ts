import type { OrganisationUser } from "@/models/OrganisationUser";
import type { Generated, Insertable, Updateable } from "kysely";

export type OrganisationUserTable = Omit<OrganisationUser, "role"> & {
  id: Generated<number>;
  role: Generated<OrganisationUser["role"]>;
};
export type NewOrganisationUser = Insertable<OrganisationUserTable>;
export type OrganisationUserUpdate = Updateable<OrganisationUserTable>;
