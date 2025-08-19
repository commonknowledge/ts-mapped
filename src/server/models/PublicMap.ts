import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { PublicMapDataSourceConfig } from "@/__generated__/types";

export interface PublicMapTable {
  id: Generated<string>;
  host: string;
  name: string;
  description: string;
  descriptionLink: string;
  mapId: string;
  viewId: string;
  published: boolean;
  dataSourceConfigs: JSONColumnType<PublicMapDataSourceConfig[]>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type PublicMap = Selectable<PublicMapTable>;
export type NewPublicMap = Insertable<PublicMapTable>;
export type PublicMapUpdate = Updateable<PublicMapTable>;
