"use client";

import { useContext } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shadcn/ui/resizable";
import ChoroplethControl from "./components/controls/ChoroplethControl";
import Controls from "./components/controls/Controls";
import Legend from "./components/Legend";
import Loading from "./components/Loading";
import Map from "./components/Map";
import MapNavbar from "./components/MapNavbar";
import MapStyleSelector from "./components/MapStyleSelector";
import MapTable from "./components/table/MapTable";
import { ChoroplethContext } from "./context/ChoroplethContext";
import { DataSourcesContext } from "./context/DataSourcesContext";
import { MapContext } from "./context/MapContext";
import { MarkerAndTurfContext } from "./context/MarkerAndTurfContext";
import { TableContext } from "./context/TableContext";

export default function MapPage() {
  const { mapQuery, mapRef } = useContext(MapContext);
  const { areaStatsLoading, areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);
  const { dataSourcesLoading } = useContext(DataSourcesContext);
  const { markerQueries } = useContext(MarkerAndTurfContext);
  const { selectedDataSourceId } = useContext(TableContext);

  if (!mapQuery || mapQuery.loading) {
    return <Loading />;
  }

  const loading =
    areaStatsLoading ||
    dataSourcesLoading ||
    areaStatsQuery?.loading ||
    markerQueries?.loading;

  return (
    <div className="flex flex-col h-screen">
      <MapNavbar />
      <div className="flex w-full grow min-h-0 relative">
        <Controls />
        <div className="flex flex-col gap-4 grow relative min-w-0">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel className="relative">
              <Map
                onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
              />
              <MapStyleSelector />
              <ChoroplethControl />
              <Legend areaStats={areaStatsQuery?.data?.areaStats} />
            </ResizablePanel>
            {selectedDataSourceId && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel onResize={() => mapRef?.current?.resize()}>
                  <MapTable />
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
