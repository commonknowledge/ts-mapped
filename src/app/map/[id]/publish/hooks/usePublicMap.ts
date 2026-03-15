import { useAtomValue, useSetAtom } from "jotai";
import { isPrivateRouteAtom } from "@/app/map/[id]/atoms/mapStateAtoms";
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
  return useAtomValue(isPrivateRouteAtom);
}

export function useIsPrivateRoute() {
  return useAtomValue(isPrivateRouteAtom);
}

export function useSearchLocation() {
  return useAtomValue(searchLocationAtom);
}

export function useSetSearchLocation() {
  return useSetAtom(searchLocationAtom);
}

export function useActiveDataSourceId() {
  const atomValue = useAtomValue(activeDataSourceIdAtom);
  const { publicMap } = usePublicMapQuery();
  return atomValue ?? publicMap?.dataSourceConfigs[0]?.dataSourceId ?? null;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stripMeta = ({
    id,
    mapId,
    viewId,
    createdAt,
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
