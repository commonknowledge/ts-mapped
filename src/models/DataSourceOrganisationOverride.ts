import { z } from "zod";
import { columnMetadataSchema, columnVisualisationSchema } from "./DataSource";

export const dataSourceOrganisationOverrideSchema = z.object({
  id: z.number(),
  organisationId: z.string(),
  dataSourceId: z.string(),
  columnMetadata: z.array(columnMetadataSchema),
  columnVisualisations: z.array(columnVisualisationSchema),
});

export type DataSourceOrganisationOverride = z.infer<
  typeof dataSourceOrganisationOverrideSchema
>;
