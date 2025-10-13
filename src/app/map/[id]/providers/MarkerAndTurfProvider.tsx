"use client";

import { useQueries } from "@tanstack/react-query";
import "mapbox-gl/dist/mapbox-gl.css";
import { useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useTRPC } from "@/services/trpc/react";
import { useFolders, usePlacedMarkers, useTurfs } from "../hooks";
import { useMapQuery } from "../hooks/useMapQuery";
import { PublicMapContext } from "../view/[viewIdOrHost]/publish/context/PublicMapContext";
import type { Turf } from "@/server/models/Turf";
import type { Feature } from "geojson";
import type { ReactNode } from "react";

export default function MarkerAndTurfProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapRef, mapId, setPinDropMode } = useContext(MapContext);
  const { mapConfig } = useMapConfig();
  const { view } = useMapViews();

  const trpc = useTRPC();
  const { data: map } = useMapQuery(mapId);
  const { publicMap } = useContext(PublicMapContext);
  /* State */

  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [selectedPlacedMarkerId, setSelectedPlacedMarkerId] = useState<
    string | null
  >(null);

  const [searchMarker, setSearchMarker] = useState<Feature | null>(null);

  const dataSourceIds = useMemo(() => {
    if (!publicMap) {
      return mapConfig.getDataSourceIds();
    }
    // If a public map is being displayed, don't fetch markers that aren't included
    return mapConfig
      .getDataSourceIds()
      .filter((id) =>
        publicMap.dataSourceConfigs.some((dsc) => dsc.dataSourceId === id),
      );
  }, [mapConfig, publicMap]);

  // Using the `combine` option in this useQueries call makes `markerQueries`
  // only update when the data updates. This prevents infinite loops
  // when `markerQueries` is used in useEffect hooks.
  const markerQueries = useQueries({
    queries: dataSourceIds.map((dataSourceId) => {
      const dsv = view?.dataSourceViews.find(
        (dsv) => dsv.dataSourceId === dataSourceId,
      );
      return trpc.dataRecord.markers.queryOptions(
        {
          dataSourceId,
          filter: dsv?.filter,
          search: dsv?.search,
        },
        { enabled: Boolean(dataSourceId) },
      );
    }),
    combine: (results) => {
      return {
        data: results.map((result, i) => ({
          dataSourceId: dataSourceIds[i],
          markers: result.data || [],
        })),
        isFetching: results.some((result) => result.isFetching),
      };
    },
  });

  /* Persisted map features */
  const {
    folders,
    loading: foldersLoading,
    setFolders,
    deleteFolder,
    insertFolder,
    updateFolder,
  } = useFolders(mapId);

  const {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    preparePlacedMarkerUpdate,
    commitPlacedMarkerUpdates,
    updatePlacedMarker,
    loading: placedMarkersLoading,
  } = usePlacedMarkers(mapId);

  const { deleteTurf, insertTurf, updateTurf, turfs, setTurfs } =
    useTurfs(mapId);

  useEffect(() => {
    if (map?.folders) {
      setFolders(map?.folders);
    }
    if (map?.placedMarkers) {
      setPlacedMarkers(map?.placedMarkers);
    }
    if (map?.turfs) {
      setTurfs(map?.turfs);
    }
  }, [map, setFolders, setPlacedMarkers, setTurfs]);

  const handleAddArea = () => {
    const map = mapRef?.current;
    if (map) {
      // Find the polygon draw button and click it
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon",
      ) as HTMLButtonElement;
      if (drawButton) {
        drawButton.click();
      }
    }
  };

  const handleDropPin = () => {
    const map = mapRef?.current;
    if (!map || !mapId) return;
    setPinDropMode(true);
    map.getCanvas().style.cursor = "crosshair";

    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      insertPlacedMarker({
        id: uuidv4(),
        label: `Dropped Pin (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`,
        notes: "",
        point: e.lngLat,
        folderId: null,
      });

      // Reset cursor
      map.getCanvas().style.cursor = "";
      map.off("click", clickHandler);

      setPinDropMode(false);

      // Fly to the new marker
      map.flyTo({
        center: e.lngLat,
        zoom: 14,
      });
    };

    map.once("click", clickHandler);
  };

  return (
    <MarkerAndTurfContext
      value={{
        editingTurf,
        setEditingTurf,
        folders,
        foldersLoading,
        deleteFolder,
        insertFolder,
        updateFolder,
        placedMarkers,
        placedMarkersLoading,
        deletePlacedMarker,
        insertPlacedMarker,
        preparePlacedMarkerUpdate,
        commitPlacedMarkerUpdates,
        updatePlacedMarker,
        selectedPlacedMarkerId,
        setSelectedPlacedMarkerId,
        deleteTurf,
        insertTurf,
        turfs,
        updateTurf,
        markerQueries,
        searchMarker,
        setSearchMarker,
        handleAddArea,
        handleDropPin,
      }}
    >
      {children}
    </MarkerAndTurfContext>
  );
}
