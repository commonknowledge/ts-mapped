import { Generated, Insertable, Selectable, Updateable } from "kysely";
import { AreaSetCode } from "@/types";

export interface AreaSetTable {
  id: Generated<number>;
  code: AreaSetCode;
  name: string;
}

export type AreaSet = Selectable<AreaSetTable>;
export type NewAreaSet = Insertable<AreaSetTable>;
export type AreaSetUpdate = Updateable<AreaSetTable>;
