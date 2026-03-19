import type { Area } from "@/models/Area";
import type {
  Generated,
  GeneratedAlways,
  Insertable,
  Updateable,
} from "kysely";

export type AreaTable = Area & {
  id: Generated<number>;
};
export type NewArea = Insertable<AreaTable>;
export type AreaUpdate = Updateable<AreaTable>;

export interface AreaSearchTable {
  id: GeneratedAlways<number>;
  code: GeneratedAlways<string>;
  name: GeneratedAlways<string>;
  areaSetId: GeneratedAlways<number>;
  areaSetName: GeneratedAlways<string>;
  areaSetCode: GeneratedAlways<string>;
  searchText: GeneratedAlways<string>;
}
