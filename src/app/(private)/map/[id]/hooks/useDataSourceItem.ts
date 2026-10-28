"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDataSourceListCache } from "@/app/(private)/hooks/useDataSourceListCache";
import { useDataSources } from "@/hooks/useDataSources";
import { useTRPC } from "@/services/trpc/react";
import { LayerType } from "@/types";
import { mapColors } from "../styles";
import { useDataRecords } from "./useDataRecords";
import { useLayers } from "./useLayers";
import { useMapConfig } from "./useMapConfig";
import { useMapViews } from "./useMapViews";
import { useMarkerSettings } from "./useMarkerSettings";
import type { DataSourceType } from "@/models/DataSource";

export interface DataSourceItemSource {
  id: string;
  name: string;
  config: { type: DataSourceType };
  recordCount?: number;
  createdAt?: Date;
}

/**
 * State and actions for a marker data source row in the layers panel:
 * visibility, colour, filtered record count, rename, marker settings and
 * removal. Shared by the classic and light editor rows.
 */
export function useDataSourceItem({
  dataSource,
  layerType,
}: {
  dataSource: DataSourceItemSource;
  layerType: LayerType;
}) {
  const { setDataSourceVisibility, getDataSourceVisibility } = useLayers();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { view, viewConfig } = useMapViews();
  const trpc = useTRPC();
  const { invalidateAll: invalidateDataSources } = useDataSourceListCache();
  const { getDataSourceById } = useDataSources();
  const { markerSettingsDataSourceId, setMarkerSettingsDataSourceId } =
    useMarkerSettings();

  const fullDataSource = getDataSourceById(dataSource.id);

  const dataSourceView = useMemo(
    () =>
      view?.dataSourceViews.find((dsv) => dsv.dataSourceId === dataSource.id),
    [dataSource.id, view?.dataSourceViews],
  );

  const hasActiveFilter =
    (dataSourceView?.filter?.children?.length ?? 0) > 0 ||
    Boolean(dataSourceView?.search);

  const { data: dataRecordsResult, isFetching: matchedCountLoading } =
    useDataRecords(hasActiveFilter ? dataSource.id : "", 0);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(dataSource.name);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusing = useRef(false);

  const layerColor =
    layerType === LayerType.Member
      ? mapColors.member.color
      : mapColors.markers.color;

  const isVisible = getDataSourceVisibility(dataSource?.id);

  // Get current color: view override, then data source default, then layer color
  const currentColor =
    viewConfig.markerColors?.[dataSource.id] ??
    fullDataSource?.defaultMarkerColor ??
    layerColor;

  // Focus management for rename input
  useEffect(() => {
    if (isRenaming) {
      isFocusing.current = true;
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
      setTimeout(() => {
        isFocusing.current = false;
      }, 500);
    }
  }, [isRenaming]);

  // Update editName when dataSource.name changes
  useEffect(() => {
    setEditName(dataSource.name);
  }, [dataSource.name]);

  // Update name mutation
  const { mutate: updateName } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: () => {
        void invalidateDataSources();
        toast.success("Data source renamed successfully");
        setIsRenaming(false);
      },
      onError: () => {
        toast.error("Failed to rename data source");
        setEditName(dataSource.name); // Reset on error
      },
    }),
  );

  const handleSaveRename = () => {
    if (editName.trim() && editName !== dataSource.name) {
      updateName({
        dataSourceId: dataSource.id,
        name: editName.trim(),
      });
    } else {
      setEditName(dataSource.name);
      setIsRenaming(false);
    }
  };

  const handleCancelRename = () => {
    setEditName(dataSource.name);
    setIsRenaming(false);
  };

  // Blur fires while the context menu hands focus to the input; ignore it then
  const handleRenameBlur = () => {
    if (!isFocusing.current) {
      handleSaveRename();
    }
  };

  const handleRemoveFromMap = () => {
    if (layerType === LayerType.Member) {
      // Remove members data source
      updateMapConfig({ membersDataSourceId: null });
      toast.success("Data source removed from map");
    } else if (layerType === LayerType.Marker) {
      // Remove from marker data sources array
      updateMapConfig({
        markerDataSourceIds: mapConfig.markerDataSourceIds.filter(
          (id) => id !== dataSource.id,
        ),
      });
      toast.success("Data source removed from map");
    }
    // Don't leave the settings panel editing a source that left the map
    if (markerSettingsDataSourceId === dataSource.id) {
      setMarkerSettingsDataSourceId(null);
    }
    setShowRemoveDialog(false);
  };

  const toggleVisibility = () =>
    setDataSourceVisibility(dataSource.id, !isVisible);

  const isSettingsOpen = markerSettingsDataSourceId === dataSource.id;

  const toggleSettings = () =>
    setMarkerSettingsDataSourceId(isSettingsOpen ? null : dataSource.id);

  const openSettings = () => setMarkerSettingsDataSourceId(dataSource.id);

  const matchedRecordCount =
    dataRecordsResult?.count?.matched ?? dataSource.recordCount;

  return {
    isVisible,
    toggleVisibility,
    currentColor,
    isSettingsOpen,
    toggleSettings,
    openSettings,
    matchedRecordCount,
    matchedCountLoading,
    isRenaming,
    setIsRenaming,
    editName,
    setEditName,
    inputRef,
    handleSaveRename,
    handleCancelRename,
    handleRenameBlur,
    showRemoveDialog,
    setShowRemoveDialog,
    handleRemoveFromMap,
  };
}
