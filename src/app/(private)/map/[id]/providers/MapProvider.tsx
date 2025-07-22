"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapRef } from "react-map-gl/mapbox";
import { BoundingBoxInput } from "@/__generated__/types";
import {
  MapConfig,
  MapContext,
  ViewConfig,
} from "@/app/(private)/map/[id]/context/MapContext";
import { useMapQuery } from "@/app/(private)/map/[id]/data";
import { DEFAULT_ZOOM } from "@/constants";

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
  const [viewConfig, setViewConfig] = useState(new ViewConfig());
  const [viewId, setViewId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  /* GraphQL Data */
  const mapQuery = useMapQuery(mapId);

  const updateMapConfig = (nextMapConfig: Partial<MapConfig>) => {
    setMapConfig(new MapConfig({ ...mapConfig, ...nextMapConfig }));
  };

  const updateViewConfig = (nextViewConfig: Partial<ViewConfig>) => {
    setViewConfig(new ViewConfig({ ...viewConfig, ...nextViewConfig }));
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
      setViewConfig(new ViewConfig(nextView.config));
    }
  }, [mapData]);

  return (
    <MapContext
      value={{
        mapId,
        mapRef,
        mapConfig,
        updateMapConfig,
        mapName,
        setMapName,
        boundingBox,
        setBoundingBox,
        viewConfig,
        updateViewConfig,
        viewId,
        setViewId,
        zoom,
        setZoom,
        mapQuery,
      }}
    >
      {children}
    </MapContext>
  );
}
