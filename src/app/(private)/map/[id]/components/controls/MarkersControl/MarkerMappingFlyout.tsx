"use client";

import { X } from "lucide-react";
import { useMemo } from "react";
import ColorMappingsSection from "@/app/(private)/components/EditColumnMetadataModal/ColorMappingsSection";
import { useColumnMetadataMutations } from "@/app/(private)/hooks/useColumnMetadataMutations";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useColumnValues } from "@/hooks/useColumnValues";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
import { cn } from "@/shadcn/utils";
import { sortColumnValues } from "@/utils/sortColumnValues";
import { useDataSourceColumn } from "../../../hooks/useDataSourceColumn";
import { markerIconShapes } from "../../Markers/markerIcons";
import { formatCategoryValue } from "../../Markers/markerStyle";
import MarkerShapeIcon from "../../MarkerShapeIcon";

export type MarkerMappingKind = "icons" | "colors" | "order";

const TITLES: Record<MarkerMappingKind, string> = {
  icons: "Category icons",
  colors: "Category colours",
  order: "Value order",
};

/**
 * Floating card that flies out beside the marker settings panel, level with
 * the button that opened it, to edit a column's value mappings (icons,
 * colours or order) without covering the map.
 */
export default function MarkerMappingFlyout({
  kind,
  dataSourceId,
  column,
  positionLeft,
  positionTop,
  onClose,
}: {
  kind: MarkerMappingKind;
  dataSourceId: string;
  column: string;
  positionLeft: number;
  positionTop: number;
  onClose: () => void;
}) {
  const { getDataSourceById } = useDataSources();
  const organisationId = useOrganisationId();
  const { patchColumnMetadata, patchColumnMetadataOverride } =
    useColumnMetadataMutations();

  const dataSource = getDataSourceById(dataSourceId);
  const { columnMetadata: existingMeta, columnDef } = useDataSourceColumn(
    dataSourceId,
    column,
  );

  const isOwner = Boolean(
    organisationId &&
    dataSource &&
    dataSource.organisationId === organisationId,
  );
  const ownerMeta = useMemo(
    () => dataSource?.columnMetadata.find((m) => m.name === column),
    [dataSource, column],
  );

  const columnValues = useColumnValues({
    dataSourceId,
    column,
    columnType: columnDef?.type ?? ColumnType.Unknown,
    nullIsZero: dataSource?.nullIsZero,
    enabled: Boolean(dataSourceId && column),
  });

  // null = too many distinct values to map by hand
  const mergedValues = useMemo((): string[] | null | undefined => {
    if (columnValues === null || columnValues === undefined) {
      return columnValues;
    }
    return columnValues.length > 50 ? null : columnValues;
  }, [columnValues]);

  const setValueIcon = (value: string, shape: string | null) => {
    const next: Record<string, string> = {};
    for (const [v, s] of Object.entries(existingMeta?.valueIcons ?? {})) {
      if (v !== value) {
        next[v] = s;
      }
    }
    if (shape) {
      next[value] = shape;
    }
    const metadataPatch = { valueIcons: next };
    if (isOwner) {
      patchColumnMetadata({ dataSourceId, column, patch: metadataPatch });
    } else if (organisationId) {
      patchColumnMetadataOverride({
        organisationId,
        dataSourceId,
        column,
        patch: metadataPatch,
      });
    }
  };

  const sortedValues = sortColumnValues({
    values: mergedValues ?? [],
    columnMetadata: existingMeta,
  });

  return (
    <div
      className="absolute z-100 flex flex-col w-80 rounded-lg border border-neutral-200 bg-white shadow-lg"
      style={{
        left: positionLeft,
        top: positionTop,
        maxHeight: `calc(100% - ${positionTop + 8}px)`,
      }}
    >
      <div className="flex items-center justify-between gap-2 shrink-0 px-3 py-2 border-b border-neutral-200">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{TITLES[kind]}</h2>
          <p className="text-xs text-muted-foreground truncate">{column}</p>
        </div>
        <button
          type="button"
          aria-label={`Close ${TITLES[kind].toLowerCase()}`}
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="overflow-y-auto p-3">
        {kind === "icons" ? (
          mergedValues === null ? (
            <p className="text-xs text-muted-foreground">
              Too many values in this column to assign icons.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {sortedValues.map((value) => {
                const assigned = existingMeta?.valueIcons?.[value];
                return (
                  <div
                    key={value}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-xs truncate" title={value}>
                      {formatCategoryValue(value, existingMeta?.valueLabels)}
                    </span>
                    <span className="flex gap-0.5 shrink-0">
                      {markerIconShapes.map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          aria-label={`${shape} icon for ${value}`}
                          className={cn(
                            "p-1 rounded cursor-pointer hover:bg-neutral-200",
                            assigned === shape &&
                              "bg-neutral-800 text-white hover:bg-neutral-700",
                          )}
                          onClick={() =>
                            setValueIcon(
                              value,
                              assigned === shape ? null : shape,
                            )
                          }
                        >
                          <MarkerShapeIcon shape={shape} />
                        </button>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <ColorMappingsSection
            dataSourceId={dataSourceId}
            columnName={column}
            mergedValues={mergedValues}
            existingMeta={existingMeta}
            ownerMeta={ownerMeta}
            isOwner={isOwner}
            organisationId={organisationId}
            hideColors={kind === "order"}
            hideLabel
          />
        )}
      </div>
    </div>
  );
}
