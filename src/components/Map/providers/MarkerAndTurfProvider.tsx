"use client";

import { ReactNode, useContext, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { Turf } from "@/__generated__/types";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { useMarkerQueries } from "@/components/Map/data";
import { useFolders, usePlacedMarkers, useTurfs } from "@/components/Map/hooks";

export default function MarkerAndTurfProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapId, mapQuery, mapConfig, view } = useContext(MapContext);
  /* State */

  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);

  /* GraphQL Data */
  const markerQueries = useMarkerQueries({
    membersDataSourceId: mapConfig.membersDataSourceId,
    markerDataSourceIds: mapConfig.markerDataSourceIds,
    dataSourceViews: view?.dataSourceViews || [],
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
