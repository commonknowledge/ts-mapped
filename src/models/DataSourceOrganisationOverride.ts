import { z } from "zod";
import { columnMetadataSchema } from "./DataSource";

export const dataSourceOrganisationOverrideSchema = z.object({
  id: z.number(),
  organisationId: z.string(),
  dataSourceId: z.string(),
  columnMetadata: z.array(columnMetadataSchema),
});

export type DataSourceOrganisationOverride = z.infer<
  typeof dataSourceOrganisationOverrideSchema
>;
