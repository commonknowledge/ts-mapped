"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/services/trpc/react";
import { useMapId } from "./useMapCore";
import { useViewId } from "./useMapViews";

export function useViewInspectorConfig() {
  const mapId = useMapId();
  const viewId = useViewId();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.mapView.inspectorConfigs.queryOptions(
      { mapId: mapId || "", viewId: viewId || "" },
      { enabled: Boolean(mapId) && Boolean(viewId) },
    ),
  );

  return data ?? [];
}
