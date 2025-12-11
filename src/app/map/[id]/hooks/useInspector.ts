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
import type { SelectedRecord } from "@/app/map/[id]/types/inspector";

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

  const inspectorContent = useMemo(() => {
    // if no selected marker / member to inspect
    if (!focusedRecord) {
      // check if area selected
      if (selectedTurf?.id) {
        return {
          type: LayerType.Turf,
          name: selectedTurf.name || "Area",
          properties: null,
          dataSource: null,
        };
      } else if (selectedBoundary?.name) {
        return {
          type: LayerType.Boundary,
          name: selectedBoundary.name,
          properties: {
            ["Area Code"]: selectedBoundary?.areaCode,
            Dataset: getBoundaryDatasetName(selectedBoundary?.sourceLayerId),
          },
        };
      }
      return null;
    }

    const dataSourceId = focusedRecord.dataSourceId;

    const dataSource = dataSourceId ? getDataSourceById(dataSourceId) : null;
    const type =
      dataSourceId === mapConfig.membersDataSourceId
        ? LayerType.Member
        : LayerType.Marker;

    return {
      type: type,
      name: focusedRecord.name,
      properties: null,
      dataSource: dataSource,
    };
  }, [
    focusedRecord,
    getDataSourceById,
    mapConfig.membersDataSourceId,
    selectedBoundary?.areaCode,
    selectedBoundary?.name,
    selectedBoundary?.sourceLayerId,
    selectedTurf?.id,
    selectedTurf?.name,
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
