"use client";

import { useQueries } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useTRPC } from "@/services/trpc/react";
import { useFolders, usePlacedMarkers, useTurfs } from "../hooks";
import { PublicMapContext } from "../view/[viewIdOrHost]/publish/context/PublicMapContext";
import type { Turf } from "@/__generated__/types";
import type { Feature } from "geojson";
import type { ReactNode } from "react";

export default function MarkerAndTurfProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapRef, mapId, mapQuery, mapConfig, view, setPinDropMode } =
    useContext(MapContext);
  const { publicMap } = useContext(PublicMapContext);
  /* State */

  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [selectedPlacedMarkerId, setSelectedPlacedMarkerId] = useState<
    string | null
  >(null);

  const [searchMarker, setSearchMarker] = useState<Feature | null>(null);

  /* GraphQL Data */
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

  const trpc = useTRPC();
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

  const {
    turfs,
    setTurfs,
    deleteTurf,
    insertTurf,
    updateTurf,
    loading: turfsLoading,
  } = useTurfs(mapId);

  useEffect(() => {
    if (mapQuery?.data?.folders) {
      setFolders(mapQuery?.data?.folders);
    }
    if (mapQuery?.data?.placedMarkers) {
      setPlacedMarkers(mapQuery?.data?.placedMarkers);
    }
    if (mapQuery?.data?.turfs) {
      setTurfs(mapQuery?.data.turfs);
    }
  }, [mapQuery, setFolders, setPlacedMarkers, setTurfs]);

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
    if (map) {
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
    }
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
        turfs,
        turfsLoading,
        selectedPlacedMarkerId,
        setSelectedPlacedMarkerId,
        deleteTurf,
        insertTurf,
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
