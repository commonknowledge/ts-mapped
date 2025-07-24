"use client";

import { ReactNode, useContext, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { Turf } from "@/__generated__/types";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { useMarkerQueries } from "@/app/(private)/map/[id]/data";
import {
  useFolders,
  usePlacedMarkers,
  useTurfs,
} from "@/app/(private)/map/[id]/hooks";
import { MarkerData } from "@/types";

export default function MarkerAndTurfProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapId, mapQuery, viewConfig } = useContext(MapContext);
  /* State */

  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  /* GraphQL Data */
  const markerQueries = useMarkerQueries({
    membersDataSourceId: viewConfig.membersDataSourceId,
    markerDataSourceIds: viewConfig.markerDataSourceIds,
  });

  /* Persisted map features */
  const { folders, setFolders, deleteFolder, insertFolder, updateFolder } =
    useFolders(mapId);

  const {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
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
    if (mapQuery?.data?.map?.folders) {
      setFolders(mapQuery?.data?.map.folders);
    }
    if (mapQuery?.data?.map?.placedMarkers) {
      setPlacedMarkers(mapQuery?.data?.map.placedMarkers);
    }
    if (mapQuery?.data?.map?.turfs) {
      setTurfs(mapQuery?.data.map.turfs);
    }
  }, [mapQuery, setFolders, setPlacedMarkers, setTurfs]);

  return (
    <MarkerAndTurfContext
      value={{
        editingTurf,
        setEditingTurf,
        folders,
        deleteFolder,
        insertFolder,
        updateFolder,
        placedMarkers,
        placedMarkersLoading,
        deletePlacedMarker,
        insertPlacedMarker,
        updatePlacedMarker,
        selectedMarker,
        setSelectedMarker,
        turfs,
        turfsLoading,
        deleteTurf,
        insertTurf,
        updateTurf,
        markerQueries,
      }}
    >
      {children}
    </MarkerAndTurfContext>
  );
}
