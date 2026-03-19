import type { ColumnMetadataOverride } from "@/models/ColumnMetadataOverride";
import type { Generated, Insertable } from "kysely";

export type ColumnMetadataOverrideTable = ColumnMetadataOverride & {
  id: Generated<number>;
};
export type NewColumnMetadataOverride = Insertable<ColumnMetadataOverrideTable>;
