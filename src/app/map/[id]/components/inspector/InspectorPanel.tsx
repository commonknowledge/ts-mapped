import { ArrowLeftIcon, MapPinIcon, TableIcon, XIcon } from "lucide-react";
import { useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useTableStore } from "@/app/map/[id]/stores/useTableStore";
import DataSourceIcon from "@/components/DataSourceIcon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import LayerTypeIcon from "../LayerTypeIcon";
import BoundaryMarkersList from "./BoundaryMarkersList";
import PropertiesList from "./PropertiesList";
import TurfMarkersList from "./TurfMarkersList";

export default function InspectorPanel() {
  const {
    inspectorContent,
    resetInspector,
    selectedBoundary,
    selectedTurf,
    selectedRecord,
    setSelectedRecord,
  } = useContext(InspectorContext);
  const { mapRef } = useContext(MapContext);
  const toggleDataSourceId = useTableStore((s) => s.toggleDataSourceId);
  const selectedDataSourceId = useTableStore((s) => s.selectedDataSourceId);

  if (!Boolean(inspectorContent)) {
    return <></>;
  }

  const { dataSource, properties, type } = inspectorContent ?? {};
  const tableOpen = Boolean(selectedDataSourceId);
  const isDetailsView =
    (selectedTurf && type !== LayerType.Turf) ||
    (selectedBoundary && type !== LayerType.Boundary);

  const onCloseDetailsView = () => {
    setSelectedRecord(null);
  };

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (map && selectedRecord?.point) {
      map.flyTo({ center: selectedRecord.point, zoom: 12 });
    }
  };

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 right-4 / flex flex-col gap-6 w-60 py-5",
        tableOpen ? "bottom-0" : "bottom-24", // to avoid clash with bug report button
      )}
    >
      <div className="relative z-100 w-full max-h-full overflow-auto / flex flex-col / rounded shadow-lg bg-white / text-sm font-sans">
        <div className="flex justify-between items-start gap-4 p-4">
          <h1 className="grow flex gap-2 / text-sm font-semibold">
            <LayerTypeIcon type={inspectorContent?.type} className="mt-1" />

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

        <div className="grow overflow-auto flex flex-col gap-4 [&:not(:empty)]:border-t [&:not(:empty)]:p-4">
          {dataSource && (
            <div className="bg-muted py-1 px-2 rounded">
              <h3 className="mb-1 / text-muted-foreground text-xs uppercase font-mono">
                Data source
              </h3>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <DataSourceIcon type={dataSource.config?.type as string} />
                </div>

                <p className="truncate">{dataSource.name}</p>
              </div>
            </div>
          )}

          <PropertiesList properties={properties} />

          {type === LayerType.Turf && <TurfMarkersList />}

          {type === LayerType.Boundary && <BoundaryMarkersList />}

          {(isDetailsView || dataSource) && (
            <div className="flex flex-col gap-3 border-t pt-4">
              {isDetailsView && selectedRecord?.point && (
                <Button onClick={() => flyToMarker()}>
                  <MapPinIcon />
                  View on map
                </Button>
              )}
              {dataSource && (
                <Button
                  variant="secondary"
                  onClick={() => toggleDataSourceId(dataSource.id)}
                >
                  <TableIcon />
                  View in table
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
