"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useContext, useMemo, useState } from "react";
import { MapContext } from "@/components/Map/context/MapContext";
import { TableContext } from "@/components/Map/context/TableContext";
import { useTRPC } from "@/services/trpc/react";
import type { ReactNode } from "react";

const TableProvider = ({ children }: { children: ReactNode }) => {
  const { view } = useContext(MapContext);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const [tablePage, setTablePage] = useState(0);

  const dataSourceView = useMemo(
    () =>
      view?.dataSourceViews.find(
        (dsv) => dsv.dataSourceId === selectedDataSourceId,
      ),
    [selectedDataSourceId, view?.dataSourceViews],
  );

  const trpc = useTRPC();

  const dataRecordsQuery = useQuery(
    trpc.dataSource.byIdWithRecords.queryOptions(
      {
        dataSourceId: selectedDataSourceId,
        page: tablePage,
        search: dataSourceView?.search,
        filter: dataSourceView?.filter,
        sort: dataSourceView?.sort,
      },
      {
        enabled: Boolean(selectedDataSourceId),
        placeholderData: keepPreviousData,
      },
    ),
  );

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
      handleDataSourceSelect,
      selectedRecordId,
      setSelectedRecordId,
      dataRecordsQuery: {
        data: dataRecordsQuery.data,
        isPending: dataRecordsQuery.isPending,
      },
    };
  }, [
    tablePage,
    setTablePage,
    selectedDataSourceId,
    handleDataSourceSelect,
    selectedRecordId,
    setSelectedRecordId,
    dataRecordsQuery.data,
    dataRecordsQuery.isPending,
  ]);
  return <TableContext value={value}>{children}</TableContext>;
};

export default TableProvider;
