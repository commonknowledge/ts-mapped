import { db } from "@/server/services/database";
import type { NewInspectorDataSourceConfig } from "../models/InspectorDataSourceConfig";

export function findByMapViewId(mapViewId: string) {
  return db
    .selectFrom("inspectorDataSourceConfig")
    .where("mapViewId", "=", mapViewId)
    .selectAll()
    .orderBy("position asc")
    .orderBy("id asc")
    .execute();
}

export async function replaceAllForMapView({
  mapViewId,
  configs,
}: {
  mapViewId: string;
  configs: NewInspectorDataSourceConfig[];
}) {
  await db.transaction().execute(async (tx) => {
    await tx
      .deleteFrom("inspectorDataSourceConfig")
      .where("mapViewId", "=", mapViewId)
      .execute();

    if (configs.length === 0) return;

    await tx.insertInto("inspectorDataSourceConfig").values(configs).execute();
  });
}
