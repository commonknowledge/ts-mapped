"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { useTRPC } from "@/services/trpc/react";
import { useMapViews } from "../hooks/useMapViews";
import type { ReactNode } from "react";

const TableProvider = ({ children }: { children: ReactNode }) => {
  const { view } = useMapViews();

  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("");
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
    trpc.dataRecord.list.queryOptions(
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
      setSelectedDataSourceId,
      handleDataSourceSelect,
      dataRecordsResult: dataRecordsQuery.data,
      dataRecordsLoading: dataRecordsQuery.isPending,
    };
  }, [
    tablePage,
    setTablePage,
    selectedDataSourceId,
    setSelectedDataSourceId,
    handleDataSourceSelect,
    dataRecordsQuery.data,
    dataRecordsQuery.isPending,
  ]);
  return <TableContext value={value}>{children}</TableContext>;
};

export default TableProvider;
