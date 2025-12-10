"use client";

import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { selectedDataSourceIdAtom, tablePageAtom } from "../atoms/tableAtoms";

export function useTable() {
  const [selectedDataSourceId, setSelectedDataSourceId] = useAtom(
    selectedDataSourceIdAtom,
  );
  const [tablePage, setTablePage] = useAtom(tablePageAtom);

  const handleDataSourceSelect = useCallback(
    (dataSourceId: string) => {
      setTablePage(0);
      if (selectedDataSourceId === dataSourceId) {
        setSelectedDataSourceId("");
        return;
      }
      setSelectedDataSourceId(dataSourceId);
    },
    [selectedDataSourceId, setSelectedDataSourceId, setTablePage],
  );

  return useMemo(
    () => ({
      tablePage,
      setTablePage,
      selectedDataSourceId,
      setSelectedDataSourceId,
      handleDataSourceSelect,
    }),
    [
      tablePage,
      setTablePage,
      selectedDataSourceId,
      setSelectedDataSourceId,
      handleDataSourceSelect,
    ],
  );
}
