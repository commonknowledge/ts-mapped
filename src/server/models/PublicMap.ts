import {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Updateable,
} from "kysely";

import z from "zod";

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

export const publicMapDataSourceConfigSchema = z.object({
  allowUserEdit: z.boolean(),
  allowUserSubmit: z.boolean(),
  dataSourceId: z.string(),
  dataSourceLabel: z.string(),
  formUrl: z.string(),
  nameColumns: z.array(z.string()),
  nameLabel: z.string(),
  descriptionColumn: z.string(),
  descriptionLabel: z.string(),
  additionalColumns: z.array(publicMapColumnSchema),
});

export const publicMapSchema = z.object({
  id: z.string(),
  host: z.string(),
  name: z.string(),
  description: z.string(),
  descriptionLink: z.string(),
  mapId: z.string(),
  viewId: z.string(),
  published: z.boolean(),
  dataSourceConfigs: z.array(publicMapDataSourceConfigSchema),
  createdAt: z.date(),
});

export type PublicMap = z.infer<typeof publicMapSchema>;

export type PublicMapTable = PublicMap & {
  id: Generated<string>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
};
export type NewPublicMap = Insertable<PublicMapTable>;
export type PublicMapUpdate = Updateable<PublicMapTable>;
