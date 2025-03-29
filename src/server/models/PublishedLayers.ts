import {
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely";

export interface PublishedLayerTable {
  id: Generated<number>;
  type: string;
  name: string;
  geography: JSONColumnType<object>;
  createdAt: Date;
  updatedAt: Date;
}

export type PublishedLayer = Selectable<PublishedLayerTable>;
export type NewPublishedLayer = Insertable<PublishedLayerTable>;
export type PublishedLayerUpdate = Updateable<PublishedLayerTable>;
