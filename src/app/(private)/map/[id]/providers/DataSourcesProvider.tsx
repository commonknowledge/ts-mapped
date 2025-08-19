"use client";

import { ReactNode, useCallback, useContext } from "react";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { useDataSourcesQuery } from "../data";

export default function DataSourcesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapConfig, viewConfig } = useContext(MapContext);

  const dataSourcesQuery = useDataSourcesQuery();

  const getDataSources = useCallback(() => {
    return dataSourcesQuery.data?.dataSources || [];
  }, [dataSourcesQuery.data?.dataSources]);

  const getDataSourceById = useCallback(
    (id: string) => {
      const dataSources = getDataSources();
      return dataSources.find((ds) => ds.id === id) || null;
    },
    [getDataSources]
  );

  const getChoroplethDataSource = useCallback(() => {
    if (!viewConfig.areaDataSourceId) return null;
    return (
      dataSourcesQuery.data?.dataSources?.find(
        (ds) => ds.id === viewConfig.areaDataSourceId
      ) || null
    );
  }, [dataSourcesQuery.data?.dataSources, viewConfig.areaDataSourceId]);

  const getMarkerDataSources = () => {
    const dataSources = getDataSources();
    return dataSources.filter((ds) =>
      mapConfig.markerDataSourceIds.includes(ds.id)
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
