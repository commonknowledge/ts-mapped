"use client";

import { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { useAreaStatsQuery } from "@/app/(private)/map/[id]/data";
import { getChoroplethLayerConfig } from "@/app/(private)/map/[id]/sources";
import { ChoroplethContext } from "../context/ChoroplethContext";

export default function ChoroplethProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { boundingBox, viewConfig, zoom } = useContext(MapContext);

  /* State */

  // Manually keep track of fetchMore loading state as the first fetchMore
  // doesn't trigger the query loading flag
  const [areaStatsLoading, setAreaStatsLoading] = useState(false);
  // Storing the last loaded source triggers re-render when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [boundariesPanelOpen, setBoundariesPanelOpen] = useState(false);

  /* Derived State */

  const choroplethLayerConfig = useMemo(() => {
    return getChoroplethLayerConfig(viewConfig.areaSetGroupCode, zoom);
  }, [viewConfig.areaSetGroupCode, zoom]);

  /* GraphQL Data */
  const areaStatsQuery = useAreaStatsQuery({
    areaSetGroupCode: viewConfig.areaSetGroupCode,
    areaSetCode: choroplethLayerConfig.areaSetCode,
    dataSourceId: viewConfig.areaDataSourceId,
    column: viewConfig.areaDataColumn,
    excludeColumns: viewConfig.getExcludeColumns(),
    useDummyBoundingBox: choroplethLayerConfig.requiresBoundingBox,
  });

  const { fetchMore: areaStatsFetchMore } = areaStatsQuery;

  /* Effects */

  /* Do fetchMore() (if layer needs it) when bounding box or config changes */
  useEffect(() => {
    if (!choroplethLayerConfig.requiresBoundingBox || !areaStatsFetchMore) {
      return;
    }
    (async () => {
      setAreaStatsLoading(true);
      await areaStatsFetchMore({ variables: { boundingBox } });
      setAreaStatsLoading(false);
    })();
  }, [areaStatsFetchMore, boundingBox, choroplethLayerConfig, viewConfig]);

  return (
    <ChoroplethContext
      value={{
        boundariesPanelOpen,
        setBoundariesPanelOpen,

        lastLoadedSourceId,
        setLastLoadedSourceId,

        areaStatsLoading,
        areaStatsQuery,

        choroplethLayerConfig,
      }}
    >
      {children}
    </ChoroplethContext>
  );
}
