import type { DataSourceOrganisationOverride } from "@/models/DataSourceOrganisationOverride";
import type { Generated, Insertable } from "kysely";

export type DataSourceOrganisationOverrideTable =
  DataSourceOrganisationOverride & {
    id: Generated<number>;
  };
export type NewDataSourceOrganisationOverride =
  Insertable<DataSourceOrganisationOverrideTable>;
