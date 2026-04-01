import { useQuery } from "@tanstack/react-query";
import { LayersIcon, MapPinIcon, SettingsIcon, TableIcon } from "lucide-react";
import { useState } from "react";
import { useInspectorContent } from "@/app/(private)/map/[id]/hooks/useInspector";
import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { useMapRef } from "@/app/(private)/map/[id]/hooks/useMapCore";
import { useTable } from "@/app/(private)/map/[id]/hooks/useTable";
import { useViewInspectorConfig } from "@/app/(private)/map/[id]/hooks/useViewInspectorConfig";
import DataSourceIcon from "@/components/DataSourceIcon";
import { useChoroplethDataSource } from "@/hooks/useDataSources";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { BIVARIATE_COLORS } from "../../colors";
import { useAreaStats } from "../../data";
import { useMapViews } from "../../hooks/useMapViews";
import { useRawAreaStat } from "../../hooks/useRawAreaStats";
import DataRecordColumns from "./DataRecordColumns";
import InspectorDataConfig from "./InspectorDataConfig";
import { InspectorPanelIcon } from "./inspectorPanelOptions";
import { LocationDataPanel } from "./LocationDataPanel";
import SimplePropertiesList from "./SimplePropertiesList";
import type { RawAreaStat } from "../../hooks/useRawAreaStats";

function getBivariateBucket({
  primary,
  secondary,
  primaryMin,
  primaryMax,
  secondaryMin,
  secondaryMax,
}: {
  primary: number;
  secondary: number;
  primaryMin: number;
  primaryMax: number;
  secondaryMin: number;
  secondaryMax: number;
}): { x: number; y: number } {
  const gridSize = 3;
  const primaryThresholds = Array.from(
    { length: gridSize - 1 },
    (_, i) => primaryMin + ((i + 1) * (primaryMax - primaryMin)) / gridSize,
  );
  const secondaryThresholds = Array.from(
    { length: gridSize - 1 },
    (_, i) =>
      secondaryMin + ((i + 1) * (secondaryMax - secondaryMin)) / gridSize,
  );

  const y =
    primary <= primaryThresholds[0]
      ? 0
      : primary <= primaryThresholds[1]
        ? 1
        : 2;
  const x =
    secondary <= secondaryThresholds[0]
      ? 0
      : secondary <= secondaryThresholds[1]
        ? 1
        : 2;

  return { x, y };
}

interface InspectorDataTabProps {
  isDetailsView: boolean;
}

