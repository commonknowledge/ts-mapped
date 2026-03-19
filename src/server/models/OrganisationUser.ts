import type { OrganisationUser } from "@/models/OrganisationUser";
import type { Generated, Insertable, Updateable } from "kysely";

export type OrganisationUserTable = OrganisationUser & {
  id: Generated<number>;
};
export type NewOrganisationUser = Insertable<OrganisationUserTable>;
export type OrganisationUserUpdate = Updateable<OrganisationUserTable>;
