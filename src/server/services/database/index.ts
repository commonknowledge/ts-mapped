import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import Cursor from "pg-cursor";
import { JSONPlugin } from "./plugins/JSONPlugin";
import { PointPlugin } from "./plugins/PointPlugin";
import type { AirtableWebhookTable } from "@/server/models/AirtableWebhook";
import type { AreaTable } from "@/server/models/Area";
import type { AreaSetTable } from "@/server/models/AreaSet";
import type { DataRecordTable } from "@/server/models/DataRecord";
import type { DataSourceTable } from "@/server/models/DataSource";
import type { FolderTable } from "@/server/models/Folder";
import type { InvitationTable } from "@/server/models/Invitation";
import type { JobTable } from "@/server/models/Job";
import type { MapTable } from "@/server/models/Map";
import type { MapViewTable } from "@/server/models/MapView";
import type { OrganisationTable } from "@/server/models/Organisation";
import type { OrganisationUserTable } from "@/server/models/OrganisationUser";
import type { PlacedMarkerTable } from "@/server/models/PlacedMarker";
import type { PublicMapTable } from "@/server/models/PublicMap";
import type { TurfTable } from "@/server/models/Turf";
import type { UserTable } from "@/server/models/User";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
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
  folder: FolderTable;
  invitation: InvitationTable;
  map: MapTable;
  mapView: MapViewTable;
  organisation: OrganisationTable;
  organisationUser: OrganisationUserTable;
  placedMarker: PlacedMarkerTable;
  publicMap: PublicMapTable;
  turf: TurfTable;
  user: UserTable;
  "pgboss.job": JobTable;
}

export const db = new Kysely<Database>({
  dialect,
  plugins: [
    // Database `field_name` to TypeScript `fieldName`.
    // `maintainNestedObjectKeys` prevents `data_record.json` being mangled
    new CamelCasePlugin({ maintainNestedObjectKeys: true }),
    new PointPlugin(),
    new JSONPlugin(),
  ],
  log: ["error"],
});
