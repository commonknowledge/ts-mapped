import { z } from "zod";
import { columnMetadataSchema } from "./DataSource";
export const columnMetadataOverrideSchema = z.object({
  id: z.number(),
  organisationId: z.string(),
  dataSourceId: z.string(),
  columnMetadata: z.array(columnMetadataSchema),
});

export type ColumnMetadataOverride = z.infer<
  typeof columnMetadataOverrideSchema
>;
