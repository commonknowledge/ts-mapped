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
import { AreaSetCodeLabels } from "@/labels";
import { type DataSource } from "@/server/models/DataSource";
import {
  type InspectorBoundaryConfig,
  InspectorBoundaryConfigType,
} from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { LayerType } from "@/types";
import { useDisplayAreaStat } from "../../hooks/useDisplayAreaStats";
import { useSelectedSecondaryArea } from "../../hooks/useSelectedSecondaryArea";
import DataSourceSelectButton from "../DataSourceSelectButton";
import { BoundaryDataPanel } from "./BoundaryDataPanel";
import {
  dedupeColumns,
  dedupeColumnItems,
  getSelectedColumnsOrdered,
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
  const { view, viewConfig, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { selectedBoundary } = useInspector();
  const initializationAttemptedRef = useRef(false);
  const { areaToDisplay, primaryLabel, secondaryLabel, columnMetadata } =
    useDisplayAreaStat(selectedBoundary);
  const [selectedSecondaryArea] = useSelectedSecondaryArea();

  const addDataSourceToConfig = useCallback(
    (dataSourceId: string) => {
      if (!view) return;
      const ds = getDataSourceById(dataSourceId);
      const defaultConfig = ds?.defaultInspectorConfig;
      const columns = dedupeColumns(defaultConfig?.columns ?? []);
      const columnItems = dedupeColumnItems(defaultConfig?.columnItems);
      const newBoundaryConfig: InspectorBoundaryConfig = {
        id: uuidv4(),
        dataSourceId,
        name: defaultConfig?.name ?? ds?.name ?? "Boundary Data",
        type: defaultConfig?.type ?? InspectorBoundaryConfigType.Simple,
        columns,
        columnOrder: defaultConfig?.columnOrder,
        columnItems,
        columnMetadata: defaultConfig?.columnMetadata,
        columnGroups: defaultConfig?.columnGroups,
        layout: defaultConfig?.layout ?? "single",
        icon: defaultConfig?.icon,
        color: defaultConfig?.color,
      };
      const prev = view.inspectorConfig?.boundaries || [];
      updateView({
        ...view,
        inspectorConfig: {
          ...view.inspectorConfig,
          boundaries: [...prev, newBoundaryConfig],
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

  const boundaryConfigs = useMemo(
    () => view?.inspectorConfig?.boundaries || [],
    [view?.inspectorConfig?.boundaries],
  );

  const isBoundary = type === LayerType.Boundary;

  const boundaryData = useMemo(() => {
    if (!isBoundary) return [];
    return boundaryConfigs.map((config) => ({
      config,
      dataSourceId: config.dataSourceId,
      areaCode: selectedBoundary?.code ?? "",
      columns: getSelectedColumnsOrdered(config),
    }));
  }, [isBoundary, selectedBoundary?.code, boundaryConfigs]);

  const boundaryProperties = useMemo(() => {
    if (!areaToDisplay) {
      return properties;
    }
    const propertiesWithData = { ...properties };
    if (primaryLabel) {
      propertiesWithData[primaryLabel] = areaToDisplay.primaryDisplayValue;
    }
    if (secondaryLabel) {
      propertiesWithData[secondaryLabel] = areaToDisplay.secondaryDisplayValue;
    }
    if (selectedSecondaryArea) {
      propertiesWithData[
        AreaSetCodeLabels[selectedSecondaryArea.areaSetCode] ||
          "Secondary boundary"
      ] = selectedSecondaryArea.name;
    }
    return propertiesWithData;
  }, [
    areaToDisplay,
    properties,
    primaryLabel,
    secondaryLabel,
    selectedSecondaryArea,
  ]);

  // Initialise boundary inspector config from choropleth data source when empty
  useEffect(() => {
    if (!view || type !== LayerType.Boundary || initializationAttemptedRef.current) return;
    const hasBoundaries = boundaryConfigs.length > 0;
    const hasAreaDataSource = viewConfig.areaDataSourceId;
    if (!hasBoundaries && hasAreaDataSource) {
      initializationAttemptedRef.current = true;
      addDataSourceToConfig(viewConfig.areaDataSourceId);
    }
  }, [view, type, viewConfig.areaDataSourceId, boundaryConfigs.length, addDataSourceToConfig]);

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
          <PropertiesList
            properties={boundaryProperties}
            columnMetadata={columnMetadata}
          />
          <section className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Data in this area
            </p>
            {boundaryConfigs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-200 py-6 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  No data sources added yet
                </p>
                <DataSourceSelectButton
                  className="mx-auto"
                  onSelect={addDataSourceToConfig}
                  selectButtonText="Add a data source"
                />
              </div>
            ) : (
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
                  />
                ))}
              </div>
            )}
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
                columnMetadata={dataSource?.columnMetadata}
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
