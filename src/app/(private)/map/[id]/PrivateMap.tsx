"use client";

import { useContext, useEffect } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Legend from "@/components/Map/components/Legend";
import Loading from "@/components/Map/components/Loading";
import Map from "@/components/Map/components/Map";
import MapTable from "@/components/Map/components/table/MapTable";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { TableContext } from "@/components/Map/context/TableContext";
import { CONTROL_PANEL_WIDTH } from "@/components/Map/styles";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shadcn/ui/resizable";
import PrivateMapControls from "./components/controls/PrivateMapControls";
import VisualisationPanel from "./components/controls/visualisation/VisualisationPanel";
import PrivateMapNavbar from "./components/PrivateMapNavbar";

export default function PrivateMap() {
  const { mapQuery, mapRef, showControls } = useContext(MapContext);
  const { areaStatsLoading, areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);

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

  if (!mapQuery || mapQuery.isPending) {
    return <Loading />;
  }

  const loading =
    areaStatsLoading ||
    dataSourcesLoading ||
    areaStatsQuery?.loading ||
    markerQueries?.loading;

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
