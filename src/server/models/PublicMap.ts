import z from "zod";
import type {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Updateable,
} from "kysely";

export enum PublicMapColumnType {
  Boolean = "Boolean",
  CommaSeparatedList = "CommaSeparatedList",
  String = "String",
}

export const publicMapColumnTypes = Object.values(PublicMapColumnType);

export const publicMapColumnSchema = z.object({
  label: z.string(),
  sourceColumns: z.array(z.string()),
  type: z.nativeEnum(PublicMapColumnType),
});

export type PublicMapColumn = z.infer<typeof publicMapColumnSchema>;

export const publicMapDataSourceConfigSchema = z.object({
  allowUserEdit: z.boolean(),
  allowUserSubmit: z.boolean(),
  dataSourceId: z.string(),
  dataSourceLabel: z.string(),
  formUrl: z.string(),
  formButtonText: z.string().optional(),
  editFormUrl: z.string(),
  editFormButtonText: z.string().optional(),
  nameColumns: z.array(z.string()),
  nameLabel: z.string(),
  descriptionColumn: z.string(),
  descriptionLabel: z.string(),
  additionalColumns: z.array(publicMapColumnSchema),
  positiveTooltip: z.string().optional(),
  negativeTooltip: z.string().optional(),
  unknownTooltip: z.string().optional(),
});

export type PublicMapDataSourceConfig = z.infer<
  typeof publicMapDataSourceConfigSchema
>;

export const publicMapSchema = z.object({
  id: z.string(),
  host: z.string(),
  name: z.string(),
  description: z.string(),
  descriptionLong: z.string(),
  descriptionLink: z.string(),
  imageUrl: z.string().nullish(),
  mapId: z.string(),
  viewId: z.string(),
  published: z.boolean(),
  dataSourceConfigs: z.array(publicMapDataSourceConfigSchema),
  createdAt: z.date(),
  colorScheme: z.string(),
});

export type PublicMap = z.infer<typeof publicMapSchema>;

export type PublicMapTable = PublicMap & {
  id: Generated<string>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
};
export type NewPublicMap = Insertable<PublicMapTable>;
export type PublicMapUpdate = Updateable<PublicMapTable>;
