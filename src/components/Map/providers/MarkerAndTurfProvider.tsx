"use client";

import { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { Turf } from "@/__generated__/types";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { useMarkerQueries } from "@/components/Map/data";
import { useFolders, usePlacedMarkers, useTurfs } from "@/components/Map/hooks";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";

export default function MarkerAndTurfProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapId, mapQuery, mapConfig, view } = useContext(MapContext);
  const { publicMap } = useContext(PublicMapContext);
  /* State */

  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [selectedPlacedMarkerId, setSelectedPlacedMarkerId] = useState<
    string | null
  >(null);

  /* GraphQL Data */
  const { membersDataSourceId, markerDataSourceIds } = useMemo(() => {
    let membersDataSourceId = mapConfig.membersDataSourceId;
    let markerDataSourceIds = mapConfig.markerDataSourceIds;

    // If a public map is being displayed, don't fetch markers that aren't included
    if (publicMap) {
      if (
        !publicMap.dataSourceConfigs.some(
          (dsc) => dsc.dataSourceId === membersDataSourceId,
        )
      ) {
        membersDataSourceId = "";
      }
      markerDataSourceIds = markerDataSourceIds.filter((id) =>
        publicMap.dataSourceConfigs.some((dsc) => dsc.dataSourceId === id),
      );
    }

    return { membersDataSourceId, markerDataSourceIds };
  }, [mapConfig.markerDataSourceIds, mapConfig.membersDataSourceId, publicMap]);

  const markerQueries = useMarkerQueries({
    membersDataSourceId,
    markerDataSourceIds,
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
        selectedPlacedMarkerId,
        setSelectedPlacedMarkerId,
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
