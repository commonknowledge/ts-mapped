"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import {
  useMapId,
  useMapRoute,
} from "@/app/(private)/map/[id]/hooks/useMapCore";
import {
  useMapViews,
  useViewId,
} from "@/app/(private)/map/[id]/hooks/useMapViews";
import { isAnonymousViewerRoute } from "@/app/(private)/map/[id]/utils/mapRoute";
import { useIsSuperadminDataSourceRoute } from "@/atoms/dataSourceAtoms";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useTRPC } from "@/services/trpc/react";

export function useDataSources() {
  const trpc = useTRPC();
  const organisationId = useOrganisationId();
  const route = useMapRoute();
  const isSuperadminDataSourceRoute = useIsSuperadminDataSourceRoute();
  const mapId = useMapId();
  const viewId = useViewId();

  // Routes serving anonymous viewers (the public map page and the
  // read-only shared map page) list only the data sources the map/view
  // visualises; `listReadable` requires an authenticated user.
  const isAnonymousViewer = isAnonymousViewerRoute(route);

  const listPublicQuery = useQuery(
    trpc.dataSource.listPublic.queryOptions(undefined, {
      enabled: isSuperadminDataSourceRoute,
    }),
  );

  const listReadableQuery = useQuery(
    trpc.dataSource.listReadable.queryOptions(
      {
        activeOrganisationId: organisationId ?? undefined,
      },
      { enabled: !isAnonymousViewer && !isSuperadminDataSourceRoute },
    ),
  );

  const listForMapViewQuery = useQuery(
    trpc.dataSource.listForMapView.queryOptions(
      { mapId: mapId ?? "", viewId: viewId ?? "" },
      { enabled: isAnonymousViewer && Boolean(mapId) && Boolean(viewId) },
    ),
  );

  const query = isSuperadminDataSourceRoute
    ? listPublicQuery
    : isAnonymousViewer
      ? listForMapViewQuery
      : listReadableQuery;

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
