"use client";

import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { getBoundaryDatasetName } from "@/app/map/[id]/components/inspector/helpers";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { LayerType } from "@/types";
import {
  focusedRecordAtom,
  selectedBoundaryAtom,
  selectedRecordsAtom,
  selectedTurfAtom,
} from "../atoms/inspectorAtoms";
import type { PropertiesListItem } from "../components/inspector/PropertiesList";
import type { SelectedRecord } from "@/app/map/[id]/types/inspector";
import type { DataSource } from "@/server/models/DataSource";

export function useInspector() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();

  const [selectedRecords, _setSelectedRecords] = useAtom(selectedRecordsAtom);
  const [focusedRecord, _setFocusedRecord] = useAtom(focusedRecordAtom);
  const [selectedTurf, setSelectedTurf] = useAtom(selectedTurfAtom);
  const [selectedBoundary, setSelectedBoundary] = useAtom(selectedBoundaryAtom);

  // Custom setter to keep selectedRecords and focusedRecord in sync
  const setSelectedRecords = useCallback(
    (records: SelectedRecord[]) => {
      _setSelectedRecords(records);
      _setFocusedRecord(records.length ? records[0] : null);
    },
    [_setSelectedRecords, _setFocusedRecord],
  );

  // Custom setter to keep selectedRecords and focusedRecord in sync
  const setFocusedRecord = useCallback(
    (record: SelectedRecord | null) => {
      _setFocusedRecord(record);
      if (!record) {
        return;
      }
      if (!selectedRecords.some((sr) => sr.id === record.id)) {
        _setSelectedRecords([record]);
      }
    },
    [selectedRecords, _setSelectedRecords, _setFocusedRecord],
  );

  const inspectorContent: {
    type: LayerType;
    name: string;
    properties: PropertiesListItem[];
    dataSource?: DataSource | null | undefined;
  } | null = useMemo(() => {
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
            {
              label: "Boundary set",
              value: getBoundaryDatasetName(selectedBoundary?.sourceLayerId),
            },
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

  const resetInspector = useCallback(() => {
    setSelectedRecords([]);
    setSelectedTurf(null);
    setSelectedBoundary(null);
  }, [setSelectedRecords, setSelectedTurf, setSelectedBoundary]);

  return {
    inspectorContent,
    selectedRecords,
    setSelectedRecords,
    focusedRecord,
    setFocusedRecord,
    selectedTurf,
    setSelectedTurf,
    selectedBoundary,
    setSelectedBoundary,
    resetInspector,
  };
}
