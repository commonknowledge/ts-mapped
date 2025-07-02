import { DataSource } from "@/server/models/DataSource";
import { Map } from "@/server/models/Map";
import { Turf } from "@/server/models/Turf";

export const serializeDataSource = (dataSource: DataSource) => ({
  ...dataSource,
  createdAt: dataSource.createdAt.toISOString(),
});

export const serializeMap = (map: Map) => ({
  ...map,
  createdAt: map.createdAt.toISOString(),
});

export const serializeTurf = (turf: Turf) => ({
  ...turf,
  createdAt: turf.createdAt.toISOString(),
});
