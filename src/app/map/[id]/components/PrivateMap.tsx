"use client";

import { useEffect } from "react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { useMapStore } from "@/app/map/[id]/stores/useMapStore";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shadcn/ui/resizable";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAreaStats } from "../data";
import { useMapQuery } from "../hooks/useMapQuery";
import { CONTROL_PANEL_WIDTH } from "../styles";
import PrivateMapControls from "./controls/PrivateMapControls";
import VisualisationPanel from "./controls/VisualisationPanel/VisualisationPanel";
import Loading from "./Loading";
import Map from "./Map";
import PrivateMapNavbar from "./PrivateMapNavbar";
import MapTable from "./table/MapTable";

export default function PrivateMap() {
  const mapRef = useMapStore((s) => s.mapRef);
  const showControls = useMapStore((s) => s.showControls);
  const areaStatsQuery = useAreaStats();
  const setLastLoadedSourceId = useMapStore((s) => s.setLastLoadedSourceId);
  const { isPending: dataSourcesLoading } = useDataSources();
  const markerQueries = useMarkerQueries();
  const selectedDataSourceId = useMapStore((s) => s.selectedDataSourceId);

  const { data: map, isPending } = useMapQuery();
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
