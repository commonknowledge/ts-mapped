"use client";

import { useAtom, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { useChoroplethDataSource } from "@/hooks/useDataSources";
import { AreaSetGroupCode } from "@/models/AreaSet";
import { GeocodingType } from "@/models/DataSource";
import {
  boundariesPanelOpenAtom,
  selectedBivariateBucketAtom,
} from "../atoms/choroplethAtoms";
import { markerSettingsDataSourceIdAtom } from "../atoms/markerAtoms";
import { getChoroplethLayerConfig } from "../components/Choropleth/configs";
import { useZoom } from "./useMapCamera";
import { useMapViews } from "./useMapViews";

export function useChoropleth() {
  const zoom = useZoom();
  const { viewConfig, updateViewConfig } = useMapViews();
  const choroplethDataSource = useChoroplethDataSource();

  const [boundariesPanelOpen, _setBoundariesPanelOpen] = useAtom(
    boundariesPanelOpenAtom,
  );
  const setMarkerSettingsDataSourceId = useSetAtom(
    markerSettingsDataSourceIdAtom,
  );
  const [selectedBivariateBucket, setSelectedBivariateBucket] = useAtom(
    selectedBivariateBucketAtom,
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
      if (open && viewConfig.areaSetGroupCode === undefined) {
        updateViewConfig({ areaSetGroupCode: AreaSetGroupCode.WMC24 });
      }
      // The marker settings flyout takes the same place, so only one is open
      if (open) {
        setMarkerSettingsDataSourceId(null);
      }
      _setBoundariesPanelOpen(open);
    },
    [
      _setBoundariesPanelOpen,
      setMarkerSettingsDataSourceId,
      updateViewConfig,
      viewConfig.areaSetGroupCode,
    ],
  );

  return {
    boundariesPanelOpen,
    setBoundariesPanelOpen,
    selectedBivariateBucket,
    setSelectedBivariateBucket,
    choroplethLayerConfig,
  };
}
