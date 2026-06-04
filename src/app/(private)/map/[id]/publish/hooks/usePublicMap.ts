import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { isPublicMapRouteAtom } from "@/app/(private)/map/[id]/atoms/mapStateAtoms";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import { useDataSources } from "@/hooks/useDataSources";
import { getPublicDataSourceIds } from "@/utils/map";
import {
  activeDataSourceIdAtom,
  activePublishTabAtom,
  hostAvailableAtom,
  searchLocationAtom,
} from "../atoms/publicMapAtoms";
import { usePublicMapQuery } from "./usePublicMapQuery";

// Re-export query-cache-backed hooks so existing consumer imports keep working
export {
  useSetPublicMap,
  useUpdatePublicMap,
  useUpdateDataSourceConfig,
  useUpdateAdditionalColumn,
} from "./usePublicMapQuery";

// Granular read hooks
export function usePublicMapValue() {
  const { publicMap } = usePublicMapQuery();
  return publicMap;
}

export function usePublishedPublicMapValue() {
  const { publishedPublicMap } = usePublicMapQuery();
  return publishedPublicMap;
}

/**
 * Returns `true` when on the private `/map/[id]` route (the "editor"),
 * `false` on the standalone public page.
 * This replaces the old `editableAtom`.
 */
export function useEditable() {
  return !useAtomValue(isPublicMapRouteAtom);
}

export function useIsPublicMapRoute() {
  return useAtomValue(isPublicMapRouteAtom);
}

export function useSearchLocation() {
  return useAtomValue(searchLocationAtom);
}

export function useSetSearchLocation() {
  return useSetAtom(searchLocationAtom);
}

/**
 * Returns the intersection of mapConfig marker data source IDs and
 * publicMap.dataSourceConfigs. This is the canonical list of data sources
 * visible on the public map.
 */
export function usePublicDataSourceIds(): string[] {
  const { mapConfig } = useMapConfig();
  const publicMap = usePublicMapValue();
  const { data: dataSources } = useDataSources();
  return useMemo(() => {
    if (!publicMap) {
      return [];
    }
    const ids = getPublicDataSourceIds(mapConfig, publicMap.dataSourceConfigs);
    // Hide references to data sources that no longer exist (e.g. deleted),
    // mirroring how private maps filter via useMarkerDataSources. While the
    // data sources are still loading, keep the unfiltered list to avoid a flash.
    if (!dataSources) {
      return ids;
    }
    const existingIds = new Set(dataSources.map((ds) => ds.id));
    return ids.filter((id) => existingIds.has(id));
  }, [mapConfig, publicMap, dataSources]);
}

export function useActiveDataSourceId() {
  const atomValue = useAtomValue(activeDataSourceIdAtom);
  const publicDataSourceIds = usePublicDataSourceIds();
  return atomValue ?? publicDataSourceIds[0] ?? null;
}

export function useSetActiveDataSourceId() {
  return useSetAtom(activeDataSourceIdAtom);
}

export function useActivePublishTab() {
  return useAtomValue(activePublishTabAtom);
}

export function useSetActivePublishTab() {
  return useSetAtom(activePublishTabAtom);
}

export function useColorScheme() {
  const { publicMap } = usePublicMapQuery();
  return publicMap?.colorScheme || "red";
}

export function useHasDraftChanges() {
  const { publicMap, publishedPublicMap } = usePublicMapQuery();
  if (!publicMap || !publishedPublicMap) return false;

  const stripMeta = ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createdAt,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    draft,
    ...rest
  }: NonNullable<typeof publicMap>) => rest;
  return (
    JSON.stringify(stripMeta(publicMap)) !==
    JSON.stringify(stripMeta(publishedPublicMap))
  );
}

export function useHostAvailable() {
  return useAtomValue(hostAvailableAtom);
}

export function useSetHostAvailable() {
  return useSetAtom(hostAvailableAtom);
}
