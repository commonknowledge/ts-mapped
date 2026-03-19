import type { Organisation } from "@/models/Organisation";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type OrganisationTable = Organisation & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewOrganisation = Insertable<OrganisationTable>;
export type OrganisationUpdate = Updateable<OrganisationTable>;
