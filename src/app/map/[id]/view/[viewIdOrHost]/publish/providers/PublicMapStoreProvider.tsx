"use client";

import { useEffect, useMemo } from "react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { getDataSourceIds } from "@/app/map/[id]/stores/useMapStore";
import { createDataSourceConfig } from "../components/DataSourcesSelect";
import {
  PublicMapStoreContext,
  createPublicMapStore,
} from "../stores/usePublicMapStore";
import type { RouterOutputs } from "@/services/trpc/react";
import type { ReactNode } from "react";

export function PublicMapStoreProvider({
  publicMap: initialPublicMap,
  editable = false,
  children,
}: {
  publicMap?: NonNullable<RouterOutputs["publicMap"]["getPublished"]>;
  editable?: boolean;
  children: ReactNode;
}) {
  const store = useMemo(
    () => createPublicMapStore(initialPublicMap, editable),
    [initialPublicMap, editable],
  );

  const { mapConfig } = useMapConfig();
  const { getDataSourceById } = useDataSources();

  // When loading an editable public map with no data sources,
  // update the public map to show all available data sources
  useEffect(() => {
    if (
      !initialPublicMap ||
      !editable ||
      initialPublicMap?.dataSourceConfigs.length
    ) {
      return;
    }

    const dataSources = getDataSourceIds(mapConfig)
      .map((id) => getDataSourceById(id))
      .filter(
        (ds): ds is NonNullable<ReturnType<typeof getDataSourceById>> =>
          ds !== null,
      );

    const dataSourceConfigs = dataSources.map(createDataSourceConfig);

    store.getState().updatePublicMap({ dataSourceConfigs });
    if (dataSourceConfigs.length) {
      store.getState().setActiveTabId(dataSourceConfigs[0].dataSourceId);
    }
  }, [initialPublicMap, editable, getDataSourceById, mapConfig, store]);

  return (
    <PublicMapStoreContext value={store}>{children}</PublicMapStoreContext>
  );
}
