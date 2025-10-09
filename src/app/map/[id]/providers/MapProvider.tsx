"use client";

import { useMutation } from "@tanstack/react-query";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { MapContext, ViewConfig } from "@/app/map/[id]/context/MapContext";
import { DEFAULT_ZOOM } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { useMapQuery } from "../hooks/useMapQuery";
import { getNewLastPosition } from "../utils";
import type { View } from "../types";
import type { BoundingBox } from "@/server/models/Area";
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

  /* Map State */
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  const [dirtyViewIds, setDirtyViewIds] = useState<string[]>([]);
  const [configDirty, setConfigDirty] = useState(false);
  const [views, setViews] = useState<View[]>([]);
  const [viewId, setViewId] = useState<string | null>(initialViewId || null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ready, setReady] = useState(false);

  /* Server Data */
  const trpc = useTRPC();
  const mapQuery = useMapQuery(mapId);

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

  const { mutate: deleteViewMutate } = useMutation(
    trpc.mapView.delete.mutationOptions({
      onSuccess: () => {
        toast.success("View deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete view");
      },
    }),
  );
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

  const { mutate: saveViewsMutate } = useMutation(
    trpc.map.updateViews.mutationOptions({
      onSuccess: () => {
        setDirtyViewIds([]);
      },
    }),
  );

  const saveViews = useCallback(() => {
    if (!mapId) return;
    saveViewsMutate({ mapId, views });
  }, [saveViewsMutate, mapId, views]);

  /* Effects */

  /* Update local map state when saved views are loaded from the server */
  const { data: mapData } = mapQuery;

  const { mutate: saveConfigMutate } = useMutation(
    trpc.map.updateConfig.mutationOptions({
      onSuccess: () => {
        setConfigDirty(false);
      },
    }),
  );

  const saveConfig = useCallback(() => {
    if (!mapId || !mapData?.config) return;
    saveConfigMutate({ mapId, config: mapData.config });
  }, [saveConfigMutate, mapId, mapData?.config]);
  const viewsInitialized = useRef(false);

  useEffect(() => {
    // Only initialize views once when data first loads
    if (viewsInitialized.current) return;
    if (!mapData) return;

    viewsInitialized.current = true;

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
        mapId: mapId,
        createdAt: new Date(),
        position: 0,
      };
      setViewId(newView.id);
      setViews([newView]);
    }
  }, [initialViewId, mapData, mapId]);

  const viewConfig = useMemo(() => {
    return new ViewConfig({ ...view?.config });
  }, [view]);

  // auto save map views when dirty
  useEffect(() => {
    if (!dirtyViewIds?.length) return;

    const handler = setTimeout(() => {
      saveViews();
    }, 1000); // debounce 1s

    return () => {
      clearTimeout(handler);
    };
  }, [dirtyViewIds, saveViews]);

  // auto save map config when dirty
  useEffect(() => {
    if (!configDirty) return;

    const handler = setTimeout(() => {
      saveConfig();
    }, 1000); // debounce 1s

    return () => {
      clearTimeout(handler);
    };
  }, [configDirty, saveConfig]);

  return (
    <MapContext
      value={{
        mapId,
        mapRef,
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
        configDirty,
        setConfigDirty,
        zoom,
        setZoom,
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
