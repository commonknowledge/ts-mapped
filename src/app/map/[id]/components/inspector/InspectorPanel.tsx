import { ArrowLeftIcon, TableIcon, XIcon } from "lucide-react";
import { useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import DataSourceIcon from "@/components/DataSourceIcon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import LayerTypeIcon from "../LayerTypeIcon";
import PropertiesList from "./PropertiesList";
import TurfMarkersList from "./TurfMarkersList";

export default function InspectorPanel() {
  const { inspectorContent, resetInspector, selectedTurf, setSelectedRecord } =
    useContext(InspectorContext);
  const { setSelectedDataSourceId, selectedDataSourceId } =
    useContext(TableContext);

  if (!Boolean(inspectorContent)) {
    return <></>;
  }

  const { dataSource, properties, type } = inspectorContent ?? {};
  const tableOpen = Boolean(selectedDataSourceId);

  const onBackToTurfClick = () => {
    setSelectedRecord(null);
  };

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 right-4 / flex flex-col gap-6 w-60 pt-20 pb-5",
        tableOpen ? "bottom-0" : "bottom-24", // to avoid clash with bug report button
      )}
    >
      <div className="relative z-10 w-full max-h-full overflow-auto / flex flex-col / rounded shadow-lg bg-white / text-sm font-sans">
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

        {selectedTurf && type !== LayerType.Turf && (
          <div className="px-4 pb-2">
            <button
              onClick={() => onBackToTurfClick()}
              className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              <ArrowLeftIcon size={12} />
              Back to
              <span className="inline-flex items-center gap-1 font-semibold">
                <LayerTypeIcon type={LayerType.Turf} size={2} />
                {selectedTurf.name}
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

          {dataSource && (
            <div className="border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => setSelectedDataSourceId(dataSource.id)}
              >
                <TableIcon />
                View row in data source
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
