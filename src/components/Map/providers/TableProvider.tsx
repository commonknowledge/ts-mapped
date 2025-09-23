"use client";

import { useContext, useMemo, useState } from "react";
import { MapContext } from "@/components/Map/context/MapContext";
import { TableContext } from "@/components/Map/context/TableContext";
import { useDataRecordsQuery } from "../data";
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

  const dataRecordsQuery = useDataRecordsQuery({
    dataSourceId: selectedDataSourceId,
    page: tablePage,
    search: dataSourceView?.search,
    filter: dataSourceView?.filter,
    sort: dataSourceView?.sort,
  });

  const handleDataSourceSelect = (dataSourceId: string) => {
    if (selectedDataSourceId === dataSourceId) {
      setSelectedDataSourceId("");
      return;
    }
    setSelectedDataSourceId(dataSourceId);
  };

  return (
    <TableContext
      value={{
        tablePage,
        setTablePage,

        selectedDataSourceId,
        handleDataSourceSelect,
        selectedRecordId,
        setSelectedRecordId,

        dataRecordsQuery,
      }}
    >
      {children}
    </TableContext>
  );
};

export default TableProvider;
