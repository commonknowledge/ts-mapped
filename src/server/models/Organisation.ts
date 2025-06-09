import {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";

export interface OrganisationTable {
  id: Generated<string>;
  name: string;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type Organisation = Selectable<OrganisationTable>;
export type NewOrganisation = Insertable<OrganisationTable>;
export type OrganisationUpdate = Updateable<OrganisationTable>;
