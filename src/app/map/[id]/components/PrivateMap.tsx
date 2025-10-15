"use client";

import { useContext, useEffect } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import {
  useDataSources,
  useMarkerDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shadcn/ui/resizable";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapQuery } from "../hooks/useMapQuery";
import { CONTROL_PANEL_WIDTH } from "../styles";
import PrivateMapControls from "./controls/PrivateMapControls";
import VisualisationPanel from "./controls/visualisation/VisualisationPanel";
import Loading from "./Loading";
import Map from "./Map";
import PrivateMapNavbar from "./PrivateMapNavbar";
import MapTable from "./table/MapTable";

export default function PrivateMap() {
  const { mapRef, showControls, mapId } = useContext(MapContext);
  const { areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);

  const { isPending: dataSourcesLoading, data: allDataSources } =
    useDataSources();
  const markerDataSources = useMarkerDataSources();
  const membersDataSource = useMembersDataSource();
  const { markerQueries } = useContext(MarkerAndTurfContext);
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);

  const { data: map, isPending } = useMapQuery(mapId);

  // Handle configure tag callback
  const handleConfigureTag = () => {
    // Prioritize members data source (most common use case for tagging)
    if (membersDataSource?.id) {
      handleDataSourceSelect(membersDataSource.id);
      return;
    }

    // Fallback to marker data sources
    const markerDataSourceIds = markerDataSources?.map((ds) => ds.id) || [];
    if (markerDataSourceIds.length > 0) {
      handleDataSourceSelect(markerDataSourceIds[0]);
      return;
    }

    // Last resort: any available data source
    const availableDataSourceIds = allDataSources?.map((ds) => ds.id) || [];
    if (availableDataSourceIds.length > 0) {
      handleDataSourceSelect(availableDataSourceIds[0]);
    } else {
      console.log("No data source IDs available");
    }
  };

  // Resize map when UI changes
  useEffect(() => {
    if (mapRef?.current) {
      const timeoutId = setTimeout(() => {
        if (mapRef?.current) {
          mapRef.current.resize();
        }
      }, 1);

      return () => clearTimeout(timeoutId);
    }
  }, [mapRef, selectedDataSourceId]);

  if (!map || isPending) {
    return <Loading />;
  }

  const loading =
    dataSourcesLoading ||
    areaStatsQuery?.isFetching ||
    markerQueries?.isFetching;

  const paddedStyle = showControls
    ? { paddingLeft: `${CONTROL_PANEL_WIDTH}px` }
    : {};

  return (
    <div className="flex flex-col h-screen">
      <PrivateMapNavbar />
      <div className="flex w-full grow min-h-0 relative">
        <PrivateMapControls />
        <VisualisationPanel
          positionLeft={showControls ? CONTROL_PANEL_WIDTH : 0}
        />
        <div className="flex flex-col gap-4 grow relative min-w-0">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel className="relative" id="map" order={0}>
              <Map
                onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
                onConfigureTag={handleConfigureTag}
                isTableOpen={Boolean(selectedDataSourceId)}
              />
            </ResizablePanel>
            {selectedDataSourceId && (
              <>
                <ResizableHandle withHandle style={paddedStyle} />
                <ResizablePanel
                  onResize={() => mapRef?.current?.resize()}
                  id="table"
                  order={1}
                >
                  <div className="transition-all h-full" style={paddedStyle}>
                    <MapTable />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
        {loading && <Loading />}
      </div>
    </div>
  );
}
