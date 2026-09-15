import { atom, useAtomValueRawSync, useSetAtom } from "jotai";
import { useEffect } from "react";

/**
 * True on the superadmin data-source config page.
 * Switches useDataSources() to query trpc.dataSource.listPublic so that
 * preview components (ConfiguredDataPanel, etc.) resolve data sources from
 * the same cache that the superadmin page writes optimistic updates into.
 */
export const isSuperadminDataSourceRouteAtom = atom<boolean>(false);

// Written by an effect on mount, and read by useDataSources() in the same
// commit. jotai 3's `useAtomValue` no longer re-renders once after subscribing,
// so a reader that subscribed after the write would keep the stale `false`.
// `useAtomValueRawSync` (useSyncExternalStore) picks up writes made during
// mount. See the comment in src/app/(private)/map/[id]/hooks/useMapCore.ts.
export function useIsSuperadminDataSourceRoute() {
  return useAtomValueRawSync(isSuperadminDataSourceRouteAtom);
}

/** Marks the superadmin data-source config page as active while mounted. */
export function useSuperadminDataSourceRouteEffect() {
  const setIsSuperadminDataSourceRoute = useSetAtom(
    isSuperadminDataSourceRouteAtom,
  );
  useEffect(() => {
    setIsSuperadminDataSourceRoute(true);
    return () => setIsSuperadminDataSourceRoute(false);
  }, [setIsSuperadminDataSourceRoute]);
}
