import {
  ChevronDown,
  CornerDownRight,
  Database,
  LoaderPinwheel,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useChoroplethDataSource,
  useDataSources,
} from "@/app/(private)/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import { AreaSetGroupCodeLabels, AreaSetGroupCodeYears } from "@/labels";
import { ColumnType } from "@/models/DataSource";
import { CalculationType, ColorScaleType } from "@/models/MapView";
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
import { resolveColumnMetadataEntry } from "@/utils/resolveColumnMetadata";
import { formatNumber } from "@/utils/text";
import { calculateStepColor, useColorScheme } from "../colors";
import { useAreaStats } from "../data";
import BivariateLegend from "./BivariateLagend";
import { getValidAreaSetGroupCodes } from "./Choropleth/areas";
import { getChoroplethDataKey } from "./Choropleth/utils";
import ColumnMetadataIcons from "./ColumnMetadataIcons";
import { DataSourceSelectModal } from "./DataSourceSelectButton";
import type { NumericColorScheme } from "../colors";
import type { AreaSetGroupCode } from "@/models/AreaSet";

export default function Legend() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();
  const { data: dataSources, getDataSourceById } = useDataSources();

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
        hint: resolveColumnMetadataEntry(
          dataSource?.columnMetadata || [],
          dataSource?.columnMetadataOverride,
          col.name,
        )?.description,
      })) || []),
  ];

  const handleDataSourceSelect = (dataSourceId: string) => {
    const selectedAreaSetGroup = viewConfig.areaSetGroupCode;
    if (!selectedAreaSetGroup) {
      updateViewConfig({
        areaDataSourceId: dataSourceId,
        areaDataSecondaryColumn: undefined,
      });
      setIsDataSourceModalOpen(false);
      return;
    }
    const ds = getDataSourceById(dataSourceId);
    const validAreaSetGroups = getValidAreaSetGroupCodes(ds?.geocodingConfig);
    if (validAreaSetGroups.includes(selectedAreaSetGroup)) {
      updateViewConfig({
        areaDataSourceId: dataSourceId,
        areaDataSecondaryColumn: undefined,
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

  const makeBars = () => {
    if (!colorScheme) return null;

    if (colorScheme.colorSchemeType === "numeric") {
      // Handle stepped colors
      const steppedColorSteps =
        viewConfig.steppedColorStepsByKey?.[getChoroplethDataKey(viewConfig)];
      if (
        viewConfig.colorScaleType === ColorScaleType.Stepped &&
        steppedColorSteps &&
        steppedColorSteps.length > 0
      ) {
        return makeSteppedBars(colorScheme, steppedColorSteps);
      }

      // Handle gradient colors (default)
      return makeGradientBars(colorScheme);
    } else {
      // Filter to only show categories that actually appear in the data
      const categoriesInData = new Set(
        areaStats?.stats
          .map((stat) => String(stat.primary))
          .filter((v) => v && v !== "null" && v !== "undefined"),
      );

      const valueLabels =
        resolveColumnMetadataEntry(
          dataSource?.columnMetadata ?? [],
          dataSource?.columnMetadataOverride,
          viewConfig.areaDataColumn,
        )?.valueLabels || {};

      return (
        <div className="flex max-h-[min(35vh,14rem)] min-h-0 w-full flex-col gap-1.5 overflow-y-auto py-1 pr-0.5">
          {Object.keys(colorScheme.colorMap)
            .filter((key) => categoriesInData.has(key))
            .toSorted((a, b) => {
              if (areaStats?.primary?.columnType === ColumnType.Number) {
                return Number(a) < Number(b) ? -1 : 1;
              }
              return a < b ? -1 : 1;
            })
            .map((key) => {
              let label = valueLabels[key];
              if (
                !label &&
                areaStats?.primary?.columnType === ColumnType.Number &&
                Number(key) === 0
              ) {
                label = valueLabels[""];
              }
              return (
                <div className="flex items-center gap-2 text-xs" key={key}>
                  <div
                    className="w-3 h-3 flex-shrink-0 border border-neutral-300"
                    style={{ backgroundColor: colorScheme.colorMap[key] }}
                  />
                  <span>{label || key}</span>
                </div>
              );
            })}
        </div>
      );
    }
  };

  const makeSteppedBars = (
    colorScheme: NumericColorScheme,
    steppedColorSteps: { start: number; end: number }[],
  ) => {
    const sortedSteps = [...steppedColorSteps].sort(
      (a, b) => a.start - b.start,
    );
    const range = colorScheme.maxValue - colorScheme.minValue;

    // Collect all unique boundary positions
    const boundaries = new Set<number>();
    boundaries.add(colorScheme.minValue);
    sortedSteps.forEach((step) => {
      boundaries.add(step.start);
      boundaries.add(step.end);
    });
    boundaries.add(colorScheme.maxValue);
    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

    return (
      <div className="w-full">
        <div className="flex w-full h-4 border border-neutral-200 overflow-hidden rounded">
          {sortedSteps.map((step, index) => {
            const stepStart = Math.max(step.start, colorScheme.minValue);
            const stepEnd =
              index < sortedSteps.length - 1
                ? sortedSteps[index + 1].start
                : Math.min(step.end, colorScheme.maxValue);
            const width =
              range > 0
                ? ((stepEnd - stepStart) / range) * 100
                : 100 / sortedSteps.length;
            return (
              <div
                key={index}
                className="h-full border-r border-neutral-400 last:border-r-0"
                style={{
                  width: `${width}%`,
                  backgroundColor: calculateStepColor(
                    index,
                    sortedSteps.length,
                    viewConfig,
                  ),
                }}
              />
            );
          })}
        </div>
        <div className="relative mt-1 h-6">
          {sortedBoundaries.map((boundary, index) => {
            const isFirst = index === 0;
            const isLast = index === sortedBoundaries.length - 1;
            const position =
              range > 0
                ? ((boundary - colorScheme.minValue) / range) * 100
                : (index / (sortedBoundaries.length - 1)) * 100;

            return (
              <div
                key={index}
                className="absolute flex flex-col"
                style={{
                  left: `${position}%`,
                  transform: isFirst
                    ? "translateX(0%)"
                    : isLast
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
                  alignItems: isFirst
                    ? "flex-start"
                    : isLast
                      ? "flex-end"
                      : "center",
                }}
              >
                <div className="text-[10px] text-neutral-500 mt-0.5 font-mono whitespace-nowrap">
                  {formatNumber(boundary)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const makeGradientBars = (colorScheme: NumericColorScheme) => {
    const numStops = 24;
    const stops = new Array(numStops + 1)
      .fill(null)
      .map((_, i) => {
        const t = i / numStops;
        const value =
          colorScheme.minValue +
          t * (colorScheme.maxValue - colorScheme.minValue);
        const color = colorScheme.colorScale(value);
        return `${color} ${t * 100}%`;
      })
      .join(", ");

    let numTicks = 5 as number; // number of numeric step labels
    let denom = Math.max(numTicks - 1, 1);
    let values = Array.from({ length: numTicks }).map((_, i) => {
      const t = i / denom;
      return (
        colorScheme.minValue + t * (colorScheme.maxValue - colorScheme.minValue)
      );
    });

    const valueLabels =
      resolveColumnMetadataEntry(
        dataSource?.columnMetadata ?? [],
        dataSource?.columnMetadataOverride,
        viewConfig.areaDataColumn,
      )?.valueLabels || {};

    const hasValueLabels = Object.keys(valueLabels).length > 0;

    if (hasValueLabels) {
      const numericKeys = Object.keys(valueLabels)
        .filter((key) => key !== "")
        .map((key) => Number(key))
        .filter(
          (v) =>
            Number.isFinite(v) &&
            v >= colorScheme.minValue &&
            v <= colorScheme.maxValue,
        )
        .toSorted((a, b) => a - b);
      if (numericKeys.length) {
        values = numericKeys;
        numTicks = values.length;
        denom = Math.max(numTicks - 1, 1);
      }
    }

    return (
      <div className="w-full">
        <div
          className="w-full h-4 border border-neutral-200"
          style={{ background: `linear-gradient(to right, ${stops})` }}
        />
        <div className={cn("relative mt-1", hasValueLabels ? "h-10" : "h-6")}>
          {Array.from({ length: numTicks }).map((_, i) => {
            const t = i / denom;
            const value = values[i];
            const positionStyle =
              i === 0
                ? {
                  left: 0,
                  transform: "translateX(0%)",
                  width: `${100 / (denom + 1)}%`,
                }
                : i === numTicks - 1
                  ? {
                    left: "100%",
                    transform: "translateX(-100%)",
                    width: `${100 / (denom + 1)}%`,
                  }
                  : {
                    left: `${t * 100}%`,
                    transform: "translateX(-50%)",
                    width: `${100 / (denom + 1)}%`,
                  };
            const alignClass =
              i === 0
                ? "items-start"
                : i === numTicks - 1
                  ? "items-end text-right"
                  : "items-center text-center";
            return (
              <div
                key={i}
                className={`absolute flex flex-col ${alignClass}`}
                style={positionStyle}
              >
                <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                  {(() => {
                    if (hasValueLabels) {
                      if (value) {
                        return valueLabels[String(value)];
                      } else {
                        // Handle empty values
                        return valueLabels[String(value)] || valueLabels[""];
                      }
                    }
                    const isPercent =
                      colorScheme.minValue >= 0 && colorScheme.maxValue <= 1;
                    return isPercent
                      ? `${Math.round(value * 100)}%`
                      : formatNumber(value);
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
          <Database
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-left">
            {dataSource?.name ?? "Select data source…"}
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
                        hint: resolveColumnMetadataEntry(
                          dataSource?.columnMetadata || [],
                          dataSource?.columnMetadataOverride,
                          col.name,
                        )?.description,
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
                    dataSource={dataSource}
                    column={viewConfig.areaDataColumn}
                    fields={{
                      description: true,
                      valueLabels: true,
                      categoryColors:
                        colorScheme?.colorSchemeType === "categoric",
                    }}
                  />
                )}
            </div>

            {canSelectSecondaryColumn && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline cursor-pointer text-left pl-6 hover:text-foreground transition-colors"
                onClick={toggleBivariatePicker}
              >
                {viewConfig.areaDataSecondaryColumn || bivariatePickerOpen
                  ? "Remove second column"
                  : "Add another column "}
              </button>
            )}

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
                    dataSource={dataSource}
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
        <div className="px-3 pb-2">
          <BivariateLegend />
        </div>
      ) : hasColumn && colorScheme ? (
        <div className="flex px-3 pb-2">{makeBars()}</div>
      ) : null}

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
                        __html: AreaSetGroupCodeYears[code as AreaSetGroupCode],
                      }}
                    />
                  </div>
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
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
