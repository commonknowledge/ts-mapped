"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapRef } from "react-map-gl/mapbox";
import { v4 as uuidv4 } from "uuid";
import { BoundingBoxInput } from "@/__generated__/types";
import {
  MapConfig,
  MapContext,
  ViewConfig,
} from "@/components/Map/context/MapContext";
import { useMapQuery, useUpdateMapConfigMutation } from "@/components/Map/data";
import { DEFAULT_ZOOM } from "@/constants";
import { View } from "../types";
import { getNewLastPosition } from "../utils";

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

  /* GraphQL Data */
  const mapQuery = useMapQuery(mapId);

  const updateMapConfig = (nextMapConfig: Partial<MapConfig>) => {
    setMapConfig(new MapConfig({ ...mapConfig, ...nextMapConfig }));
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

  const deleteView = (viewId: string) => {
    setViews(views.filter((v) => v.id !== viewId));
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
      const nextView =
        mapData.map.views.find((v) => v.id === initialViewId) ||
        mapData.map.views[0];
      setViewId(nextView.id);
      setViews(mapData.map.views);
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
        mapQuery,
        pinDropMode,
        setPinDropMode,
        showControls,
        setShowControls,
      }}
    >
      {children}
    </MapContext>
  );
}
