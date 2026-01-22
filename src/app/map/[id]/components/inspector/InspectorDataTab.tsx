import { useQuery } from "@tanstack/react-query";
import { MapPinIcon, TableIcon } from "lucide-react";
import { useMemo } from "react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useMapRef } from "@/app/map/[id]/hooks/useMapCore";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import DataSourceIcon from "@/components/DataSourceIcon";
import { type DataSource } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { LayerType } from "@/types";
import { BoundaryDataPanel } from "./BoundaryDataPanel";
import PropertiesList from "./PropertiesList";
import type { SelectedRecord } from "@/app/map/[id]/types/inspector";

interface InspectorDataTabProps {
  dataSource: DataSource | null | undefined;
  properties: Record<string, unknown> | null | undefined;
  isDetailsView: boolean;
  focusedRecord: SelectedRecord | null;
  type: LayerType | undefined;
}

export default function InspectorDataTab({
  dataSource,
  properties,
  isDetailsView,
  focusedRecord,
  type,
}: InspectorDataTabProps) {
  const mapRef = useMapRef();
  const { setSelectedDataSourceId } = useTable();
  const trpc = useTRPC();
  const { view } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { selectedBoundary } = useInspector();

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

  const boundaryConfigs = useMemo(
    () => view?.inspectorConfig?.boundaries || [],
    [view?.inspectorConfig?.boundaries],
  );
  const shouldUseInspectorConfig =
    boundaryConfigs.length > 0 &&
    type === LayerType.Boundary &&
    boundaryConfigs.some((c) => c.columns.length);

  const boundaryData = useMemo(() => {
    if (
      !shouldUseInspectorConfig ||
      !selectedBoundary?.areaCode ||
      !selectedBoundary?.areaSetCode
    )
      return [];

    return boundaryConfigs.map((config) => {
      const ds = getDataSourceById(config.dataSourceId);

      return {
        config,
        dataSource: ds,
        dataSourceId: config.dataSourceId,
        areaCode: selectedBoundary.areaCode,
        areaSetCode: selectedBoundary.areaSetCode,
        columns: config.columns,
      };
    });
  }, [
    shouldUseInspectorConfig,
    selectedBoundary,
    boundaryConfigs,
    getDataSourceById,
  ]);

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (map && focusedRecord?.geocodePoint) {
      map.flyTo({ center: focusedRecord.geocodePoint, zoom: 12 });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {shouldUseInspectorConfig ? (
        // Show data based on inspector config
        boundaryData.length > 0 ? (
          boundaryData.map((item, index) => (
            <BoundaryDataPanel
              key={item.config.id}
              config={item.config}
              dataSourceId={item.dataSourceId}
              areaCode={item.areaCode}
              columns={item.columns}
              defaultExpanded={index === 0}
            />
          ))
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No boundary data configured</p>
          </div>
        )
      ) : (
        // Show default data source and properties
        <>
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

          {(() => {
            if (recordLoading) {
              return <span>Loading...</span>;
            }

            const mergedProperties = {
              ...(properties ?? {}),
              ...(recordData?.json ?? {}),
            };

            const hasProperties =
              mergedProperties && Object.keys(mergedProperties).length > 0;

            if (!hasProperties) {
              return (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No data available</p>
                </div>
              );
            }

            return <PropertiesList properties={mergedProperties} />;
          })()}
        </>
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
