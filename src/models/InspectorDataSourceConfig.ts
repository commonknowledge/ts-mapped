import z from "zod";
import { defaultInspectorConfigSchema } from "./DataSource";

export const inspectorDataSourceConfigSchema =
  defaultInspectorConfigSchema.extend({
    id: z.string(),
    dataSourceId: z.string(),
    mapViewId: z.string(),
    position: z.number(),
  });

export type InspectorDataSourceConfig = z.infer<
  typeof inspectorDataSourceConfigSchema
>;
