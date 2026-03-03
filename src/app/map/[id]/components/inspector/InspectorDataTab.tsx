import { useQuery } from "@tanstack/react-query";
import { MapPinIcon, TableIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useMapRef } from "@/app/map/[id]/hooks/useMapCore";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import DataSourceIcon from "@/components/DataSourceIcon";
import { type DataSource } from "@/server/models/DataSource";
import { type InspectorDataSourceConfig } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { LayerType } from "@/types";
import { useDisplayAreaStat } from "../../hooks/useDisplayAreaStats";
import { useSelectedSecondaryArea } from "../../hooks/useSelectedSecondaryArea";
import DataSourceSelectButton from "../DataSourceSelectButton";
import { BoundaryDataPanel } from "./BoundaryDataPanel";
import {
  getSelectedColumnsOrdered,
  normalizeInspectorDataSourceConfig,
} from "./inspectorColumnOrder";
import InspectorOnMapSection from "./InspectorOnMapSection";
import PropertiesList from "./PropertiesList";
import type { SelectedRecord } from "@/app/map/[id]/types/inspector";

interface InspectorDataTabProps {
  dataSource: DataSource | null | undefined;
  properties: Record<string, unknown> | null | undefined;
  isDetailsView: boolean;
  focusedRecord: SelectedRecord | null;
  type: LayerType | undefined;
  /** When set, "Add a data source" opens the inspector settings modal instead of the data source picker */
  onOpenInspectorSettings?: () => void;
  /** Open inspector settings with a specific data source pre-selected (used by per-datasource cogs). */
  onOpenInspectorSettingsForDataSource?: (dataSourceId: string) => void;
}

export default function InspectorDataTab({
  dataSource,
  properties,
  isDetailsView,
  focusedRecord,
  type,
  onOpenInspectorSettings,
  onOpenInspectorSettingsForDataSource,
}: InspectorDataTabProps) {
  const mapRef = useMapRef();
  const { setSelectedDataSourceId } = useTable();
  const trpc = useTRPC();
  const { view, viewConfig, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { selectedBoundary } = useInspector();
  const initializationAttemptedRef = useRef(false);
  useDisplayAreaStat(selectedBoundary);
  useSelectedSecondaryArea();

  const addDataSourceToConfig = useCallback(
    (dataSourceId: string) => {
      if (!view) return;
      const ds = getDataSourceById(dataSourceId);
      if (!ds) return;
      const defaultConfig = ds.defaultInspectorConfig;
      const allCols = ds.columnDefs.map((c) => c.name);
      const raw: InspectorDataSourceConfig = {
        id: uuidv4(),
        dataSourceId,
        name: defaultConfig?.name ?? ds.name ?? "Boundary Data",
        columns: defaultConfig?.columns ?? [],
        columnOrder: defaultConfig?.columnOrder,
        columnItems: defaultConfig?.columnItems,
        columnMetadata: defaultConfig?.columnMetadata,
        columnGroups: defaultConfig?.columnGroups,
        layout: defaultConfig?.layout ?? "single",
        icon: defaultConfig?.icon,
        color: defaultConfig?.color,
      };
      const newBoundaryConfig =
        normalizeInspectorDataSourceConfig(raw, allCols) ?? raw;
      const prev = view.inspectorConfig?.dataSources || [];
      updateView({
        ...view,
        inspectorConfig: {
          ...view.inspectorConfig,
          dataSources: [...prev, newBoundaryConfig],
        },
      });
    },
    [getDataSourceById, updateView, view],
  );

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

  const dataSourceConfigs = useMemo(
    () => view?.inspectorConfig?.dataSources || [],
    [view?.inspectorConfig?.dataSources],
  );

  const isBoundary = type === LayerType.Boundary;

  const boundaryData = useMemo(() => {
    if (!isBoundary) return [];
    return dataSourceConfigs.map((config) => ({
      config,
      dataSourceId: config.dataSourceId,
      areaCode: selectedBoundary?.code ?? "",
      columns: getSelectedColumnsOrdered(config),
    }));
  }, [isBoundary, selectedBoundary?.code, dataSourceConfigs]);

  // Initialise boundary inspector config from choropleth data source when empty
  useEffect(() => {
    if (
      !view ||
      type !== LayerType.Boundary ||
      initializationAttemptedRef.current
    )
      return;
    const hasDataSourceConfigs = dataSourceConfigs.length > 0;
    const hasAreaDataSource = viewConfig.areaDataSourceId;
    if (!hasDataSourceConfigs && hasAreaDataSource) {
      initializationAttemptedRef.current = true;
      addDataSourceToConfig(viewConfig.areaDataSourceId);
    }
  }, [
    view,
    type,
    viewConfig.areaDataSourceId,
    addDataSourceToConfig,
    dataSourceConfigs.length,
  ]);

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
          <InspectorOnMapSection />
          <section className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Data in this area
            </p>
            {dataSourceConfigs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No data sources added yet
              </p>
            )}
            {dataSourceConfigs.length > 0 && (
              <div className="flex flex-col gap-3">
                {boundaryData.map((item) => (
                  <BoundaryDataPanel
                    key={item.config.id}
                    config={item.config}
                    dataSourceId={item.dataSourceId}
                    areaCode={item.areaCode}
                    columns={item.columns}
                    columnMetadata={item.config.columnMetadata}
                    columnGroups={item.config.columnGroups}
                    layout={item.config.layout}
                    defaultExpanded={true}
                    onOpenInspectorSettings={
                      onOpenInspectorSettingsForDataSource
                    }
                  />
                ))}
              </div>
            )}
            <div className="rounded-lg border border-dashed border-neutral-200 py-4 text-center">
              {onOpenInspectorSettings ? (
                <Button
                  variant="outline"
                  className="w-full max-w-[200px] mx-auto justify-center"
                  onClick={onOpenInspectorSettings}
                >
                  Add a data source
                </Button>
              ) : (
                <DataSourceSelectButton
                  className="mx-auto"
                  onSelect={addDataSourceToConfig}
                  selectButtonText="Add a data source"
                />
              )}
            </div>
          </section>
        </>
      ) : (
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

            return (
              <PropertiesList
                properties={mergedProperties}
                columnMetadata={
                  dataSourceConfigs.find(
                    (c) => c.dataSourceId === dataSource?.id,
                  )?.columnMetadata ||
                  dataSource?.defaultInspectorConfig?.columnMetadata
                }
              />
            );
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
