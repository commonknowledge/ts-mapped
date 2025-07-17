"use client";

import { ReactNode, useContext } from "react";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { useDataSourcesQuery } from "../data";

export default function DataSourcesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { viewConfig } = useContext(MapContext);

  const dataSourcesQuery = useDataSourcesQuery();

  const getDataSources = () => {
    return dataSourcesQuery.data?.dataSources || [];
  };

  const getDataSourceById = (id: string) => {
    const dataSources = getDataSources();
    return dataSources.find((ds) => ds.id === id) || null;
  };

  const getChoroplethDataSource = () => {
    return getDataSourceById(viewConfig.areaDataSourceId);
  };

  const getMarkerDataSources = () => {
    const dataSources = getDataSources();
    return dataSources.filter((ds) =>
      viewConfig.markerDataSourceIds.includes(ds.id),
    );
  };

  const getMembersDataSource = () => {
    return getDataSourceById(viewConfig.membersDataSourceId);
  };

  return (
    <DataSourcesContext
      value={{
        dataSourcesLoading: dataSourcesQuery.loading,
        getDataSources,
        getDataSourceById,
        getChoroplethDataSource,
        getMarkerDataSources,
        getMembersDataSource,
      }}
    >
      {children}
    </DataSourcesContext>
  );
}
