import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import Cursor from "pg-cursor";
import { AirtableWebhookTable } from "@/server/models/AirtableWebhook";
import { AreaTable } from "@/server/models/Area";
import { AreaSetTable } from "@/server/models/AreaSet";
import { DataRecordTable } from "@/server/models/DataRecord";
import { DataSourceTable } from "@/server/models/DataSource";
import { JobTable } from "@/server/models/Job";
import { MapTable } from "@/server/models/Map";
import { MapViewTable } from "@/server/models/MapView";
import { OrganisationTable } from "@/server/models/Organisation";
import { OrganisationUserTable } from "@/server/models/OrganisationUser";
import { PlacedMarkerTable } from "@/server/models/PlacedMarker";
import { UserTable } from "@/server/models/User";
import { PointPlugin } from "./plugins";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const dialect = new PostgresDialect({
  cursor: Cursor,
  pool,
});

export interface Database {
  airtableWebhook: AirtableWebhookTable;
  area: AreaTable;
  areaSet: AreaSetTable;
  dataSource: DataSourceTable;
  dataRecord: DataRecordTable;
  map: MapTable;
  mapView: MapViewTable;
  organisation: OrganisationTable;
  organisationUser: OrganisationUserTable;
  placedMarker: PlacedMarkerTable;
  user: UserTable;
  "pgboss.job": JobTable;
}

export const db = new Kysely<Database>({
  dialect,
  plugins: [
    new CamelCasePlugin(), // Database `field_name` to TypeScript `fieldName`
    new PointPlugin(),
  ],
  log: ["error"],
});
