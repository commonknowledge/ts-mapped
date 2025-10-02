"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { v4 as uuidv4 } from "uuid";
import {
  MapConfig,
  MapContext,
  ViewConfig,
} from "@/app/map/[id]/context/MapContext";
import { DEFAULT_ZOOM } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { useDeleteMapViewMutation, useUpdateMapConfigMutation } from "../data";
import { getNewLastPosition } from "../utils";
import type { View } from "../types";
import type { BoundingBoxInput } from "@/__generated__/types";
import type { ReactNode } from "react";
import type { MapRef } from "react-map-gl/mapbox";

export default function MapProvider({
  children,
  mapId,
  viewId: initialViewId,
}: {
  children: ReactNode;
  mapId: string;
  viewId?: string;
}) {
  /* Map Ref */
  const mapRef = useRef<MapRef>(null);
  const [mapName, setMapName] = useState<string | null>(null);

  /* Map State */

  const [boundingBox, setBoundingBox] = useState<BoundingBoxInput | null>(null);
  const [mapConfig, setMapConfig] = useState(new MapConfig());
  const [dirtyViewIds, setDirtyViewIds] = useState<string[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [viewId, setViewId] = useState<string | null>(initialViewId || null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ready, setReady] = useState(false);
  const [configDirty, setConfigDirty] = useState(false);

  /* Server Data */
  const trpc = useTRPC();
  const mapQuery = useQuery(
    trpc.map.get.queryOptions({ mapId }, { refetchOnMount: "always" }),
  );

  const updateMapConfig = (nextMapConfig: Partial<MapConfig>) => {
    setMapConfig(new MapConfig({ ...mapConfig, ...nextMapConfig }));
    setConfigDirty(true);
  };

  const view = useMemo(
    () => views.find((v) => v.id === viewId) || null,
    [viewId, views],
  );

  const updateViewConfig = (nextViewConfig: Partial<ViewConfig>) => {
    if (!view) {
      return;
    }
    const nextView = {
      ...view,
      config: new ViewConfig({ ...view.config, ...nextViewConfig }),
    };
    setViews(views.map((v) => (v.id === view.id ? nextView : v)));
    setDirtyViewIds([...dirtyViewIds, view.id]);
  };

  const { mutate: deleteViewMutate } = useDeleteMapViewMutation();
  const deleteView = (viewId: string) => {
    setViews(views.filter((v) => v.id !== viewId));
    deleteViewMutate({ mapId, viewId });
  };

  const insertView = (view: Omit<View, "position">) => {
    setViews([...views, { ...view, position: getNewLastPosition(views) }]);
    setDirtyViewIds([...dirtyViewIds, view.id]);
  };

  const updateView = (view: View) => {
    setViews(views.map((v) => (v.id === view.id ? view : v)));
    setDirtyViewIds([...dirtyViewIds, view.id]);
  };

  const [_saveMapConfig] = useUpdateMapConfigMutation();
  const saveMapConfig = useCallback(async () => {
    await _saveMapConfig({
      variables: {
        mapId,
        mapConfig,
        views,
      },
    });
    setDirtyViewIds([]);
    setConfigDirty(false);
  }, [_saveMapConfig, mapConfig, mapId, views]);

  /* Effects */

  /* Update local map state when saved views are loaded from the server */
  const { data: mapData } = mapQuery;
  useEffect(() => {
    setMapName(mapData?.name || "Untitled");

    if (mapData?.config) {
      setMapConfig(new MapConfig(mapData.config));
    }

    if (mapData?.views && mapData.views.length > 0) {
      const nextView =
        mapData.views.find((v) => v.id === initialViewId) || mapData.views[0];
      setViewId(nextView.id);
      setViews(mapData.views);
    } else {
      const newView = {
        id: uuidv4(),
        name: "Default View",
        config: new ViewConfig(),
        dataSourceViews: [],
        position: 0,
      };
      setViewId(newView.id);
      setViews([newView]);
    }
  }, [initialViewId, mapData]);

  const viewConfig = useMemo(() => {
    return new ViewConfig({ ...view?.config });
  }, [view]);

  const autoSave = useCallback(async () => {
    if (!mapId || !mapConfig) {
      return;
    }

    try {
      await saveMapConfig();
    } catch (e) {
      console.error("UpdateMapConfig failed", e);
    }
  }, [mapConfig, mapId, saveMapConfig]);

  // auto save map config
  useEffect(() => {
    if (!configDirty) {
      return;
    }
    const handler = setTimeout(() => {
      autoSave();
    }, 1000); // debounce 1s

    return () => {
      clearTimeout(handler);
    };
  }, [autoSave, configDirty]);

  // auto save map view
  useEffect(() => {
    if (!dirtyViewIds?.length) {
      return;
    }

    const handler = setTimeout(() => {
      autoSave();
    }, 1000); // debounce 1s

    return () => {
      clearTimeout(handler);
    };
  }, [autoSave, dirtyViewIds]);

  return (
    <MapContext
      value={{
        mapId,
        mapRef,
        mapConfig,
        updateMapConfig,
        saveMapConfig,
        mapName,
        setMapName,
        boundingBox,
        setBoundingBox,
        dirtyViewIds,
        views,
        deleteView,
        insertView,
        updateView,
        view,
        setViewId,
        viewConfig,
        updateViewConfig,
        zoom,
        setZoom,
        mapQuery: mapQuery,
        pinDropMode,
        setPinDropMode,
        ready,
        setReady,
        showControls,
        setShowControls,
      }}
    >
      {children}
    </MapContext>
  );
}
