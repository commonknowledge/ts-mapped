"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useContext } from "react";

import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { useTRPC } from "@/services/trpc/react";
import type { ReactNode } from "react";

export default function DataSourcesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapConfig, viewConfig } = useContext(MapContext);
  const { organisationId } = useContext(OrganisationsContext);

  const trpc = useTRPC();

  const { data: dataSources, isPending } = useQuery(
    trpc.dataSource.byOrganisation.queryOptions(
      { organisationId: organisationId || "" },
      { enabled: Boolean(organisationId) },
    ),
  );

  const getDataSources = useCallback(() => {
    return dataSources || [];
  }, [dataSources]);

  const getDataSourceById = useCallback(
    (id: string | null | undefined) => {
      if (!id) {
        return null;
      }
      const dataSources = getDataSources();
      return dataSources.find((ds) => ds.id === id) || null;
    },
    [getDataSources],
  );

  const getChoroplethDataSource = useCallback(() => {
    if (!viewConfig.areaDataSourceId) return null;
    return (
      dataSources?.find((ds) => ds.id === viewConfig.areaDataSourceId) || null
    );
  }, [dataSources, viewConfig.areaDataSourceId]);

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
        dataSourcesLoading: isPending,
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
