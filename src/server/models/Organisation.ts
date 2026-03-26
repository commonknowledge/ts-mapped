import type { Organisation } from "@/models/Organisation";
import type { Feature } from "@/models/Organisation";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type OrganisationTable = Omit<Organisation, "features"> & {
  id: Generated<string>;
  features: Generated<Feature[]>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewOrganisation = Insertable<OrganisationTable>;
export type OrganisationUpdate = Updateable<OrganisationTable>;
