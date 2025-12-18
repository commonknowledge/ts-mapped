"use client";

import { useMapId } from "./useMapCore";
import { useMapQuery } from "./useMapQuery";

export function useTurfsQuery() {
  const mapId = useMapId();
  const { data: mapData, isFetching } = useMapQuery(mapId);
  return { data: mapData?.turfs, isFetching };
}
