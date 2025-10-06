"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { DataRecordContext } from "@/app/map/[id]/context/DataRecordContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { useTRPC } from "@/services/trpc/react";
import type { ReactNode } from "react";

const TableProvider = ({ children }: { children: ReactNode }) => {
  const { view } = useContext(MapContext);
  const { selectedDataRecord } = useContext(DataRecordContext);

  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("");
  const [tablePage, setTablePage] = useState(0);
  const [loadingRecordPage, setLoadingRecordPage] = useState(false);

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
      { enabled: Boolean(selectedDataSourceId) },
    ),
  );

  const handleDataSourceSelect = (dataSourceId: string) => {
    if (selectedDataSourceId === dataSourceId) {
      setSelectedDataSourceId("");
      return;
    }
    setSelectedDataSourceId(dataSourceId);
  };

  // If the user selects a record that is not visible on the current table page,
  // find the table page it is on and skip to it
  const queryClient = useQueryClient();
  useEffect(() => {
    const skipToPage = async () => {
      if (
        selectedDataSourceId &&
        selectedDataRecord &&
        dataRecordsQuery.data &&
        !dataRecordsQuery.data.records.find(
          (r) => r.id === selectedDataRecord.id,
        )
      ) {
        setLoadingRecordPage(true);
        try {
          const selectedDataRecordPage = await queryClient.fetchQuery(
            trpc.dataRecord.findPage.queryOptions({
              dataRecordId: selectedDataRecord.id,
              dataSourceId: selectedDataSourceId,
              search: dataSourceView?.search,
              filter: dataSourceView?.filter,
              sort: dataSourceView?.sort,
            }),
          );
          setTablePage(selectedDataRecordPage);
        } finally {
          setLoadingRecordPage(false);
        }
      }
    };
    skipToPage();
  }, [
    dataRecordsQuery.data,
    dataSourceView?.filter,
    dataSourceView?.search,
    dataSourceView?.sort,
    queryClient,
    selectedDataRecord,
    selectedDataSourceId,
    trpc.dataRecord.findPage,
  ]);

  return (
    <TableContext
      value={{
        tablePage,
        setTablePage,

        selectedDataSourceId,
        setSelectedDataSourceId,
        handleDataSourceSelect,

        dataRecordsResult: dataRecordsQuery.data,
        dataRecordsLoading: dataRecordsQuery.isPending || loadingRecordPage,
      }}
    >
      {children}
    </TableContext>
  );
};

export default TableProvider;
