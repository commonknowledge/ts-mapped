"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { VisualisationType } from "@/__generated__/types";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { GeocodingType } from "@/server/models/DataSource";
import { useAreaStatsQuery } from "../data";
import { getChoroplethLayerConfig } from "../sources";
import type { ReactNode } from "react";

export default function ChoroplethProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { boundingBox, viewConfig, zoom } = useContext(MapContext);
  const { getChoroplethDataSource } = useContext(DataSourcesContext);

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
    const dataSource = getChoroplethDataSource();
    const areaSetCode =
      dataSource?.geocodingConfig?.type === GeocodingType.Code
        ? dataSource?.geocodingConfig?.areaSetCode
        : undefined;

    return getChoroplethLayerConfig(
      viewConfig.visualisationType === VisualisationType.Choropleth
        ? areaSetCode
        : undefined,
      viewConfig.areaSetGroupCode,
      zoom,
    );
  }, [
    getChoroplethDataSource,
    viewConfig.areaSetGroupCode,
    viewConfig.visualisationType,
    zoom,
  ]);

  /* GraphQL Data */
  const areaStatsQuery = useAreaStatsQuery({
    viewConfig,
    areaSetCode: choroplethLayerConfig.areaSetCode,
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
