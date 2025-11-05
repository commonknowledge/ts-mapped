"use client";

import { useEffect, useState } from "react";
import { getDataSourceIds } from "@/app/map/[id]/context/MapContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { createDataSourceConfig } from "../components/DataSourcesSelect";
import { PublicMapContext } from "../context/PublicMapContext";
import type {
  PublicMap,
  PublicMapColumn,
  PublicMapDataSourceConfig,
} from "@/server/models/PublicMap";
import type { Point } from "@/server/models/shared";
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
  const { publicMap, setPublicMap, activeTabId, setActiveTabId } =
    usePublicMapAndActiveTab(initialPublicMap, editable);
  const [searchLocation, setSearchLocation] = useState<Point | null>(null);

  const [activePublishTab, setActivePublishTab] = useState<string>("settings");
  const [recordSidebarVisible, setRecordSidebarVisible] =
    useState<boolean>(false);

  const updatePublicMap = (updates: Partial<PublicMap>) => {
    if (publicMap) {
      setPublicMap({ ...publicMap, ...updates });
    }
  };

  const colourScheme = publicMap?.colourScheme || "red";

  const updateDataSourceConfig = (
    dataSourceId: string,
    updates: Partial<PublicMapDataSourceConfig>,
  ) => {
    if (publicMap) {
      setPublicMap({
        ...publicMap,
        dataSourceConfigs: publicMap.dataSourceConfigs.map((dsc) => {
          if (dsc.dataSourceId === dataSourceId) {
            return { ...dsc, ...updates };
          }
          return dsc;
        }),
      });
    }
  };

  const updateAdditionalColumn = (
    dataSourceId: string,
    columnIndex: number,
    updates: Partial<PublicMapColumn>,
  ) => {
    if (publicMap) {
      setPublicMap({
        ...publicMap,
        dataSourceConfigs: publicMap.dataSourceConfigs.map((dsc) => {
          if (dsc.dataSourceId === dataSourceId) {
            return {
              ...dsc,
              additionalColumns: dsc.additionalColumns.map((c, i) => {
                if (i === columnIndex) {
                  return { ...c, ...updates };
                }
                return c;
              }),
            };
          }
          return dsc;
        }),
      });
    }
  };

  return (
    <PublicMapContext
      value={{
        publicMap,
        editable,
        searchLocation,
        setSearchLocation,
        updatePublicMap,
        updateDataSourceConfig,
        updateAdditionalColumn,
        activeTabId,
        setActiveTabId,
        activePublishTab,
        setActivePublishTab,
        recordSidebarVisible,
        setRecordSidebarVisible,
        colourScheme,
      }}
    >
      {children}
    </PublicMapContext>
  );
}

// When loading an editable public map with no data sources,
// update the public map to show all available data sources
const usePublicMapAndActiveTab = (
  initialPublicMap: NonNullable<RouterOutputs["publicMap"]["getPublished"]>,
  editable: boolean,
) => {
  const { mapConfig } = useMapConfig();
  const { getDataSourceById } = useDataSources();

  const [publicMap, setPublicMap] = useState(initialPublicMap);
  const [activeTabId, setActiveTabId] = useState<string | null>(
    publicMap?.dataSourceConfigs?.[0]?.dataSourceId || null,
  );

  useEffect(() => {
    if (!editable || initialPublicMap.dataSourceConfigs.length) {
      return;
    }

    const dataSources = getDataSourceIds(mapConfig)
      .map(getDataSourceById)
      .filter((ds) => ds !== undefined && ds !== null);

    const dataSourceConfigs = dataSources.map(createDataSourceConfig);

    setPublicMap((prev) => ({ ...prev, dataSourceConfigs }));
    if (dataSourceConfigs.length) {
      setActiveTabId(dataSourceConfigs[0].dataSourceId);
    }
  }, [
    editable,
    getDataSourceById,
    initialPublicMap.dataSourceConfigs.length,
    mapConfig,
  ]);

  return { publicMap, setPublicMap, activeTabId, setActiveTabId };
};
