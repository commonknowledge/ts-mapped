import { useQuery } from "@tanstack/react-query";
import { MapPinIcon, TableIcon } from "lucide-react";
import { useMapRef } from "@/app/map/[id]/hooks/useMapCore";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import DataSourceIcon from "@/components/DataSourceIcon";
import { type DataSource } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import PropertiesList from "./PropertiesList";
import type { SelectedRecord } from "@/app/map/[id]/types/inspector";

interface InspectorDataTabProps {
  dataSource: DataSource | null | undefined;
  properties: Record<string, unknown> | null | undefined;
  isDetailsView: boolean;
  focusedRecord: SelectedRecord | null;
}

export default function InspectorDataTab({
  dataSource,
  properties,
  isDetailsView,
  focusedRecord,
}: InspectorDataTabProps) {
  const mapRef = useMapRef();
  const { setSelectedDataSourceId } = useTable();
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

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (map && focusedRecord?.geocodePoint) {
      map.flyTo({ center: focusedRecord.geocodePoint, zoom: 12 });
    }
  };

  return (
    <div className="flex flex-col gap-4">
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

      {recordLoading ? (
        <span>Loading...</span>
      ) : !properties && !recordData?.json ? (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        <PropertiesList properties={{ ...properties, ...recordData?.json }} />
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
  );
}
