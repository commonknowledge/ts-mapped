"use client";

import { useContext, useEffect } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shadcn/ui/resizable";
import Controls from "./components/controls/Controls";
import VisualisationPanel from "./components/controls/visualisation/VisualisationPanel";
import Legend from "./components/Legend";
import Loading from "./components/Loading";
import Map from "./components/Map";
import MapNavbar from "./components/MapNavbar";
import MapTable from "./components/table/MapTable";
import { ChoroplethContext } from "./context/ChoroplethContext";
import { DataSourcesContext } from "./context/DataSourcesContext";
import { MapContext } from "./context/MapContext";
import { MarkerAndTurfContext } from "./context/MarkerAndTurfContext";
import { TableContext } from "./context/TableContext";

export default function MapPage() {
  const { mapQuery, mapRef, showControls } = useContext(MapContext);
  const {
    areaStatsLoading,
    areaStatsQuery,

    setLastLoadedSourceId,
  } = useContext(ChoroplethContext);
  const { dataSourcesLoading } = useContext(DataSourcesContext);
  const { markerQueries } = useContext(MarkerAndTurfContext);
  const { selectedDataSourceId } = useContext(TableContext);

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

  if (!mapQuery || mapQuery.loading) {
    return <Loading />;
  }

  const loading =
    areaStatsLoading ||
    dataSourcesLoading ||
    areaStatsQuery?.loading ||
    markerQueries?.loading;

  const controlPanelWidth = 280;
  const paddedStyle = showControls
    ? { paddingLeft: `${controlPanelWidth}px` }
    : {};

  return (
    <div className="flex flex-col h-screen">
      <MapNavbar />
      <div className="flex w-full grow min-h-0 relative">
        <Controls controlPanelWidth={controlPanelWidth} />
        <VisualisationPanel
          positionLeft={showControls ? controlPanelWidth : 0}
        />
        <div className="flex flex-col gap-4 grow relative min-w-0">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel className="relative" id="map" order={0}>
              <Map
                onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
              />
              <Legend />
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
