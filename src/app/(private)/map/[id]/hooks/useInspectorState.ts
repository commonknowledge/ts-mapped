"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import {
  focusedRecordAtom,
  selectedBoundaryAtom,
  selectedRecordsAtom,
  selectedTurfAtom,
} from "../atoms/inspectorAtoms";
import type { SelectedRecord } from "@/app/(private)/map/[id]/types/inspector";

export function useInspectorState() {
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

  const resetInspector = useCallback(() => {
    setSelectedRecords([]);
    setSelectedTurf(null);
    setSelectedBoundary(null);
  }, [setSelectedRecords, setSelectedTurf, setSelectedBoundary]);

  return {
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
