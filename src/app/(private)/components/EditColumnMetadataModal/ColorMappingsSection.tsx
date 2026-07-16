"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useColumnMetadataMutations } from "@/app/(private)/hooks/useColumnMetadataMutations";
import { getCategoryColorsKey } from "@/app/(private)/map/[id]/colors";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import ColorMappingsEditor, {
  VALUE_ORDER_HINT,
} from "@/components/ColorMappingsEditor";
import { sortColumnValues } from "@/utils/sortColumnValues";
import type { ColumnMetadata } from "@/models/DataSource";

interface ColorMappingsSectionProps {
  dataSourceId: string | undefined;
  columnName: string;
  mergedValues: string[] | null | undefined;
  existingMeta: ColumnMetadata | undefined;
  ownerMeta: ColumnMetadata | undefined;
  isOwner: boolean;
  organisationId: string | null | undefined;
  /** Order-only mode: just the drag-reorderable value list, no colour UI */
  hideColors?: boolean;
}

export default function ColorMappingsSection({
  dataSourceId,
  columnName,
  mergedValues,
  existingMeta,
  ownerMeta,
  isOwner,
  organisationId,
  hideColors = false,
}: ColorMappingsSectionProps) {
  const { viewConfig, updateViewConfig } = useMapViews();
  const { patchColumnMetadata, patchColumnMetadataOverride } =
    useColumnMetadataMutations();

  const debounceTimers = useRef<Record<string, NodeJS.Timeout | null>>({});

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const mapViewColorMappings = useMemo(() => {
    if (!viewConfig.colorMappings || !dataSourceId) return {};
    const result: Record<string, string> = {};
    for (const value of mergedValues ?? []) {
      const key = getCategoryColorsKey(dataSourceId, columnName, value);
      if (viewConfig.colorMappings[key]) {
        result[value] = viewConfig.colorMappings[key];
      }
    }
    return result;
  }, [viewConfig.colorMappings, dataSourceId, columnName, mergedValues]);

  const handleColorChange = useCallback(
    (value: string, color: string) => {
      const key = getCategoryColorsKey(dataSourceId, columnName, value);
      const currentColors = viewConfig.colorMappings || {};
      updateViewConfig({
        colorMappings: { ...currentColors, [key]: color },
      });
    },
    [dataSourceId, columnName, viewConfig.colorMappings, updateViewConfig],
  );

  // Preset application: write all values' colours in one view-config update
  const handleBulkColorChange = useCallback(
    (mappings: Record<string, string>) => {
      const nextColors = { ...(viewConfig.colorMappings || {}) };
      for (const [value, color] of Object.entries(mappings)) {
        nextColors[getCategoryColorsKey(dataSourceId, columnName, value)] =
          color;
      }
      updateViewConfig({ colorMappings: nextColors });
    },
    [dataSourceId, columnName, viewConfig.colorMappings, updateViewConfig],
  );

  const handleColorChangeDebounced = useCallback(
    (value: string, color: string) => {
      if (debounceTimers.current[value]) {
        clearTimeout(debounceTimers.current[value]);
      }
      debounceTimers.current[value] = setTimeout(() => {
        handleColorChange(value, color);
        debounceTimers.current[value] = null;
      }, 300);
    },
    [handleColorChange],
  );

  const clearMapViewColors = useCallback(() => {
    if (!viewConfig.colorMappings || !dataSourceId) return;
    const columnPrefix = getCategoryColorsKey(dataSourceId, columnName, "");
    const nextColors = Object.fromEntries(
      Object.entries(viewConfig.colorMappings).filter(
        ([k]) => !k.startsWith(columnPrefix),
      ),
    );
    updateViewConfig({
      colorMappings:
        Object.keys(nextColors).length > 0 ? nextColors : undefined,
    });
  }, [dataSourceId, columnName, viewConfig.colorMappings, updateViewConfig]);

  const handleResetColor = useCallback(
    (value: string) => {
      if (debounceTimers.current[value]) {
        clearTimeout(debounceTimers.current[value]);
        debounceTimers.current[value] = null;
      }
      const key = getCategoryColorsKey(dataSourceId, columnName, value);
      const currentColors = viewConfig.colorMappings || {};
      const nextColors = Object.fromEntries(
        Object.entries(currentColors).filter(([k]) => k !== key),
      );
      updateViewConfig({
        colorMappings:
          Object.keys(nextColors).length > 0 ? nextColors : undefined,
      });
    },
    [dataSourceId, columnName, viewConfig.colorMappings, updateViewConfig],
  );

  const handleResetAllColors = useCallback(() => {
    clearMapViewColors();
  }, [clearMapViewColors]);

  const hasSourceColors =
    !isOwner &&
    Boolean(dataSourceId) &&
    Object.keys(ownerMeta?.valueColors ?? {}).length > 0;

  const handleUseSourceColors = useCallback(() => {
    if (!dataSourceId) return;
    const sourceColors = ownerMeta?.valueColors ?? {};
    const columnPrefix = getCategoryColorsKey(dataSourceId, columnName, "");
    // Remove existing map-view overrides for this column, then apply source colors
    const withoutThisColumn = Object.fromEntries(
      Object.entries(viewConfig.colorMappings ?? {}).filter(
        ([k]) => !k.startsWith(columnPrefix),
      ),
    );
    const newKeys: Record<string, string> = {};
    for (const [value, color] of Object.entries(sourceColors)) {
      newKeys[getCategoryColorsKey(dataSourceId, columnName, value)] = color;
    }
    const nextColors = { ...withoutThisColumn, ...newKeys };
    updateViewConfig({
      colorMappings:
        Object.keys(nextColors).length > 0 ? nextColors : undefined,
    });
  }, [
    dataSourceId,
    columnName,
    ownerMeta,
    viewConfig.colorMappings,
    updateViewConfig,
  ]);

  // Rows display in the canonical value order; dragging persists a new
  // valueOrder, which also controls marker draw order (later = on top),
  // legend order and default colour assignment
  const orderedValues = useMemo(() => {
    if (mergedValues === null || mergedValues === undefined) {
      return mergedValues;
    }
    return sortColumnValues({
      values: mergedValues,
      columnMetadata: existingMeta,
    });
  }, [mergedValues, existingMeta]);

  const handleReorder = useCallback(
    (ordered: string[]) => {
      if (!dataSourceId) return;
      const patch = { valueOrder: ordered };
      if (isOwner) {
        patchColumnMetadata({ dataSourceId, column: columnName, patch });
      } else if (organisationId) {
        patchColumnMetadataOverride({
          organisationId,
          dataSourceId,
          column: columnName,
          patch,
        });
      }
    },
    [
      dataSourceId,
      columnName,
      isOwner,
      organisationId,
      patchColumnMetadata,
      patchColumnMetadataOverride,
    ],
  );

  const handleSaveAsDefaults = useCallback(() => {
    if (!dataSourceId) return;
    const mergedColorMappings = {
      ...(existingMeta?.valueColors ?? {}),
      ...mapViewColorMappings,
    };
    if (isOwner) {
      patchColumnMetadata({
        dataSourceId,
        column: columnName,
        patch: { valueColors: mergedColorMappings },
      });
    } else if (organisationId) {
      patchColumnMetadataOverride({
        organisationId,
        dataSourceId,
        column: columnName,
        patch: { valueColors: mergedColorMappings },
      });
    }
    clearMapViewColors();
  }, [
    dataSourceId,
    columnName,
    existingMeta,
    mapViewColorMappings,
    isOwner,
    organisationId,
    patchColumnMetadata,
    patchColumnMetadataOverride,
    clearMapViewColors,
  ]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {hideColors ? "Value order" : "Colour mappings"}
      </label>
      <div className="rounded-md border">
        <ColorMappingsEditor
          hideColors={hideColors}
          values={orderedValues}
          colorMappings={mapViewColorMappings}
          fallbackColors={existingMeta?.valueColors}
          onChange={handleColorChangeDebounced}
          onReset={handleResetColor}
          onResetAll={handleResetAllColors}
          onSaveAsDefaults={handleSaveAsDefaults}
          onUseSourceColors={
            hasSourceColors ? handleUseSourceColors : undefined
          }
          onBulkChange={handleBulkColorChange}
          onReorder={handleReorder}
          reorderHint={VALUE_ORDER_HINT}
        />
      </div>
    </div>
  );
}
