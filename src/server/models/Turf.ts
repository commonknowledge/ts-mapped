import type { Turf } from "@/models/Turf";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type TurfTable = Turf & {
  id: Generated<string>;
  createdAt: ColumnType<Date, Date | undefined, never>;
};
export type NewTurf = Insertable<TurfTable>;
export type TurfUpdate = Updateable<TurfTable>;
