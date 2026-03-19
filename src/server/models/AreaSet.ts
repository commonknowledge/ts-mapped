import type { AreaSet } from "@/models/AreaSet";
import type { Generated, Insertable, Updateable } from "kysely";

export type AreaSetTable = AreaSet & {
  id: Generated<number>;
};
export type NewAreaSet = Insertable<AreaSetTable>;
export type AreaSetUpdate = Updateable<AreaSetTable>;
