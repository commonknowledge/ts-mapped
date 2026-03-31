"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useColumnMetadataMutations } from "@/app/(private)/hooks/useColumnMetadataMutations";
import { getCategoryColorsKey } from "@/app/(private)/map/[id]/colors";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import ColorMappingsEditor from "@/components/ColorMappingsEditor";
import type { ColumnMetadata } from "@/models/DataSource";

interface ColorMappingsSectionProps {
  dataSourceId: string | undefined;
  columnName: string;
  mergedValues: string[] | null | undefined;
  existingMeta: ColumnMetadata | undefined;
  ownerMeta: ColumnMetadata | undefined;
  isOwner: boolean;
  organisationId: string | null | undefined;
}

export default function ColorMappingsSection({
  dataSourceId,
  columnName,
  mergedValues,
  existingMeta,
  ownerMeta,
  isOwner,
  organisationId,
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
      <label className="text-sm font-medium">Colour mappings</label>
      <div className="rounded-md border">
        <ColorMappingsEditor
          values={mergedValues}
          colorMappings={mapViewColorMappings}
          fallbackColors={existingMeta?.valueColors}
          onChange={handleColorChangeDebounced}
          onReset={handleResetColor}
          onResetAll={handleResetAllColors}
          onSaveAsDefaults={handleSaveAsDefaults}
          onUseSourceColors={
            hasSourceColors ? handleUseSourceColors : undefined
          }
        />
      </div>
    </div>
  );
}
