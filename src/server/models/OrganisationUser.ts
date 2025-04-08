import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface OrganisationUserTable {
  id: Generated<number>;
  organisationId: string;
  userId: string;
}

export type OrganisationUser = Selectable<OrganisationUserTable>;
export type NewOrganisationUser = Insertable<OrganisationUserTable>;
export type OrganisationUserUpdate = Updateable<OrganisationUserTable>;
