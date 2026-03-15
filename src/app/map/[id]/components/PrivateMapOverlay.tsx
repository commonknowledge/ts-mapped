"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
import { useAreaStats } from "../data";
import { useInfoPopupOpen } from "../hooks/useInfoPopup";
import { useMapConfig } from "../hooks/useMapConfig";
import { useShowControls } from "../hooks/useMapControls";
import {
  useMapId,
  useMapRef,
  useSetMapBottomPadding,
} from "../hooks/useMapCore";
import { useMapQuery } from "../hooks/useMapQuery";
import { CONTROL_PANEL_WIDTH } from "../styles";
import { getDataSourceIds } from "../utils/map";
import ControlPanel from "./controls/ControlPanel";
import VisualisationPanel from "./controls/VisualisationPanel/VisualisationPanel";
import EditColumnMetadataModal from "./EditColumnMetadataModal";
import Loading from "./Loading";
import MapInfoPopup from "./MapInfoPopup";
import PrivateMapControls from "./PrivateMapControls";
import MapTable from "./table/MapTable";

export default function PrivateMapOverlay() {
  const mapRef = useMapRef();
  const showControls = useShowControls();
  const mapId = useMapId();

  const areaStatsQuery = useAreaStats();

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

  const [infoPopupOpen, setInfoPopupOpen] = useInfoPopupOpen();

  // Auto-open info popup on first visit if content exists
  useEffect(() => {
    if (!map?.infoContent || !mapId) return;
    const key = `mapped:mapInfoSeen:${mapId}`;
    if (localStorage.getItem(key) !== "true") {
      setInfoPopupOpen(true);
      localStorage.setItem(key, "true");
    }
  }, [map?.infoContent, mapId, setInfoPopupOpen]);

  const panelGroupRef = useRef<HTMLDivElement>(null);
  const setMapBottomPadding = useSetMapBottomPadding();

  const updateMapBottomPadding = useCallback(
    (tablePercent: number) => {
      const containerHeight = panelGroupRef.current?.clientHeight ?? 0;
      setMapBottomPadding(Math.round((tablePercent / 100) * containerHeight));
      // Resize after a tick so the container has updated
      setTimeout(() => mapRef?.current?.resize(), 0);
    },
    [setMapBottomPadding, mapRef],
  );

  // Reset bottom padding and resize map when table hides
  useEffect(() => {
    if (!selectedDataSourceId) {
      setMapBottomPadding(0);
      setTimeout(() => mapRef?.current?.resize(), 0);
    }
  }, [selectedDataSourceId, setMapBottomPadding, mapRef]);

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
    <div className="flex flex-col h-full">
      <div className="flex w-full grow min-h-0 relative">
        <div className="pointer-events-auto">
          <ControlPanel />
        </div>
        <div className="pointer-events-auto">
          <VisualisationPanel
            positionLeft={showControls ? CONTROL_PANEL_WIDTH : 0}
          />
        </div>
        <div className="pointer-events-auto">
          <PrivateMapControls />
        </div>
        <div
          ref={panelGroupRef}
          className="flex flex-col gap-4 grow relative min-w-0"
        >
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel className="relative" id="map" order={0}>
              {/* Map is rendered by the shared layout and shows through this transparent area */}
            </ResizablePanel>
            {selectedDataSourceId && (
              <>
                <ResizableHandle
                  withHandle
                  style={paddedStyle}
                  className="pointer-events-auto"
                />
                <ResizablePanel
                  defaultSize={50}
                  onResize={updateMapBottomPadding}
                  id="table"
                  order={1}
                  className="pointer-events-auto"
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
