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
  max: Number(process.env.DATABASE_POOL_SIZE) || undefined,
});

// Set up read replica pool with graceful fallback
const readReplicaPool = new Pool({
  connectionString:
    process.env.DATABASE_READ_REPLICA_URL || process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_SIZE) || undefined,
});

const dialect = new PostgresDialect({
  cursor: Cursor,
  pool,
});

const readReplicaDialect = new PostgresDialect({
  cursor: Cursor,
  pool: readReplicaPool,
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

const sharedPlugins = [
  new CamelCasePlugin({ maintainNestedObjectKeys: true }),
  new PointPlugin(),
  new JSONPlugin(),
];

export const db = new Kysely<Database>({
  dialect,
  plugins: sharedPlugins,
  log: ["error"],
});

export const dbRead = new Kysely<Database>({
  dialect: readReplicaDialect,
  plugins: sharedPlugins,
  log: ["error"],
});
