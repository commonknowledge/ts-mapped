"use client";

import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
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
  const { viewConfig, updateViewConfig } = useMapViews();
  const choroplethDataSource = useChoroplethDataSource();

  const [boundariesPanelOpen, _setBoundariesPanelOpen] = useAtom(
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

  const setBoundariesPanelOpen = useCallback(
    (open: boolean) => {
      if (open && !viewConfig.areaSetGroupCode) {
        updateViewConfig({ areaSetGroupCode: AreaSetGroupCode.WMC24 });
      }
      _setBoundariesPanelOpen(open);
    },
    [_setBoundariesPanelOpen, updateViewConfig, viewConfig.areaSetGroupCode],
  );

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
