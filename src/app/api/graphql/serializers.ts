import { DataSource } from "@/server/models/DataSource";
import { Map } from "@/server/models/Map";

export const serializeDataSource = (dataSource: DataSource) => ({
  ...dataSource,
  createdAt: dataSource.createdAt.toISOString(),
});

export const serializeMap = (map: Map) => ({
  ...map,
  createdAt: map.createdAt.toISOString(),
});
