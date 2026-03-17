"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import { useTRPC } from "@/services/trpc/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shadcn/ui/resizable";
import "mapbox-gl/dist/mapbox-gl.css";
import { infoPopupOpenAtom } from "../atoms/mapStateAtoms";
import { useAreaStats } from "../data";
import { useInitialMapViewEffect } from "../hooks/useInitialMapView";
import { useMapConfig } from "../hooks/useMapConfig";
import { useShowControls } from "../hooks/useMapControls";
import { useMapId, useMapRef } from "../hooks/useMapCore";
import { useMapQuery } from "../hooks/useMapQuery";
import { CONTROL_PANEL_WIDTH } from "../styles";
import { getDataSourceIds } from "../utils/map";
import PrivateMapControls from "./controls/PrivateMapControls";
import VisualisationPanel from "./controls/VisualisationPanel/VisualisationPanel";
import EditColumnMetadataModal from "./EditColumnMetadataModal";
import Loading from "./Loading";
import Map from "./Map";
import MapInfoPopup from "./MapInfoPopup";
import PrivateMapNavbar from "./PrivateMapNavbar";
import MapTable from "./table/MapTable";

export default function PrivateMap() {
  const mapRef = useMapRef();
  const showControls = useShowControls();
  const mapId = useMapId();

  const areaStatsQuery = useAreaStats();
  const { setLastLoadedSourceId } = useChoropleth();

  const { isPending: dataSourcesLoading } = useDataSources();
  const { mapConfig } = useMapConfig();
  const dataSourceIds = useMemo(() => getDataSourceIds(mapConfig), [mapConfig]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const onImportComplete = useCallback(() => {
    // Refresh readable data sources after an import
    queryClient.invalidateQueries({
      queryKey: trpc.dataSource.listReadable.queryKey(),
    });

    // Also refresh data records so table values (e.g. tag columns) stay in sync
    queryClient.invalidateQueries({
      queryKey: trpc.dataRecord.list.queryKey(),
    });
  }, [queryClient, trpc]);

  const markerQueries = useMarkerQueries();
  const { selectedDataSourceId } = useTable();

  const { data: map, isPending } = useMapQuery(mapId);

  const [infoPopupOpen, setInfoPopupOpen] = useAtom(infoPopupOpenAtom);

  // Auto-open info popup on first visit if content exists
  useEffect(() => {
    if (!map?.infoContent || !mapId) return;
    const key = `mapped:mapInfoSeen:${mapId}`;
    if (localStorage.getItem(key) !== "true") {
      setInfoPopupOpen(true);
      localStorage.setItem(key, "true");
    }
  }, [map?.infoContent, mapId, setInfoPopupOpen]);

  // Ensure a map view exists
  useInitialMapViewEffect();

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
      <EditColumnMetadataModal />
      {mapId && (
        <MapInfoPopup
          open={infoPopupOpen}
          onOpenChange={setInfoPopupOpen}
          mapId={mapId}
          infoContent={map.infoContent}
        />
      )}
      <DataSourceEventsInvalidator
        dataSourceIds={dataSourceIds}
        onImportComplete={onImportComplete}
      />
    </div>
  );
}

function DataSourceEventsInvalidator({
  dataSourceIds,
  onImportComplete,
}: {
  dataSourceIds: string[];
  onImportComplete: () => void;
}) {
  return (
    <>
      {dataSourceIds.map((id) => (
        <DataSourceEventSubscriber
          key={id}
          dataSourceId={id}
          onImportComplete={onImportComplete}
        />
      ))}
    </>
  );
}

function DataSourceEventSubscriber({
  dataSourceId,
  onImportComplete,
}: {
  dataSourceId: string;
  onImportComplete: () => void;
}) {
  const trpc = useTRPC();
  useSubscription(
    trpc.dataSource.events.subscriptionOptions(
      { dataSourceId },
      {
        onData: (event) => {
          if (event.event === "ImportComplete") {
            onImportComplete();
          }
        },
      },
    ),
  );
  return null;
}
