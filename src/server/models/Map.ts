import z from "zod";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export const columnGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  columnNames: z.array(z.string()),
  settings: z.object({
    isPercentage: z.boolean().optional(),
    isScale: z.boolean().optional(),
    lowerBound: z.number().optional(),
    upperBound: z.number().optional(),
    showAsBarChart: z.boolean().optional(),
  }).optional(),
});

export const columnGroupsConfigSchema = z.object({
  groups: z.array(columnGroupSchema),
  ungroupedColumns: z.array(z.string()).optional(),
});

export const savedVisualizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  areaDataSourceId: z.string(),
  areaDataColumn: z.string(),
  areaDataSecondaryColumn: z.string().optional(),
  calculationType: z.string().optional(),
  colorScheme: z.string().optional(),
  reverseColorScheme: z.boolean().optional(),
});

export const mapConfigSchema = z.object({
  markerDataSourceIds: z.array(z.string()),
  membersDataSourceId: z.string().nullish(),
  nonPointDataSourceIds: z.array(z.string()).optional(),
  columnGroups: z.record(z.string(), columnGroupsConfigSchema).optional(),
  savedVisualizations: z.array(savedVisualizationSchema).optional(),
});

export type MapConfig = z.infer<typeof mapConfigSchema>;

export const mapSchema = z.object({
  id: z.string(),
  name: z.string(),
  organisationId: z.string(),
  imageUrl: z.string().nullish(),
  config: mapConfigSchema,
  createdAt: z.date(),
});

export type Map = z.infer<typeof mapSchema>;

export type MapTable = Map & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewMap = Insertable<MapTable>;
export type MapUpdate = Updateable<MapTable>;
