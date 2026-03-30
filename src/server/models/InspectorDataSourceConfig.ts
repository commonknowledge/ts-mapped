import type { InspectorDataSourceConfig } from "@/models/InspectorDataSourceConfig";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type InspectorDataSourceConfigTable = InspectorDataSourceConfig & {
  id: Generated<string>;
  position: ColumnType<number, number | undefined, number>;
};

export type NewInspectorDataSourceConfig =
  Insertable<InspectorDataSourceConfigTable>;
export type InspectorDataSourceConfigUpdate =
  Updateable<InspectorDataSourceConfigTable>;
