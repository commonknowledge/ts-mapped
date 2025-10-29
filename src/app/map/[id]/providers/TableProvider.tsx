"use client";

import { useCallback, useMemo, useState } from "react";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import type { ReactNode } from "react";

const TableProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("");
  const [tablePage, setTablePage] = useState(0);

  const handleDataSourceSelect = useCallback(
    (dataSourceId: string) => {
      if (selectedDataSourceId === dataSourceId) {
        setSelectedDataSourceId("");
        return;
      }
      setSelectedDataSourceId(dataSourceId);
    },
    [selectedDataSourceId],
  );

  const value = useMemo(() => {
    return {
      tablePage,
      setTablePage,
      selectedDataSourceId,
      setSelectedDataSourceId,
      handleDataSourceSelect,
    };
  }, [
    tablePage,
    setTablePage,
    selectedDataSourceId,
    setSelectedDataSourceId,
    handleDataSourceSelect,
  ]);
  return <TableContext value={value}>{children}</TableContext>;
};

export default TableProvider;
