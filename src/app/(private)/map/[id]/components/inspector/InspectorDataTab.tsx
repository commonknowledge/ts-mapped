import { useQuery } from "@tanstack/react-query";
import { MapPinIcon, PlusIcon, TableIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useChoroplethDataSource } from "@/app/(private)/map/[id]/hooks/useDataSources";
import { useInspectorContent } from "@/app/(private)/map/[id]/hooks/useInspector";
import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { useMapRef } from "@/app/(private)/map/[id]/hooks/useMapCore";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { useTable } from "@/app/(private)/map/[id]/hooks/useTable";
import DataSourceIcon from "@/components/DataSourceIcon";
import { AreaSetCodeLabels } from "@/labels";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { LayerType } from "@/types";
import { useRawAreaStat } from "../../hooks/useRawAreaStats";
import { useSelectedSecondaryArea } from "../../hooks/useSelectedSecondaryArea";
import { BoundaryDataPanel } from "./BoundaryDataPanel";
import DataSourcePropertiesList from "./DataSourcePropertiesList";
import InspectorDataConfig from "./InspectorDataConfig";
import SimplePropertiesList from "./SimplePropertiesList";
import type { RawAreaStat } from "../../hooks/useRawAreaStats";

interface InspectorDataTabProps {
  isDetailsView: boolean;
}

export default function InspectorDataTab({
  isDetailsView,
}: InspectorDataTabProps) {
  const mapRef = useMapRef();
  const { setSelectedDataSourceId } = useTable();
  const trpc = useTRPC();
  const { view } = useMapViews();
  const { selectedBoundary, focusedRecord } = useInspectorState();
  const { inspectorContent } = useInspectorContent();
  const { dataSource, properties = [], type } = inspectorContent || {};
  const areaStat = useRawAreaStat(selectedBoundary);
  const choroplethDataSource = useChoroplethDataSource();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const [selectedSecondaryArea] = useSelectedSecondaryArea();

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
    () => view?.inspectorConfig?.dataSources || [],
    [view?.inspectorConfig?.dataSources],
  );

  const isBoundary = type === LayerType.Boundary;

  const boundaryProperties = useMemo(() => {
    const boundaryProperties = [...properties];
    if (selectedSecondaryArea) {
      boundaryProperties.push({
        label:
          AreaSetCodeLabels[selectedSecondaryArea.areaSetCode] ||
          "Secondary boundary",
        value: selectedSecondaryArea.name,
      });
    }
    return boundaryProperties;
  }, [properties, selectedSecondaryArea]);

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (map && focusedRecord?.geocodePoint) {
      map.flyTo({ center: focusedRecord.geocodePoint, zoom: 12 });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isBoundary ? (
        <>
          <SimplePropertiesList properties={boundaryProperties} />
          <DataSourcePropertiesList
            dataSource={choroplethDataSource}
            json={getAreaStatJson(areaStat)}
          />
        </>
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

            const hasProperties =
              properties.length ||
              Object.keys(recordData?.json || {}).length ||
              boundaryConfigs.length;

            if (!hasProperties) {
              return (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No data available</p>
                </div>
              );
            }

            return (
              <>
                <SimplePropertiesList properties={properties} />
                {recordData?.json && (
                  <DataSourcePropertiesList
                    json={recordData?.json}
                    dataSource={dataSource}
                  />
                )}
              </>
            );
          })()}
        </>
      )}

      {boundaryConfigs.map((config, index) => (
        <BoundaryDataPanel
          key={config.id}
          config={config}
          selectedBoundary={selectedBoundary}
          markerPoint={focusedRecord?.geocodePoint}
          defaultExpanded={index === 0}
        />
      ))}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setConfigDialogOpen(true)}
      >
        <PlusIcon />
        Add data
      </Button>
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Data display configuration</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto min-h-0">
            <InspectorDataConfig />
          </div>
        </DialogContent>
      </Dialog>

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

const getAreaStatJson = (areaStat: RawAreaStat | null) => {
  const json: Record<string, unknown> = {};
  if (!areaStat) {
    return json;
  }
  if (areaStat.primaryColumn) {
    json[areaStat.primaryColumn] = areaStat.primary;
  }
  if (areaStat.secondaryColumn) {
    json[areaStat.secondaryColumn] = areaStat.secondary;
  }
  return json;
};
