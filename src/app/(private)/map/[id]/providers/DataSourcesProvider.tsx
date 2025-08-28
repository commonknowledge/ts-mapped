"use client";

import { useQuery } from "@tanstack/react-query";
import { ReactNode, useCallback } from "react";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { useTRPC } from "@/lib/trpc";

export default function DataSourcesProvider({
  children,
}: {
  children: ReactNode;
}) {
  // const { mapConfig, viewConfig } = useContext(MapContext);

  const trpc = useTRPC();
  const { data: dataSources = [], isLoading } = useQuery(
    trpc.dataSource.all.queryOptions(),
  );

  const getDataSourceById = useCallback(
    (id: string) => {
      return dataSources.find((ds) => ds.id === id) || null;
    },
    [dataSources],
  );

  // const getChoroplethDataSource = useCallback(() => {
  //   if (!viewConfig.areaDataSourceId) return null;
  //   return (
  //     dataSources?.find((ds) => ds.id === viewConfig.areaDataSourceId) || null
  //   );
  // }, [dataSources, viewConfig.areaDataSourceId]);

  // const getMarkerDataSources = () => {
  //   return dataSources.filter((ds) =>
  //     mapConfig.markerDataSourceIds.includes(ds.id)
  //   );
  // };

  // const getMembersDataSource = () => {
  //   return getDataSourceById(mapConfig.membersDataSourceId);
  // };

  return (
    <DataSourcesContext
      value={{
        dataSourcesLoading: isLoading,
        dataSources,
        getDataSourceById,
      }}
    >
      {children}
    </DataSourcesContext>
  );
}
