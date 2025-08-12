"use client";

import { ReactNode, useContext } from "react";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { useDataSourcesQuery } from "../data";

export default function DataSourcesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapConfig, viewConfig } = useContext(MapContext);

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
      mapConfig.markerDataSourceIds.includes(ds.id),
    );
  };

  const getMembersDataSource = () => {
    return getDataSourceById(mapConfig.membersDataSourceId);
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
