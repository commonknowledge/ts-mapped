"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaSetCodeLabels } from "@/labels";
import { AreaSetCode } from "@/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { useChoropleth } from "./useChoropleth";
import { useMapViews } from "./useMapViews";
import type { GeocodeResult } from "@/models/DataRecord";

export interface ContainingArea {
  areaSetCode: AreaSetCode;
  label: string;
  code: string;
  name: string;
}

const useContainingArea = ({
  recordAreas,
  areaSetCode,
}: {
  recordAreas: GeocodeResult["areas"] | null | undefined;
  areaSetCode: AreaSetCode | null | undefined;
}) => {
  const trpc = useTRPC();
  const code = areaSetCode ? recordAreas?.[areaSetCode] : undefined;
  const enabled = Boolean(code && areaSetCode);
  const { data, isLoading } = useQuery(
    trpc.area.nameByCode.queryOptions(
      {
        code: code ?? "",
        // Any code satisfies the input schema while the query is disabled
        areaSetCode: areaSetCode ?? AreaSetCode.WMC24,
      },
      { enabled },
    ),
  );
  const area: ContainingArea | null =
    enabled && data && areaSetCode
      ? {
          areaSetCode,
          label: AreaSetCodeLabels[areaSetCode],
          code: data.code,
          name: data.name,
        }
      : null;
  return { area, isLoading: enabled && isLoading };
};

/**
 * The areas containing a record, for the boundary sets currently displayed
 * on the map: the choropleth layer at the current zoom, plus the secondary
 * boundary set if one is configured. Area codes come from the record's
 * geocode result (the same source the Area enrichment uses); only the
 * names are looked up.
 *
 * Names are fetched from the database rather than read off the matching
 * Mapbox feature: `querySourceFeatures` only sees tiles that are loaded,
 * so it fails for markers outside the viewport (e.g. opened from the
 * table) or while the layer for a new zoom level is still loading.
 */
export const useContainingAreas = (
  recordAreas: GeocodeResult["areas"] | null | undefined,
) => {
  const { viewConfig } = useMapViews();
  const { choroplethLayerConfig } = useChoropleth();

  const primaryAreaSetCode = viewConfig.areaSetGroupCode
    ? choroplethLayerConfig.areaSetCode
    : null;
  const secondaryAreaSetCode =
    viewConfig.secondaryAreaSetCode &&
    viewConfig.secondaryAreaSetCode !== primaryAreaSetCode
      ? viewConfig.secondaryAreaSetCode
      : null;

  const primary = useContainingArea({
    recordAreas,
    areaSetCode: primaryAreaSetCode,
  });
  const secondary = useContainingArea({
    recordAreas,
    areaSetCode: secondaryAreaSetCode,
  });

  const areas: ContainingArea[] = [];
  if (primary.area) {
    areas.push(primary.area);
  }
  if (secondary.area) {
    areas.push(secondary.area);
  }
  return { areas, isLoading: primary.isLoading || secondary.isLoading };
};
