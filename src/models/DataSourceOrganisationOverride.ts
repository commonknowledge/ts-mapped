import { z } from "zod";
import { columnMetadataSchema, inspectorColumnSchema } from "./DataSource";

/**
 * Allows organisations to override column metadata and default
 * inspector views for data sources they do not own.
 */

export const dataSourceOrganisationOverrideSchema = z.object({
  id: z.number(),
  organisationId: z.string(),
  dataSourceId: z.string(),
  columnMetadata: z.array(columnMetadataSchema),
  inspectorColumns: z.array(inspectorColumnSchema),
});

export type DataSourceOrganisationOverride = z.infer<
  typeof dataSourceOrganisationOverrideSchema
>;
