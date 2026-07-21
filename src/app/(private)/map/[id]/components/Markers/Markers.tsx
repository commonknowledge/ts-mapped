import { useEffect, useMemo } from "react";

import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { useMarkerQueries } from "@/app/(private)/map/[id]/hooks/useMarkerQueries";
import { useDataSources } from "@/hooks/useDataSources";
import { useLayers } from "../../hooks/useLayers";
import { useMapRef } from "../../hooks/useMapCore";
import { useTimelineFilter } from "../../hooks/useTimelineFilter";
import { DataSourceMarkers } from "./DataSourceMarkers";
import { isMarkerIconImageId, registerMarkerIcons } from "./markerIcons";

export default function Markers() {
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const markerQueries = useMarkerQueries();
  const { getDataSourceVisibility } = useLayers();
  const { getDataSourceById } = useDataSources();
  const mapRef = useMapRef();
  const { activeRange } = useTimelineFilter();

  // The timeline filter only applies to sources with a date column,
  // matching the markers API
  const getFilterRange = (dataSourceId: string) => {
    const columnRoles = getDataSourceById(dataSourceId)?.columnRoles;
    return columnRoles?.dateColumn ? activeRange : null;
  };

  // Register the SDF icon sprites; map styles discard added images, so
  // re-register on style changes and on demand via styleimagemissing.
  useEffect(() => {
    const map = mapRef?.current?.getMap();
    if (!map) {
      return;
    }
    registerMarkerIcons(map);
    const onStyleLoad = () => registerMarkerIcons(map);
    const onStyleImageMissing = (e: { id: string }) => {
      if (isMarkerIconImageId(e.id)) {
        registerMarkerIcons(map);
      }
    };
    map.on("style.load", onStyleLoad);
    map.on("styleimagemissing", onStyleImageMissing);
    return () => {
      map.off("style.load", onStyleLoad);
      map.off("styleimagemissing", onStyleImageMissing);
    };
  }, [mapRef]);

  const memberMarkers = useMemo(
    () =>
      markerQueries?.data.find(
        (dsm) => dsm.dataSourceId === mapConfig.membersDataSourceId,
      ),
    [markerQueries, mapConfig.membersDataSourceId],
  );

  const otherMarkers = useMemo(
    () =>
      mapConfig.markerDataSourceIds.map((id) =>
        markerQueries?.data.find((dsm) => dsm.dataSourceId === id),
      ),
    [markerQueries, mapConfig.markerDataSourceIds],
  );

  return (
    <>
      {memberMarkers && getDataSourceVisibility(memberMarkers.dataSourceId) && (
        <DataSourceMarkers
          key={memberMarkers.dataSourceId}
          dataSourceMarkers={memberMarkers}
          isMembers
          markerColors={viewConfig.markerColors}
          defaultMarkerColor={
            getDataSourceById(memberMarkers.dataSourceId)?.defaultMarkerColor
          }
          markerVisualisation={
            viewConfig.markerVisualisations?.[memberMarkers.dataSourceId]
          }
          colorMappings={viewConfig.colorMappings}
          hideFilteredMarkers={viewConfig.hideFilteredMarkers}
          filterTimeRange={getFilterRange(memberMarkers.dataSourceId)}
        />
      )}
      {otherMarkers.map((markers) => {
        if (
          !markers ||
          !viewConfig.showLocations ||
          !getDataSourceVisibility(markers.dataSourceId)
        ) {
          return null;
        }
        return (
          <DataSourceMarkers
            key={markers.dataSourceId}
            dataSourceMarkers={markers}
            isMembers={false}
            markerColors={viewConfig.markerColors}
            defaultMarkerColor={
              getDataSourceById(markers.dataSourceId)?.defaultMarkerColor
            }
            markerVisualisation={
              viewConfig.markerVisualisations?.[markers.dataSourceId]
            }
            colorMappings={viewConfig.colorMappings}
            hideFilteredMarkers={viewConfig.hideFilteredMarkers}
            filterTimeRange={getFilterRange(markers.dataSourceId)}
          />
        );
      })}
    </>
  );
}
