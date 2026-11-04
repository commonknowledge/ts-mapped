"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { useCallback } from "react";
import { toast } from "sonner";
import { parseAreaGeography } from "@/models/Area";
import { useTRPC } from "@/services/trpc/react";
import { useChoropleth } from "./useChoropleth";
import { useInspectorState } from "./useInspectorState";
import { useMapRef } from "./useMapCore";
import type { AreaSetCode } from "@/models/AreaSet";

/**
 * Selects an area as if it had been clicked on the map (highlighted and
 * open in the inspector) and fits the map to it
 */
export function useGoToArea() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const mapRef = useMapRef();
  const { resetInspector, setSelectedBoundary } = useInspectorState();
  const { choroplethLayerConfig } = useChoropleth();
  const layerId = choroplethLayerConfig.mapbox.layerId;

  return useCallback(
    async ({
      code,
      name,
      areaSetCode,
    }: {
      code: string;
      name: string;
      areaSetCode: AreaSetCode;
    }) => {
      resetInspector();
      setSelectedBoundary({
        id: code,
        code,
        areaSetCode,
        sourceLayerId: layerId,
        name,
        properties: null,
      });

      try {
        const area = await queryClient.fetchQuery(
          trpc.area.byCode.queryOptions({ code, areaSetCode }),
        );
        const map = mapRef?.current;
        if (!area || !map) return;
        const [minLng, minLat, maxLng, maxLat] = turf.bbox(
          parseAreaGeography(area.geoJson),
        );
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 80, maxZoom: 12, duration: 1000 },
        );
      } catch {
        toast.error("Couldn't find that area on the map");
      }
    },
    [layerId, mapRef, queryClient, resetInspector, setSelectedBoundary, trpc],
  );
}