export default function InspectorDataTab({
  isDetailsView,
}: InspectorDataTabProps) {
  const mapRef = useMapRef();
  const { setSelectedDataSourceId } = useTable();
  const trpc = useTRPC();
  const inspectorConfigs = useViewInspectorConfig();
  const { selectedBoundary, focusedRecord } = useInspectorState();
  const { inspectorContent } = useInspectorContent();
  const { dataSource, properties = [], type } = inspectorContent || {};
  const areaStat = useRawAreaStat(selectedBoundary);
  const { viewConfig } = useMapViews();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;
  const choroplethDataSource = useChoroplethDataSource();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

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

  const isBoundary = type === LayerType.Boundary;
  const hasChoroplethVisualisation = Boolean(
    choroplethDataSource?.id && viewConfig.areaDataColumn,
  );
  const bivariateBucket =
    areaStats?.secondary &&
    typeof areaStat?.primary === "number" &&
    typeof areaStat?.secondary === "number"
      ? getBivariateBucket({
          primary: areaStat.primary,
          secondary: areaStat.secondary,
          primaryMin: areaStats.primary?.minValue ?? 0,
          primaryMax: areaStats.primary?.maxValue ?? 0,
          secondaryMin: areaStats.secondary?.minValue ?? 0,
          secondaryMax: areaStats.secondary?.maxValue ?? 0,
        })
      : null;

  const bivariateBucketLabel = bivariateBucket
    ? {
        primaryBand:
          bivariateBucket.y === 0
            ? "low"
            : bivariateBucket.y === 1
              ? "medium"
              : "high",
        secondaryBand:
          bivariateBucket.x === 0
            ? "low"
            : bivariateBucket.x === 1
              ? "medium"
              : "high",
      }
    : null;

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (map && focusedRecord?.geocodePoint) {
      map.flyTo({ center: focusedRecord.geocodePoint, zoom: 12 });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isBoundary && hasChoroplethVisualisation ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 px-2.5 py-2 flex flex-col gap-3">
          <div className="min-w-0 flex items-center justify-between gap-2">
            <h3 className="text-[11px] uppercase font-mono tracking-wide text-muted-foreground inline-flex items-center gap-1">
              <LayersIcon className="h-3.5 w-3.5" />
              On map visualisation
            </h3>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <div className="min-w-0">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 min-w-0">
                <DataRecordColumns
                  json={getAreaStatJson(areaStat)}
                  dataSourceId={choroplethDataSource?.id}
                />
              </dl>
              {bivariateBucketLabel && viewConfig.areaDataSecondaryColumn && (
                <p className="mt-2 text-xs text-muted-foreground">
                  This area has{" "}
                  <span className="font-medium text-neutral-700">
                    {bivariateBucketLabel.primaryBand}
                  </span>{" "}
                  {viewConfig.areaDataColumn} and{" "}
                  <span className="font-medium text-neutral-700">
                    {bivariateBucketLabel.secondaryBand}
                  </span>{" "}
                  {viewConfig.areaDataSecondaryColumn}.
                </p>
              )}
            </div>
            {bivariateBucket && (
              <div
                className="grid grid-cols-3 gap-0.5 p-1 rounded bg-white/70 border border-black/5 shrink-0"
                aria-label="Bivariate grid preview"
              >
                {[...BIVARIATE_COLORS].reverse().map((row, i) =>
                  row.map((color, j) => {
                    const y = BIVARIATE_COLORS.length - i - 1;
                    const x = j;
                    const isActive =
                      bivariateBucket.x === x && bivariateBucket.y === y;
                    return (
                      <span
                        key={`${i}-${j}`}
                        className={cn(
                          "h-4 w-4 rounded-[3px] border border-black/10",
                          !isActive && "opacity-35",
                          isActive && "ring-1 ring-black/35",
                        )}
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                    );
                  }),
                )}
              </div>
            )}
          </div>
          {choroplethDataSource && (
            <div className="shrink-0 pt-1 border-t border-neutral-200/70 flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                Data source
              </span>
              <span className="text-xs text-muted-foreground truncate flex items-center gap-1.5 max-w-[220px]">
                {choroplethDataSource.defaultInspectorConfig?.icon ? (
                  <InspectorPanelIcon
                    iconName={choroplethDataSource.defaultInspectorConfig.icon}
                    className="h-4 w-4 shrink-0 text-neutral-600"
                  />
                ) : (
                  <span className="shrink-0 text-neutral-600">
                    <DataSourceIcon
                      type={choroplethDataSource.config?.type as string}
                    />
                  </span>
                )}
                <span className="truncate text-neutral-700">
                  {choroplethDataSource.name}
                </span>
              </span>
            </div>
          )}
        </div>
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
              inspectorConfigs.length;

            if (!hasProperties) {
              return (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">Not found</p>
                </div>
              );
            }

            return (
              <>
                <SimplePropertiesList properties={properties} />
                {recordData?.json && (
                  <DataRecordColumns
                    json={recordData?.json}
                    dataSourceId={dataSource?.id}
                  />
                )}
              </>
            );
          })()}
        </>
      )}

      {inspectorConfigs.map((config, index) => (
        <LocationDataPanel
          key={config.id}
          dataSourceId={config.dataSourceId}
          selectedBoundary={selectedBoundary}
          markerPoint={focusedRecord?.geocodePoint}
          defaultExpanded={index === 0}
        />
      ))}
      <Button
        variant="outline"
        className="w-full"
        size="sm"
        onClick={() => setConfigDialogOpen(true)}
      >
        <SettingsIcon />
        Manage inspector data
      </Button>
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data display configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
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
