import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  MapPinIcon,
  SettingsIcon,
  TableIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import DataSourceIcon from "@/components/DataSourceIcon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { CalculationType, ColorScheme } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { useAreaStats } from "../../data";
import { useMapRef } from "../../hooks/useMapCore";
import { useMapViews } from "../../hooks/useMapViews";
import {
  useChoroplethDataSource,
  useNonPointDataSources,
} from "../../hooks/useDataSources";
import { useChoropleth } from "../../hooks/useChoropleth";
import BoundaryMarkersList from "./BoundaryMarkersList";
import PropertiesList from "./PropertiesList";
import TurfMarkersList from "./TurfMarkersList";
import VisualizedColumnsList from "./VisualizedColumnsList";
import {
  UnderlineTabs,
  UnderlineTabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "./UnderlineTabs";
import type { MapConfig } from "@/server/models/Map";

export default function InspectorPanel() {
  const {
    inspectorContent,
    resetInspector,
    selectedBoundary,
    selectedTurf,
    focusedRecord,
    setFocusedRecord,
    selectedRecords,
  } = useInspector();
  const mapRef = useMapRef();
  const { setSelectedDataSourceId, selectedDataSourceId } = useTable();
  const { viewConfig, updateViewConfig } = useMapViews();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;
  
  // Show error toast if area stats query fails
  useEffect(() => {
    if (areaStatsQuery?.error) {
      const errorMessage = areaStatsQuery.error instanceof Error 
        ? areaStatsQuery.error.message 
        : "Failed to load visualization data";
      toast.error(errorMessage);
    }
  }, [areaStatsQuery?.error]);
  const choroplethDataSource = useChoroplethDataSource();
  const nonPointDataSources = useNonPointDataSources();
  const { setBoundariesPanelOpen } = useChoropleth();

  const trpc = useTRPC();
  const { data: recordData, isFetching: recordLoading } = useQuery(
    trpc.dataRecord.byId.queryOptions(
      {
        dataSourceId: focusedRecord?.dataSourceId || "",
        id: focusedRecord?.id || "",
      },
      {
        enabled: Boolean(focusedRecord?.dataSourceId),
      }
    )
  );

  if (!Boolean(inspectorContent)) {
    return <></>;
  }

  const { dataSource, properties, type } = inspectorContent ?? {};
  const tableOpen = Boolean(selectedDataSourceId);
  const isDetailsView =
    (selectedTurf && type !== LayerType.Turf) ||
    (selectedBoundary && type !== LayerType.Boundary);

  const markerCount = selectedRecords?.length || 0;

  const onCloseDetailsView = () => {
    setFocusedRecord(null);
  };

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (map && focusedRecord?.geocodePoint) {
      map.flyTo({ center: focusedRecord.geocodePoint, zoom: 12 });
    }
  };


  const handleVisualiseSaved = (visualization: NonNullable<MapConfig["savedVisualizations"]>[0]) => {
    updateViewConfig({
      areaDataSourceId: visualization.areaDataSourceId,
      areaDataColumn: visualization.areaDataColumn,
      areaDataSecondaryColumn: visualization.areaDataSecondaryColumn || "",
      calculationType: visualization.calculationType as CalculationType | undefined,
      colorScheme: (visualization.colorScheme as ColorScheme) || undefined,
      reverseColorScheme: visualization.reverseColorScheme,
    });
    setBoundariesPanelOpen(true);
  };

  return (
    <div
      id="inspector-panel"
      className={cn(
        "absolute top-0 bottom-0 right-4 / flex flex-col gap-6 py-5 h-fit max-h-full",
        tableOpen ? "bottom-0" : "bottom-24" // to avoid clash with bug report button
      )}
      style={{ minWidth: "250px" }}
    >
      <div className="relative z-100 w-full max-h-full overflow-auto / flex flex-col / rounded shadow-lg bg-white / text-sm font-sans">
        <div className="flex justify-between items-center gap-4 p-3">
          <h1 className="grow flex gap-2 / text-sm font-semibold">
            {inspectorContent?.name as string}
          </h1>
          <button
            className="cursor-pointer"
            aria-label="Close inspector panel"
            onClick={() => resetInspector()}
          >
            <XIcon size={16} />
          </button>
        </div>

        {isDetailsView && (
          <div className="px-4 pb-2">
            <button
              onClick={() => onCloseDetailsView()}
              className="flex gap-1 text-xs text-left opacity-70 hover:opacity-100 cursor-pointer"
            >
              <ArrowLeftIcon size={12} className="mt-[2px]" />
              <span>
                Back to{" "}
                <span className="inline-flex items-center gap-1 font-semibold">
                  {selectedTurf
                    ? selectedTurf.name || "Area"
                    : selectedBoundary
                      ? selectedBoundary.name || "Boundary"
                      : ""}
                </span>
              </span>
            </button>
          </div>
        )}

        <UnderlineTabs
          defaultValue="data"
          className="flex flex-col overflow-hidden"
        >
          <UnderlineTabsList className="w-full flex gap-6 border-t px-3">
            <UnderlineTabsTrigger value="data">Data</UnderlineTabsTrigger>
            <UnderlineTabsTrigger value="markers">
              Markers {markerCount > 0 ? markerCount : ""}
            </UnderlineTabsTrigger>
            <UnderlineTabsTrigger value="notes" className="hidden">
              Notes 0
            </UnderlineTabsTrigger>
            <UnderlineTabsTrigger value="config" className="px-2 hidden">
              <SettingsIcon size={16} />
            </UnderlineTabsTrigger>
          </UnderlineTabsList>

          <UnderlineTabsContent value="data" className="grow overflow-auto p-3">
            <div className="flex flex-col gap-4">
              {/* Show all columns from non-point data sources for boundaries */}
              {selectedBoundary &&
                nonPointDataSources.length > 0 &&
                nonPointDataSources.map((dataSource) => {
                  if (
                    !dataSource.columnDefs ||
                    dataSource.columnDefs.length === 0
                  ) {
                    return null;
                  }
                  const isVisualized =
                    choroplethDataSource?.id === dataSource.id;
                  return (
                    <VisualizedColumnsList
                      key={dataSource.id}
                      columns={dataSource.columnDefs}
                      dataSourceId={dataSource.id}
                      dataSourceName={dataSource.name}
                      areaStats={isVisualized ? areaStats : null}
                      selectedBoundaryAreaCode={selectedBoundary.areaCode}
                      selectedBoundaryAreaSetCode={selectedBoundary.areaSetCode}
                      visualizedColumnName={
                        isVisualized ? viewConfig.areaDataColumn || null : null
                      }
                      onVisualise={(columnName: string) => {
                        updateViewConfig({
                          areaDataSourceId: dataSource.id,
                          areaDataColumn: columnName,
                          calculationType: CalculationType.Sum,
                        });
                        setBoundariesPanelOpen(true);
                      }}
                      onVisualiseSaved={handleVisualiseSaved}
                    />
                  );
                })}

              {dataSource && (
                <div className="bg-muted py-1 px-2 rounded">
                  <h3 className="mb-1 / text-muted-foreground text-xs uppercase font-mono">
                    Data source
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0">
                      <DataSourceIcon
                        type={dataSource.config?.type as string}
                      />
                    </div>

                    <p className="truncate">{dataSource.name}</p>
                  </div>
                </div>
              )}

              {recordLoading ? (
                <span>Loading...</span>
              ) : (
                <PropertiesList
                  properties={{ ...properties, ...recordData?.json }}
                />
              )}

              {(isDetailsView || dataSource) && (
                <div className="flex flex-col gap-3 border-t pt-4">
                  {isDetailsView && focusedRecord?.geocodePoint && (
                    <Button onClick={() => flyToMarker()}>
                      <MapPinIcon />
                      View on map
                    </Button>
                  )}
                  {dataSource && (
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedDataSourceId(dataSource.id)}
                    >
                      <TableIcon />
                      View in table
                    </Button>
                  )}
                </div>
              )}
            </div>
          </UnderlineTabsContent>

          <UnderlineTabsContent
            value="markers"
            className="grow overflow-auto p-3"
          >
            <div className="flex flex-col gap-4">
              {type === LayerType.Turf && <TurfMarkersList />}
              {type === LayerType.Boundary && <BoundaryMarkersList />}
            </div>
          </UnderlineTabsContent>

          <UnderlineTabsContent
            value="notes"
            className="grow overflow-auto p-3"
          >
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground">No notes yet</p>
            </div>
          </UnderlineTabsContent>

          <UnderlineTabsContent
            value="config"
            className="grow overflow-auto p-3"
          >
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground">Configuration options</p>
            </div>
          </UnderlineTabsContent>
        </UnderlineTabs>
      </div>
    </div>
  );
}
