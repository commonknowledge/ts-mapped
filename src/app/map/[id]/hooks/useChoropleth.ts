"use client";

import { useAtom, useAtomValue } from "jotai";
import { useContext, useMemo } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { GeocodingType } from "@/server/models/DataSource";
import { getChoroplethLayerConfig } from "../components/Choropleth/configs";
import { useChoroplethDataSource } from "./useDataSources";
import { useMapViews } from "./useMapViews";
import {
  boundariesPanelOpenAtom,
  lastLoadedSourceIdAtom,
  selectedBivariateBucketAtom,
} from "../atoms/choroplethAtoms";

export function useChoropleth() {
  const { zoom } = useContext(MapContext);
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
