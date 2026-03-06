import { z } from "zod";
import { columnMetadataSchema } from "./DataSource";
import type { Generated, Insertable } from "kysely";

export const columnMetadataOverrideSchema = z.object({
  id: z.number(),
  organisationId: z.string(),
  dataSourceId: z.string(),
  columnMetadata: z.array(columnMetadataSchema),
});

export type ColumnMetadataOverride = z.infer<
  typeof columnMetadataOverrideSchema
>;

export type ColumnMetadataOverrideTable = ColumnMetadataOverride & {
  id: Generated<number>;
};

export type NewColumnMetadataOverride = Insertable<ColumnMetadataOverrideTable>;
