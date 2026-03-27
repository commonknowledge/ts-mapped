import { ChevronDown, CornerDownRight, LoaderPinwheel } from "lucide-react";
import { useEffect, useState } from "react";
import { InspectorPanelIcon } from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import { useDataSourceColumns } from "@/app/(private)/map/[id]/hooks/useDataSourceColumn";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import DataSourceIcon from "@/components/DataSourceIcon";
import { MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import {
  useChoroplethDataSource,
  useDataSources,
} from "@/hooks/useDataSources";
import { AreaSetGroupCodeLabels, AreaSetGroupCodeYears } from "@/labels";
import { ColumnType } from "@/models/DataSource";
import { MapType } from "@/models/MapView";
import { CalculationType } from "@/models/shared";
import { Combobox } from "@/shadcn/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { useColorScheme } from "../../colors";
import { useAreaStats } from "../../data";
import BivariateLegend from "../BivariateLagend";
import { getValidAreaSetGroupCodes } from "../Choropleth/areas";
import ColumnMetadataIcons from "../ColumnMetadataIcons";
import { DataSourceSelectModal } from "../DataSourceSelectButton";
import { LegendBars } from "./LegendBars";
import type { AreaSetGroupCode } from "@/models/AreaSet";

export default function Legend() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();
  const { data: dataSources, getDataSourceById } = useDataSources();
  const { columnMetadata } = useDataSourceColumns(dataSource?.id);

  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [invalidDataSourceId, setInvalidDataSourceId] = useState<string | null>(
    null,
  );
  const [bivariatePickerOpen, setBivariatePickerOpen] = useState(false);

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;
  const isLoading = areaStatsQuery?.isFetching;

  const colorScheme = useColorScheme({
    areaStats,
    viewConfig,
  });

  const hasDataSource = Boolean(viewConfig.areaDataSourceId);
  const hasColumn = Boolean(
    viewConfig.areaDataColumn ||
    viewConfig.calculationType === CalculationType.Count,
  );
  const isBivariate =
    areaStats?.calculationType !== CalculationType.Count &&
    viewConfig.areaDataColumn &&
    viewConfig.areaDataSecondaryColumn;

  const isCount = viewConfig.calculationType === CalculationType.Count;
  const canSelectColumn = !isCount && hasDataSource;

  const columnOneIsNumber =
    Boolean(viewConfig.areaDataColumn) &&
    dataSource?.columnDefs.find((c) => c.name === viewConfig.areaDataColumn)
      ?.type === ColumnType.Number;
  const canSelectSecondaryColumn =
    !isCount && Boolean(viewConfig.areaDataColumn) && columnOneIsNumber;

  const showSecondColumnRow =
    canSelectSecondaryColumn &&
    (Boolean(viewConfig.areaDataSecondaryColumn) || bivariatePickerOpen);

  useEffect(() => {
    if (!dataSource || !viewConfig.areaDataColumn) return;
    const primaryIsNumber =
      dataSource.columnDefs.find((c) => c.name === viewConfig.areaDataColumn)
        ?.type === ColumnType.Number;
    if (!primaryIsNumber) {
      if (viewConfig.areaDataSecondaryColumn) {
        updateViewConfig({ areaDataSecondaryColumn: undefined });
      }
      setBivariatePickerOpen(false);
    }
  }, [
    dataSource,
    viewConfig.areaDataColumn,
    viewConfig.areaDataSecondaryColumn,
    updateViewConfig,
  ]);

  const secondaryColumnComboboxOptions = [
    { value: NULL_UUID, label: "None" },
    ...(dataSources
      ?.find((ds) => ds.id === viewConfig.areaDataSourceId)
      ?.columnDefs.filter(
        (col) =>
          col.type === ColumnType.Number &&
          col.name !== viewConfig.areaDataColumn,
      )
      .map((col) => ({
        value: col.name,
        label: `${col.name} (${col.type})`,
        hint: columnMetadata.find((m) => m.name === col.name)?.description,
      })) || []),
  ];

  const handleDataSourceSelect = async (dataSourceId: string) => {
    const selectedAreaSetGroup = viewConfig.areaSetGroupCode;
    const ds = getDataSourceById(dataSourceId);
    if (!selectedAreaSetGroup) {
      updateViewConfig({
        areaDataSourceId: dataSourceId,
        areaDataSecondaryColumn: undefined,
        ...(ds?.public && ds.defaultChoroplethConfig
          ? {
              calculationType: ds.defaultChoroplethConfig.calculationType,
              areaDataColumn: ds.defaultChoroplethConfig.column,
            }
          : {}),
      });
      setIsDataSourceModalOpen(false);
      return;
    }
    const validAreaSetGroups = getValidAreaSetGroupCodes(ds?.geocodingConfig);
    if (validAreaSetGroups.includes(selectedAreaSetGroup)) {
      updateViewConfig({
        areaDataSourceId: dataSourceId,
        areaDataSecondaryColumn: undefined,
        ...(ds?.public && ds.defaultChoroplethConfig
          ? {
              calculationType: ds.defaultChoroplethConfig.calculationType,
              areaDataColumn: ds.defaultChoroplethConfig.column,
            }
          : {}),
      });
      setIsDataSourceModalOpen(false);
      return;
    }
    setIsDataSourceModalOpen(false);
    setInvalidDataSourceId(dataSourceId);
  };

  const toggleBivariatePicker = () => {
    if (viewConfig.areaDataSecondaryColumn) {
      updateViewConfig({ areaDataSecondaryColumn: undefined });
      setBivariatePickerOpen(false);
      return;
    }
    if (bivariatePickerOpen) {
      setBivariatePickerOpen(false);
      return;
    }
    setBivariatePickerOpen(true);
  };

  return (
    <div className="group flex flex-col rounded-sm overflow-auto bg-white border border-neutral-200 w-full">
      {/* Data source + column */}
      <div className="flex flex-col gap-2 p-2">
        <p className="text-xs text-muted-foreground font-mono font-medium uppercase mb-1">
          Data source
        </p>

        <button
          type="button"
          className={cn(
            "flex w-full min-w-0 items-center gap-2 rounded-md border border-input bg-background px-3 h-8 text-xs font-normal shadow-xs outline-none transition-[color,box-shadow,border]",
            "hover:bg-accent/60 hover:border-action-hover",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          )}
          onClick={() => setIsDataSourceModalOpen(true)}
        >
          <span className="shrink-0 text-muted-foreground" aria-hidden>
            {dataSource?.defaultInspectorConfig?.icon?.trim() ? (
              <InspectorPanelIcon
                iconName={dataSource.defaultInspectorConfig.icon.trim()}
                className="h-4 w-4"
              />
            ) : (
              <DataSourceIcon type={dataSource?.config?.type ?? "unknown"} />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-left font-medium">
            {dataSource?.defaultInspectorConfig?.name?.trim()
              ? dataSource.defaultInspectorConfig.name.trim()
              : (dataSource?.name ?? "Select data source…")}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>

        {hasDataSource && canSelectColumn && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CornerDownRight
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={2}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <Combobox
                  size="sm"
                  triggerClassName="text-xs font-normal hover:border-action-hover"
                  options={[
                    { value: NULL_UUID, label: "None" },
                    {
                      value: MAX_COLUMN_KEY,
                      label: "Highest-value column (String)",
                    },
                    ...(dataSources
                      ?.find((ds) => ds.id === viewConfig.areaDataSourceId)
                      ?.columnDefs.map((col) => ({
                        value: col.name,
                        label: `${col.name} (${col.type})`,
                        hint: columnMetadata.find((m) => m.name === col.name)
                          ?.description,
                      })) || []),
                  ]}
                  value={viewConfig.areaDataColumn || NULL_UUID}
                  onValueChange={(value) => {
                    const col = value === NULL_UUID ? "" : value;
                    const primaryIsNumber =
                      Boolean(col) &&
                      dataSource?.columnDefs.find((c) => c.name === col)
                        ?.type === ColumnType.Number;
                    updateViewConfig({
                      areaDataColumn: col,
                      ...(col === viewConfig.areaDataSecondaryColumn
                        ? { areaDataSecondaryColumn: undefined }
                        : {}),
                      ...(!primaryIsNumber
                        ? { areaDataSecondaryColumn: undefined }
                        : {}),
                    });
                    if (!primaryIsNumber) {
                      setBivariatePickerOpen(false);
                    }
                  }}
                  placeholder="Column…"
                  searchPlaceholder="Search columns…"
                />
              </div>
              {viewConfig.areaDataColumn &&
                viewConfig.areaDataColumn !== NULL_UUID &&
                viewConfig.areaDataColumn !== MAX_COLUMN_KEY && (
                  <ColumnMetadataIcons
                    dataSourceId={dataSource?.id}
                    column={viewConfig.areaDataColumn}
                    fields={{
                      description: true,
                      valueLabels: true,
                      valueColors: colorScheme?.colorSchemeType === "categoric",
                    }}
                  />
                )}
            </div>

            {showSecondColumnRow && (
              <div className="flex items-center gap-2">
                <CornerDownRight
                  className="size-4 shrink-0 text-muted-foreground invisible"
                  strokeWidth={2}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <Combobox
                    size="sm"
                    triggerClassName="text-xs font-normal hover:border-action-hover"
                    options={secondaryColumnComboboxOptions}
                    value={viewConfig.areaDataSecondaryColumn || NULL_UUID}
                    onValueChange={(value) => {
                      updateViewConfig({
                        areaDataSecondaryColumn:
                          value === NULL_UUID ? undefined : value,
                      });
                      if (value === NULL_UUID) {
                        setBivariatePickerOpen(false);
                      }
                    }}
                    placeholder="Column 2…"
                    searchPlaceholder="Search columns…"
                  />
                </div>
                {viewConfig.areaDataSecondaryColumn && (
                  <ColumnMetadataIcons
                    dataSourceId={dataSource?.id}
                    column={viewConfig.areaDataSecondaryColumn}
                    fields={{ description: true, valueLabels: true }}
                  />
                )}
              </div>
            )}
            {canSelectSecondaryColumn && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline cursor-pointer text-left pl-6 hover:text-foreground transition-colors"
                onClick={toggleBivariatePicker}
              >
                {viewConfig.areaDataSecondaryColumn || bivariatePickerOpen
                  ? "Remove second column"
                  : "Add another column"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Colour bars */}
      {isLoading ? (
        <div className="flex items-center justify-center px-3 py-4">
          <LoaderPinwheel className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : isBivariate ? (
        <div className="px-3 pb-2">
          <BivariateLegend />
        </div>
      ) : hasColumn && colorScheme ? (
        <div className="flex px-3 pb-2">
          <LegendBars
            colorScheme={colorScheme}
            viewConfig={viewConfig}
            areaStats={areaStats}
            dataSource={dataSource}
          />
        </div>
      ) : null}

      {viewConfig.mapType !== MapType.Hex && (
        <div className="border-t border-neutral-100 px-3 py-3">
          <p className="text-xs text-muted-foreground font-mono font-medium uppercase  mb-1">
            Boundaries
          </p>
          <Select
            value={viewConfig.areaSetGroupCode || NULL_UUID}
            onValueChange={(value) =>
              updateViewConfig({
                areaSetGroupCode:
                  value === NULL_UUID ? null : (value as AreaSetGroupCode),
              })
            }
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-full text-xs font-normal shadow-xs hover:border-action-hover"
            >
              <SelectValue placeholder="Boundaries…">
                {viewConfig.areaSetGroupCode
                  ? AreaSetGroupCodeLabels[viewConfig.areaSetGroupCode]
                  : "No locality"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_UUID}>No locality</SelectItem>
              {getValidAreaSetGroupCodes(dataSource?.geocodingConfig).map(
                (code) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex flex-col">
                      <span>
                        {AreaSetGroupCodeLabels[code as AreaSetGroupCode]}
                      </span>
                      <span
                        className="text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html:
                            AreaSetGroupCodeYears[code as AreaSetGroupCode],
                        }}
                      />
                    </div>
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Data source modal */}
      <DataSourceSelectModal
        isModalOpen={isDataSourceModalOpen}
        setIsModalOpen={setIsDataSourceModalOpen}
        onSelect={handleDataSourceSelect}
      />

      {/* Invalid boundary dialog */}
      <Dialog
        open={Boolean(invalidDataSourceId)}
        onOpenChange={(o) => {
          if (!o) setInvalidDataSourceId(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Select new boundaries</DialogTitle>
          </DialogHeader>
          <p>
            The data source you have selected does not fit into your selected
            boundaries (
            {viewConfig.areaSetGroupCode
              ? AreaSetGroupCodeLabels[viewConfig.areaSetGroupCode]
              : "unknown"}
            ). Please select alternative boundaries, or cancel.
          </p>
          <Select
            onValueChange={(value) => {
              updateViewConfig({
                areaSetGroupCode: value as AreaSetGroupCode,
                areaDataSourceId: invalidDataSourceId || "",
              });
              setInvalidDataSourceId(null);
            }}
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Choose boundaries…" />
            </SelectTrigger>
            <SelectContent>
              {getValidAreaSetGroupCodes(
                getDataSourceById(invalidDataSourceId)?.geocodingConfig,
              ).map((code) => (
                <SelectItem key={code} value={code}>
                  {AreaSetGroupCodeLabels[code as AreaSetGroupCode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>
    </div>
  );
}
