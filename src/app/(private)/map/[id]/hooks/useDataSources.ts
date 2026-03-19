"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { isPublicMapRouteAtom } from "@/app/(private)/map/[id]/atoms/mapStateAtoms";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import {
  useMapViews,
  useViewId,
} from "@/app/(private)/map/[id]/hooks/useMapViews";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useTRPC } from "@/services/trpc/react";
import { useMapId } from "./useMapCore";

export function useDataSources() {
  const trpc = useTRPC();
  const organisationId = useOrganisationId();
  const isPublicMapRoute = useAtomValue(isPublicMapRouteAtom);
  const mapId = useMapId();
  const viewId = useViewId();

  const listReadableQuery = useQuery(
    trpc.dataSource.listReadable.queryOptions(
      {
        activeOrganisationId: organisationId ?? undefined,
      },
      { enabled: !isPublicMapRoute },
    ),
  );

  const listForMapViewQuery = useQuery(
    trpc.dataSource.listForMapView.queryOptions(
      { mapId: mapId ?? "", viewId: viewId ?? "" },
      { enabled: isPublicMapRoute && Boolean(mapId) && Boolean(viewId) },
    ),
  );

  const query = isPublicMapRoute ? listForMapViewQuery : listReadableQuery;

  const getDataSourceById = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null;
      return query.data?.find((ds) => ds.id === id) || null;
    },
    [query.data],
  );

  return {
    ...query,
    getDataSourceById,
  };
}

export function useChoroplethDataSource() {
  const { data: dataSources } = useDataSources();

  const { viewConfig } = useMapViews();

  return useMemo(() => {
    if (!viewConfig.areaDataSourceId) return null;
    return dataSources?.find((ds) => ds.id === viewConfig.areaDataSourceId);
  }, [dataSources, viewConfig.areaDataSourceId]);
}

export function useMarkerDataSources() {
  const { mapConfig } = useMapConfig();
  const { data: dataSources } = useDataSources();

  return useMemo(() => {
    return dataSources?.filter((ds) =>
      mapConfig.markerDataSourceIds.includes(ds.id),
    );
  }, [dataSources, mapConfig.markerDataSourceIds]);
}

export function useMembersDataSource() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();

  return useMemo(() => {
    return getDataSourceById(mapConfig.membersDataSourceId);
  }, [getDataSourceById, mapConfig.membersDataSourceId]);
}
