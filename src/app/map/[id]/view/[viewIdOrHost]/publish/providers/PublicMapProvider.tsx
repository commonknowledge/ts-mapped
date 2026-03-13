"use client";

import { useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useEffect } from "react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { getDataSourceIds } from "@/app/map/[id]/utils/map";
import {
  activeTabIdAtom,
  editableAtom,
  publicMapAtom,
} from "../atoms/publicMapAtoms";
import { createDataSourceConfig } from "../components/DataSourcesSelect";
import type { RouterOutputs } from "@/services/trpc/react";
import type { ReactNode } from "react";

export default function PublicMapProvider({
  publicMap: initialPublicMap,
  editable = false,
  children,
}: {
  publicMap: NonNullable<RouterOutputs["publicMap"]["getPublished"]>;
  editable?: boolean;
  children: ReactNode;
}) {
  useHydrateAtoms([
    [publicMapAtom, initialPublicMap],
    [editableAtom, editable],
    [
      activeTabIdAtom,
      initialPublicMap.dataSourceConfigs?.[0]?.dataSourceId || null,
    ],
  ] as const);

  useAutoPopulateDataSources(initialPublicMap, editable);

  return children;
}

// When loading an editable public map with no data sources,
// update the public map to show all available data sources
function useAutoPopulateDataSources(
  initialPublicMap: NonNullable<RouterOutputs["publicMap"]["getPublished"]>,
  editable: boolean,
) {
  const { mapConfig } = useMapConfig();
  const { getDataSourceById } = useDataSources();
  const setPublicMap = useSetAtom(publicMapAtom);
  const setActiveTabId = useSetAtom(activeTabIdAtom);

  useEffect(() => {
    if (!editable || initialPublicMap.dataSourceConfigs.length) {
      return;
    }

    const dataSources = getDataSourceIds(mapConfig)
      .map(getDataSourceById)
      .filter((ds) => ds !== undefined && ds !== null);

    const dataSourceConfigs = dataSources.map(createDataSourceConfig);

    setPublicMap((prev) => (prev ? { ...prev, dataSourceConfigs } : prev));
    if (dataSourceConfigs.length) {
      setActiveTabId(dataSourceConfigs[0].dataSourceId);
    }
  }, [
    editable,
    getDataSourceById,
    initialPublicMap.dataSourceConfigs.length,
    mapConfig,
    setPublicMap,
    setActiveTabId,
  ]);
}
