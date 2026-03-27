import { atom } from "jotai";

/**
 * True on the superadmin data-source config page.
 * Switches useDataSources() to query trpc.dataSource.listPublic so that
 * preview components (ConfiguredDataPanel, etc.) resolve data sources from
 * the same cache that the superadmin page writes optimistic updates into.
 */
export const isSuperadminDataSourceRouteAtom = atom<boolean>(false);
