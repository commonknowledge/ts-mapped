"use client";

import { useAtom } from "jotai";
import { useMemo } from "react";
import { GeocodingType } from "@/server/models/DataSource";
import {
  boundariesPanelOpenAtom,
  lastLoadedSourceIdAtom,
  selectedBivariateBucketAtom,
} from "../atoms/choroplethAtoms";
import { getChoroplethLayerConfig } from "../components/Choropleth/configs";
import { useChoroplethDataSource } from "./useDataSources";
import { useZoom } from "./useMapCamera";
import { useMapViews } from "./useMapViews";

export function useChoropleth() {
  const zoom = useZoom();
  const { viewConfig } = useMapViews();
  const choroplethDataSource = useChoroplethDataSource();

  const [boundariesPanelOpen, setBoundariesPanelOpen] = useAtom(
    boundariesPanelOpenAtom,
  );
  const [selectedBivariateBucket, setSelectedBivariateBucket] = useAtom(
    selectedBivariateBucketAtom,
  );
  const [lastLoadedSourceId, setLastLoadedSourceId] = useAtom(
    lastLoadedSourceIdAtom,
  );

  const choroplethLayerConfig = useMemo(() => {
    const areaSetCode =
      choroplethDataSource?.geocodingConfig?.type === GeocodingType.Code
        ? choroplethDataSource?.geocodingConfig?.areaSetCode
        : undefined;

    return getChoroplethLayerConfig({
      dataSourceAreaSetCode: areaSetCode,
      areaSetGroupCode: viewConfig.areaSetGroupCode,
      mapType: viewConfig.mapType,
      zoom,
    });
  }, [
    choroplethDataSource,
    viewConfig.areaSetGroupCode,
    viewConfig.mapType,
    zoom,
  ]);

  return {
    boundariesPanelOpen,
    setBoundariesPanelOpen,
    selectedBivariateBucket,
    setSelectedBivariateBucket,
    lastLoadedSourceId,
    setLastLoadedSourceId,
    choroplethLayerConfig,
  };
}
