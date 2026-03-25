import { z } from "zod";
import { columnMetadataSchema, inspectorColumnSchema } from "./DataSource";

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
