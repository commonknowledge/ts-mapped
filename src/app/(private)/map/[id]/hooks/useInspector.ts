"use client";

import { useMemo } from "react";
import { useDataSources } from "@/app/(private)/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import { LayerType } from "@/types";
import { useInspectorState } from "./useInspectorState";

export function useInspectorContent() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();

  const { focusedRecord, selectedTurf, selectedBoundary, selectedRecords } =
    useInspectorState();

  const inspectorContent = useMemo(() => {
    // if no selected marker / member to inspect
    if (!focusedRecord) {
      // check if area selected
      if (selectedTurf?.id) {
        return {
          type: LayerType.Turf,
          name: selectedTurf.name || "Area",
          properties: [],
          dataSource: null,
        };
      } else if (selectedBoundary?.name) {
        return {
          type: LayerType.Boundary,
          name: selectedBoundary.name,
          properties: [
            { label: "Boundary code", value: selectedBoundary?.code },
          ],
        };
      }
      return null;
    }

    const dataSourceId = focusedRecord.dataSourceId;
    const dataSource = dataSourceId ? getDataSourceById(dataSourceId) : null;
    if (selectedRecords.length > 1) {
      return {
        type: LayerType.Cluster,
        name: "Cluster",
        properties: [],
        dataSource,
      };
    }

    const type =
      dataSourceId === mapConfig.membersDataSourceId
        ? LayerType.Member
        : LayerType.Marker;

    return {
      type,
      name: focusedRecord.name,
      properties: [],
      dataSource,
    };
  }, [
    focusedRecord,
    getDataSourceById,
    mapConfig.membersDataSourceId,
    selectedBoundary,
    selectedRecords.length,
    selectedTurf,
  ]);

  return { inspectorContent };
}
