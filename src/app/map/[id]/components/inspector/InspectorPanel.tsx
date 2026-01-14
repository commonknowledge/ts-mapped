import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  MapPinIcon,
  SettingsIcon,
  TableIcon,
  XIcon,
} from "lucide-react";

import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import DataSourceIcon from "@/components/DataSourceIcon";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { useMapRef } from "../../hooks/useMapCore";
import BoundaryMarkersList from "./BoundaryMarkersList";
import PropertiesList from "./PropertiesList";
import TurfMarkersList from "./TurfMarkersList";
import {
  UnderlineTabs,
  UnderlineTabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "./UnderlineTabs";

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

  const trpc = useTRPC();
  const { data: recordData, isFetching: recordLoading } = useQuery(
    trpc.dataRecord.byId.queryOptions(
      {
        dataSourceId: focusedRecord?.dataSourceId || "",
        id: focusedRecord?.id || "",
      },
      {
        enabled: Boolean(focusedRecord?.dataSourceId),
      },
    ),
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

  return (
    <div
      id="inspector-panel"
      className={cn(
        "absolute top-0 bottom-0 right-4 / flex flex-col gap-6 py-5 h-fit max-h-full",
        tableOpen ? "bottom-0" : "bottom-24", // to avoid clash with bug report button
      )}
      style={{ width: "250px" }}
    >
      <div className="relative z-100 w-full max-h-full overflow-auto / flex flex-col / rounded shadow-lg bg-white / text-sm font-sans">
        <div className="flex justify-between items-start gap-4 p-4">
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
          <div className="px-4 border-t">
            <UnderlineTabsList className="w-full grid grid-cols-4">
              <UnderlineTabsTrigger value="data">Data</UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="markers">
                Markers {markerCount > 0 ? markerCount : ""}
              </UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="notes">Notes 0</UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="config" className="px-2">
                <SettingsIcon size={16} />
              </UnderlineTabsTrigger>
            </UnderlineTabsList>
          </div>

          <UnderlineTabsContent
            value="data"
            className="grow overflow-auto px-4 pb-4"
          >
            <div className="flex flex-col gap-4">
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
            className="grow overflow-auto px-4 pb-4"
          >
            <div className="flex flex-col gap-4">
              {type === LayerType.Turf && <TurfMarkersList />}
              {type === LayerType.Boundary && <BoundaryMarkersList />}
            </div>
          </UnderlineTabsContent>

          <UnderlineTabsContent
            value="notes"
            className="grow overflow-auto px-4 pb-4"
          >
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground">No notes yet</p>
            </div>
          </UnderlineTabsContent>

          <UnderlineTabsContent
            value="config"
            className="grow overflow-auto px-4 pb-4"
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
