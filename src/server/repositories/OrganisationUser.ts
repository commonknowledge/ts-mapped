import { NewOrganisationUser } from "@/server/models/OrganisationUser";
import { db } from "@/server/services/database";

export async function createOrganisationUser(
  organisationUser: NewOrganisationUser,
) {
  return db
    .insertInto("organisationUser")
    .values(organisationUser)
    .returningAll()
    .executeTakeFirstOrThrow();
}
