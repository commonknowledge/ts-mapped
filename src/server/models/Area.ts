import {
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely";

export interface AreaTable {
  id: Generated<number>;
  code: string;
  name: string;
  geography: JSONColumnType<object>
  areaSetId: number
}

export type Area = Selectable<AreaTable>;
export type NewArea = Insertable<AreaTable>;
export type AreaUpdate = Updateable<AreaTable>;
