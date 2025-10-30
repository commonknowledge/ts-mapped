"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  MapContext,
  createNewViewConfig,
} from "@/app/map/[id]/context/MapContext";
import { DEFAULT_ZOOM } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { useMapQuery } from "../hooks/useMapQuery";
import { useTableStore } from "../stores/useTableStore";
import { getNewLastPosition } from "../utils";
import type { BoundingBox } from "@/server/models/Area";
import "mapbox-gl/dist/mapbox-gl.css";
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
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ready, setReady] = useState(false);
  const [viewId, setViewId] = useState<string | null>(initialViewId || null);
  const [dirtyViewIds, setDirtyViewIds] = useState<string[]>([]);

  /* Server Data */
  const mapQuery = useMapQuery(mapId);
  const { data: mapData } = mapQuery;

  const viewsInitialized = useRef(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: createDefaultViewMutate } = useMutation(
    trpc.map.updateViews.mutationOptions(),
  );

  // Need to reset page when viewId changes as filters may have changed
  const setTablePage = useTableStore((s) => s.setTablePage);
  useEffect(() => {
    setTablePage(0);
  }, [viewId, setTablePage]);

  /* Views initialization: create view if none exist and ensure a view is selected */
  useEffect(() => {
    // Only initialize views once when data first loads (otherwise the selected view can change)
    if (viewsInitialized.current) return;
    if (!mapData?.views) return;

    viewsInitialized.current = true;

    if (mapData?.views && mapData.views.length > 0) {
      const nextView =
        mapData.views.find((v) => v.id === initialViewId) || mapData.views[0];
      setViewId(nextView.id);
    } else {
      const newView = {
        id: uuidv4(),
        name: "Default View",
        config: createNewViewConfig(),
        dataSourceViews: [],
        mapId: mapId,
        position: getNewLastPosition(mapData.views),
        createdAt: new Date(),
      };
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return { ...old, views: [...old.views, newView] };
      });
      setViewId(newView.id);
      // Save the default view to the server
      createDefaultViewMutate({ mapId, views: [newView] });
    }
  }, [
    initialViewId,
    mapData?.views,
    mapId,
    queryClient,
    trpc.map.byId,
    createDefaultViewMutate,
  ]);

  return (
    <MapContext
      value={{
        mapId,
        mapRef,
        boundingBox,
        setBoundingBox,
        viewId,
        setViewId,
        dirtyViewIds,
        setDirtyViewIds,
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
