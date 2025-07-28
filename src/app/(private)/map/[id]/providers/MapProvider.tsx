"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapRef } from "react-map-gl/mapbox";
import { BoundingBoxInput } from "@/__generated__/types";
import {
  MapConfig,
  MapContext,
  ViewConfig,
} from "@/app/(private)/map/[id]/context/MapContext";
import {
  useMapQuery,
  useUpdateMapConfigMutation,
} from "@/app/(private)/map/[id]/data";
import { DEFAULT_ZOOM } from "@/constants";
import { View } from "../types";

export default function MapProvider({
  children,
  mapId,
}: {
  children: ReactNode;
  mapId: string;
}) {
  /* Map Ref */
  const mapRef = useRef<MapRef>(null);
  const [mapName, setMapName] = useState<string | null>(null);

  /* Map State */

  const [boundingBox, setBoundingBox] = useState<BoundingBoxInput | null>(null);
  const [mapConfig, setMapConfig] = useState(new MapConfig());
  const [dirtyViewIds, setDirtyViewIds] = useState<string[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [viewId, setViewId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  /* GraphQL Data */
  const mapQuery = useMapQuery(mapId);

  const updateMapConfig = (nextMapConfig: Partial<MapConfig>) => {
    setMapConfig(new MapConfig({ ...mapConfig, ...nextMapConfig }));
  };

  const updateViewConfig = (nextViewConfig: Partial<ViewConfig>) => {
    const view = views.find((v) => v.id === viewId);
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

  const deleteView = (viewId: string) => {
    setViews(views.filter((v) => v.id !== viewId));
  };

  const insertView = (view: View) => {
    setViews([...views, view]);
    setDirtyViewIds([...dirtyViewIds, view.id]);
  };

  const updateView = (view: View) => {
    setViews(views.map((v) => (v.id === view.id ? view : v)));
    setDirtyViewIds([...dirtyViewIds, view.id]);
  };

  const [_saveMapConfig] = useUpdateMapConfigMutation();
  const saveMapConfig = async () => {
    await _saveMapConfig({ variables: { mapId, mapConfig, views } });
    setDirtyViewIds([]);
  };

  /* Effects */

  /* Update local map state when saved views are loaded from the server */
  const { data: mapData } = mapQuery;

  useEffect(() => {
    setMapName(mapData?.map?.name || "Untitled");

    if (mapData?.map?.config) {
      setMapConfig(new MapConfig(mapData.map.config));
    }

    if (mapData?.map?.views && mapData.map.views.length > 0) {
      const nextView = mapData.map.views[0];
      const nextViewId = nextView.id;
      setViewId(nextViewId);
      setViews(mapData.map.views || []);
    }
  }, [mapData]);

  const viewConfig = useMemo(() => {
    const savedConfig = views.find((v) => v.id === viewId)?.config || {};
    return new ViewConfig({ ...savedConfig });
  }, [viewId, views]);

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
        viewId,
        setViewId,
        viewConfig,
        updateViewConfig,
        zoom,
        setZoom,
        mapQuery,
      }}
    >
      {children}
    </MapContext>
  );
}
