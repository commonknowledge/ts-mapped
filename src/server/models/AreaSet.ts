import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface AreaSetTable {
  id: Generated<number>;
  code: string;
  name: string;
}

export type AreaSet = Selectable<AreaSetTable>;
export type NewAreaSet = Insertable<AreaSetTable>;
export type AreaSetUpdate = Updateable<AreaSetTable>;
