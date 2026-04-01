import { ChevronDown, CornerDownRight, LoaderPinwheel } from "lucide-react";
import { useEffect, useState } from "react";
import { InspectorPanelIcon } from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import { useDataSourceColumns } from "@/app/(private)/map/[id]/hooks/useDataSourceColumn";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import DataSourceIcon from "@/components/DataSourceIcon";
import { DUMMY_COUNT_COLUMN, MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import {
  useChoroplethDataSource,
  useDataSources,
} from "@/hooks/useDataSources";
import {
  AreaSetCodeLabels,
  AreaSetCodeYears,
  AreaSetGroupCodeLabels,
  AreaSetGroupCodeYears,
} from "@/labels";
import { ColumnType } from "@/models/DataSource";
import { MapType } from "@/models/MapView";
import { CalculationType } from "@/models/shared";
import { Combobox } from "@/shadcn/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
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
import {
  dataRecordsWillAggregate,
  getValidAreaSetGroupCodes,
} from "../Choropleth/areas";
import {
  CHOROPLETH_AREA_SET_CODES,
  getDefaultAreaSetGroupCode,
} from "../Choropleth/configs";
import ColumnMetadataIcons from "../ColumnMetadataIcons";
import { IncludeColumnsModal } from "../controls/VisualisationPanel/IncludeColumnsModal";
import { DataSourceSelectModal } from "../DataSourceSelectButton";
import { mapColourPalette, mapColors } from "../../styles";
import { LegendBars } from "./LegendBars";
import type { AreaSetCode, AreaSetGroupCode } from "@/models/AreaSet";

export default function Legend({
  onClearRequest,
}: {
  onClearRequest?: () => void;
}) {
  const { viewConfig, updateViewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();
  const { data: dataSources, getDataSourceById } = useDataSources();
  const { columnMetadata } = useDataSourceColumns(dataSource?.id);

  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [invalidDataSourceId, setInvalidDataSourceId] = useState<string | null>(
    null,
  );
  const [bivariatePickerOpen, setBivariatePickerOpen] = useState(false);
  const [secondaryBoundariesOpen, setSecondaryBoundariesOpen] = useState(
    Boolean(viewConfig.secondaryAreaSetCode),
  );

  useEffect(() => {
    if (viewConfig.secondaryAreaSetCode) {
      setSecondaryBoundariesOpen(true);
    }
  }, [viewConfig.secondaryAreaSetCode]);

  const secondaryBoundaryStrokeColor =
    viewConfig.secondaryBoundaryStrokeColor || "#555";
  const secondaryBoundarySwatches = mapColourPalette.map((c) => c.color);

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;
  const isLoading = areaStatsQuery?.isFetching;

  const colorScheme = useColorScheme({
    areaStats,
    viewConfig,
  });

  const hasDataSource = Boolean(viewConfig.areaDataSourceId);
  const hasColumn = Boolean(viewConfig.areaDataColumn);
  const isBivariate =
    viewConfig.areaDataColumn !== DUMMY_COUNT_COLUMN &&
    viewConfig.areaDataColumn &&
    viewConfig.areaDataSecondaryColumn;

  const isCount = viewConfig.areaDataColumn === DUMMY_COUNT_COLUMN;

  const columnOneIsNumber =
    Boolean(viewConfig.areaDataColumn) &&
    dataSource?.columnDefs.find((c) => c.name === viewConfig.areaDataColumn)
      ?.type === ColumnType.Number;
  const canSelectSecondaryColumn =
    !isCount && Boolean(viewConfig.areaDataColumn) && columnOneIsNumber;
  const canSelectAggregation =
    !isCount &&
    columnOneIsNumber &&
    dataRecordsWillAggregate(
      dataSource?.geocodingConfig,
      viewConfig.areaSetGroupCode,
    );

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
      const areaSetCode =
        ds?.geocodingConfig && "areaSetCode" in ds.geocodingConfig
          ? ds.geocodingConfig.areaSetCode
          : null;
      const defaultAreaSetGroupCode = areaSetCode
        ? getDefaultAreaSetGroupCode(areaSetCode)
        : null;
      updateViewConfig({
        areaDataSourceId: dataSourceId,
        areaDataSecondaryColumn: undefined,
        ...(ds?.public && ds.defaultChoroplethConfig
          ? {
            calculationType: ds.defaultChoroplethConfig.calculationType,
            areaDataColumn: ds.defaultChoroplethConfig.column,
          }
          : {}),
        ...(defaultAreaSetGroupCode && !viewConfig.areaSetGroupCode
          ? { areaSetGroupCode: defaultAreaSetGroupCode }
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

        {hasDataSource && (
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
                    { value: DUMMY_COUNT_COLUMN, label: "Count" },
                    {
                      value: MAX_COLUMN_KEY,
                      label: "Highest value column (String)",
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
                  value={
                    isCount
                      ? DUMMY_COUNT_COLUMN
                      : viewConfig.areaDataColumn || NULL_UUID
                  }
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
                viewConfig.areaDataColumn !== NULL_UUID && (
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
          </div>
        )}
      </div>

      {/* Colour bars */}
      {isLoading ? (
        <div className="flex items-center justify-center px-3 py-4">
          <LoaderPinwheel className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : isBivariate ? (
        <div className="px-3">
          <BivariateLegend />
        </div>
      ) : hasColumn && colorScheme ? (
        <div className="flex px-3">
          <LegendBars
            colorScheme={colorScheme}
            viewConfig={viewConfig}
            areaStats={areaStats}
            dataSource={dataSource}
          />
        </div>
      ) : null}

      {(canSelectSecondaryColumn || (hasDataSource && onClearRequest)) && (
        <div className=" px-3 pb-2">
          <div className="flex items-center justify-between gap-3">
            {hasDataSource && onClearRequest ? (
              <button
                type="button"
                className="text-xs text-muted-foreground underline cursor-pointer text-left hover:text-foreground transition-colors"
                onClick={onClearRequest}
              >
                Clear
              </button>
            ) : (
              <span />
            )}
            {canSelectSecondaryColumn && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline cursor-pointer text-left hover:text-foreground transition-colors"
                onClick={toggleBivariatePicker}
              >
                {viewConfig.areaDataSecondaryColumn || bivariatePickerOpen
                  ? "Remove second column"
                  : "Add another column"}
              </button>
            )}
          </div>
        </div>
      )}

      {viewConfig.areaDataColumn === MAX_COLUMN_KEY && dataSource && (
        <div className="border-t border-neutral-100 px-3 py-3">
          <IncludeColumnsModal
            dataSource={dataSource}
            selectedColumns={
              viewConfig.includeColumnsString
                ? viewConfig.includeColumnsString
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean)
                : []
            }
            onColumnsChange={(columns) => {
              updateViewConfig({
                includeColumnsString:
                  columns.length > 0 ? columns.join(",") : undefined,
              });
            }}
          />
        </div>
      )}

      {viewConfig.mapType !== MapType.Hex && (
        <div className="border-t border-neutral-100 px-3 py-3">
          <p className="text-xs text-muted-foreground font-mono font-medium uppercase mb-1">
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

      {/* Aggregation */}
      {canSelectAggregation && (
        <div className="border-b border-neutral-100 px-3 pb-3">
          <p className="text-xs text-muted-foreground font-mono font-medium uppercase mb-1">
            Aggregation
          </p>
          <Select
            value={viewConfig.calculationType}
            onValueChange={(value) =>
              updateViewConfig({
                calculationType: value as CalculationType,
              })
            }
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-full text-xs font-normal shadow-xs hover:border-action-hover"
            >
              <SelectValue placeholder="Choose an aggregation…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CalculationType.Avg}>Average</SelectItem>
              <SelectItem value={CalculationType.Mode}>Most common</SelectItem>
              <SelectItem value={CalculationType.Sum}>Sum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Secondary boundaries */}
      {viewConfig.mapType !== MapType.Hex && (
        <div className=" border-neutral-100 px-3 py-2">
          {!secondaryBoundariesOpen && !viewConfig.secondaryAreaSetCode ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline cursor-pointer text-left hover:text-foreground transition-colors"
              onClick={() => setSecondaryBoundariesOpen(true)}
            >
              Add secondary boundaries
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs text-muted-foreground font-mono font-medium uppercase">
                Secondary boundaries
              </p>
              <button
                type="button"
                className="text-xs text-muted-foreground underline cursor-pointer text-left hover:text-foreground transition-colors"
                onClick={() => {
                  updateViewConfig({ secondaryAreaSetCode: null });
                  setSecondaryBoundariesOpen(false);
                }}
              >
                Remove
              </button>
            </div>
          )}
          {(secondaryBoundariesOpen || viewConfig.secondaryAreaSetCode) && (
            <div className="flex items-center gap-2">
              <Select
                value={viewConfig.secondaryAreaSetCode || NULL_UUID}
                onValueChange={(value) => {
                  const nextValue =
                    value === NULL_UUID ? null : (value as AreaSetCode);
                  updateViewConfig({ secondaryAreaSetCode: nextValue });
                  if (!nextValue) {
                    setSecondaryBoundariesOpen(false);
                  }
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="h-8 w-full text-xs font-normal shadow-xs hover:border-action-hover"
                >
                  <SelectValue placeholder="Secondary boundaries…">
                    {viewConfig.secondaryAreaSetCode
                      ? AreaSetCodeLabels[viewConfig.secondaryAreaSetCode]
                      : "No secondary boundaries"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULL_UUID}>
                    No secondary boundaries
                  </SelectItem>
                  {CHOROPLETH_AREA_SET_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex flex-col">
                        <span>{AreaSetCodeLabels[code]}</span>
                        <span
                          className="text-xs text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: AreaSetCodeYears[code],
                          }}
                        />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-lg border border-input shadow-xs flex items-center justify-center",
                      "hover:border-action-hover transition-colors",
                      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    )}
                    aria-label="Secondary boundary stroke colour"
                    title="Secondary boundary stroke colour"
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/15"
                      style={{ backgroundColor: secondaryBoundaryStrokeColor }}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-3">
                  <p className="text-xs font-medium mb-2">
                    Stroke colour
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {secondaryBoundarySwatches.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={cn(
                          "h-7 w-7 rounded-full border border-black/10",
                          "hover:scale-[1.02] transition-transform",
                          c === secondaryBoundaryStrokeColor &&
                          "ring-2 ring-ring ring-offset-2 ring-offset-background",
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() =>
                          updateViewConfig({ secondaryBoundaryStrokeColor: c })
                        }
                        aria-label={`Set stroke colour to ${c}`}
                      />
                    ))}
                    <label className="h-7 w-7 rounded-full border border-black/10 relative overflow-hidden cursor-pointer">
                      <input
                        type="color"
                        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                        value={secondaryBoundaryStrokeColor}
                        onChange={(e) =>
                          updateViewConfig({
                            secondaryBoundaryStrokeColor: e.target.value,
                          })
                        }
                        aria-label="Custom stroke colour"
                      />
                      <span
                        className="absolute inset-0"
                        style={{ backgroundColor: secondaryBoundaryStrokeColor }}
                        aria-hidden
                      />
                    </label>
                  </div>
                  {viewConfig.secondaryBoundaryStrokeColor && (
                    <button
                      type="button"
                      className="mt-3 text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                      onClick={() =>
                        updateViewConfig({
                          secondaryBoundaryStrokeColor: null,
                        })
                      }
                    >
                      Reset to default
                    </button>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}
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
