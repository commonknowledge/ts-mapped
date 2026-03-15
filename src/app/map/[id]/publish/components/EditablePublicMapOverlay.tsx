"use client";

import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { useViewId } from "@/app/map/[id]/hooks/useMapViews";
import { getDataSourceIds } from "@/app/map/[id]/utils/map";
import { useTRPC } from "@/services/trpc/react";
import Loading from "../../components/Loading";
import {
  activeTabIdAtom,
  editableAtom,
  publicMapAtom,
} from "../atoms/publicMapAtoms";
import { createDataSourceConfig } from "../components/DataSourcesSelect";
import PublicMapOverlay from "../components/PublicMapOverlay";
import type { RouterOutputs } from "@/services/trpc/react";

export default function EditablePublicMapOverlay() {
  const viewId = useViewId();
  const mapId = useMapId();
  const trpc = useTRPC();

  const { data: publicMap, isPending } = useQuery(
    trpc.publicMap.getEditable.queryOptions(
      { viewId: viewId ?? "" },
      { enabled: !!viewId },
    ),
  );

  const stub = useMemo(
    () =>
      viewId && mapId
        ? {
            id: uuidv4(),
            mapId,
            viewId,
            host: "",
            colorScheme: "red" as const,
            name: "My Public Map",
            description: "",
            descriptionLong: "",
            descriptionLink: "",
            imageUrl: "",
            published: false,
            dataSourceConfigs: [],
            createdAt: new Date(),
          }
        : null,
    [viewId, mapId],
  );

  const data = publicMap ?? stub;

  if (!viewId || isPending) {
    return <Loading />;
  }

  if (!data) {
    return <Loading />;
  }

  return (
    <EditablePublicMapAtoms publicMap={data}>
      <PublicMapOverlay />
    </EditablePublicMapAtoms>
  );
}

function EditablePublicMapAtoms({
  publicMap: initialPublicMap,
  children,
}: {
  publicMap: NonNullable<RouterOutputs["publicMap"]["getPublished"]>;
  children: React.ReactNode;
}) {
  const setPublicMap = useSetAtom(publicMapAtom);
  const setEditable = useSetAtom(editableAtom);
  const setActiveTabId = useSetAtom(activeTabIdAtom);

  useEffect(() => {
    setPublicMap(initialPublicMap);
    setEditable(true);
    setActiveTabId(
      initialPublicMap.dataSourceConfigs?.[0]?.dataSourceId || null,
    );
  }, [initialPublicMap, setPublicMap, setEditable, setActiveTabId]);

  useAutoPopulateDataSources(initialPublicMap);

  return children;
}

// When loading an editable public map with no data sources,
// update the public map to show all available data sources
function useAutoPopulateDataSources(
  initialPublicMap: NonNullable<RouterOutputs["publicMap"]["getPublished"]>,
) {
  const { mapConfig } = useMapConfig();
  const { getDataSourceById } = useDataSources();
  const setPublicMap = useSetAtom(publicMapAtom);
  const setActiveTabId = useSetAtom(activeTabIdAtom);

  useEffect(() => {
    if (initialPublicMap.dataSourceConfigs.length) {
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
    getDataSourceById,
    initialPublicMap.dataSourceConfigs.length,
    mapConfig,
    setPublicMap,
    setActiveTabId,
  ]);
}
