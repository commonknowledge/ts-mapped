import { TableIcon, XIcon } from "lucide-react";
import { useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import DataSourceIcon from "@/components/DataSourceIcon";
import { Button } from "@/shadcn/ui/button";
import { mapColors } from "../../styles";
import PropertiesList from "./PropertiesList";

export default function InspectorPanel() {
  const { inspectorContent, resetInspector } = useContext(InspectorContext);
  const { setSelectedDataSourceId } = useContext(TableContext);

  if (!Boolean(inspectorContent)) {
    return <></>;
  }

  const { dataSource, properties, type } = inspectorContent ?? {};

  return (
    <div className="absolute top-0 bottom-0 right-4 / flex flex-col gap-6 w-60 pt-20 pb-5">
      <div className="relative z-10 w-full max-h-full overflow-auto / flex flex-col / rounded shadow-lg bg-white / text-sm font-sans">
        <div className="flex justify-between items-start gap-4 p-4">
          <h2 className="grow flex gap-2 / text-sm font-semibold">
            <div
              className="shrink-0 mt-1 w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  type === "member"
                    ? mapColors.member.color
                    : type === "marker"
                      ? mapColors.markers.color
                      : mapColors.areas.color,
              }}
            ></div>
            {inspectorContent?.name as string}
          </h2>
          <button
            className="cursor-pointer"
            aria-label="Close inspector panel"
            onClick={() => resetInspector()}
          >
            <XIcon size={16} />
          </button>
        </div>

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
