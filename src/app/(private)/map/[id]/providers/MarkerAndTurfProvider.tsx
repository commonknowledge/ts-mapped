"use client";

import { ReactNode, useContext, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MarkerFolder, Turf } from "@/__generated__/types";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import {
  useMarkerQueries,
  useUpsertMarkerFolderMutation,
} from "@/app/(private)/map/[id]/data";
import { usePlacedMarkers, useTurfs } from "@/app/(private)/map/[id]/hooks";
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
  const [markerFolders, setMarkerFolders] = useState<MarkerFolder[]>([]);
  const [upsertMarkerFolder] = useUpsertMarkerFolderMutation();

  // Update folder references when marker IDs change (e.g., from temp to real ID)
  const updateFolderMarkerReferences = (oldId: string, newId: string) => {
    setMarkerFolders(
      markerFolders.map((folder) => {
        if (
          Array.isArray(folder.markerIds) &&
          folder.markerIds.includes(oldId)
        ) {
          const updatedFolder = {
            ...folder,
            markerIds: folder.markerIds.map((id) =>
              id === oldId ? newId : id
            ),
          };

          // Sync the updated folder to the database
          if (mapId) {
            upsertMarkerFolder({
              variables: {
                id: folder.id,
                name: folder.name,
                markerIds: updatedFolder.markerIds,
                isExpanded: folder.isExpanded,
                mapId,
              },
            }).catch((error: unknown) => {
              console.error(
                "Failed to sync folder after marker ID update:",
                error
              );
            });
          }

          return updatedFolder;
        }
        return folder;
      })
    );
  };

  /* GraphQL Data */
  const markerQueries = useMarkerQueries({
    membersDataSourceId: viewConfig.membersDataSourceId,
    markerDataSourceIds: viewConfig.markerDataSourceIds,
  });

  /* Persisted map features */
  const {
    turfs,
    setTurfs,
    deleteTurf,
    insertTurf,
    updateTurf,
    loading: turfsLoading,
  } = useTurfs(mapId);

  const {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    updatePlacedMarker,
    loading: placedMarkersLoading,
  } = usePlacedMarkers(mapId, updateFolderMarkerReferences);

  useEffect(() => {
    if (mapQuery?.data?.map?.placedMarkers) {
      setPlacedMarkers(mapQuery?.data?.map.placedMarkers);
    }
    if (mapQuery?.data?.map?.turfs) {
      setTurfs(mapQuery?.data.map.turfs);
    }
    // DISABLED: Only load markerFolders on initial load, not on every query update
    // This was causing flickering when markers were being processed
    // if (mapQuery?.data?.map?.markerFolders && markerFolders.length === 0) {
    //   setMarkerFolders(mapQuery?.data?.map.markerFolders);
    // }
  }, [mapQuery, setPlacedMarkers, setTurfs]);

  // Load initial markerFolders data only once
  useEffect(() => {
    if (mapQuery?.data?.map?.markerFolders && markerFolders.length === 0) {
      setMarkerFolders(mapQuery?.data?.map.markerFolders);
    }
  }, [mapQuery?.data?.map?.markerFolders, markerFolders.length]);

  const deleteMarkerFolder = (id: string) => {
    setMarkerFolders(markerFolders.filter((folder) => folder.id !== id));
  };

  const insertMarkerFolder = (markerFolder: MarkerFolder) => {
    setMarkerFolders([...markerFolders, markerFolder]);
  };

  const updateMarkerFolder = (markerFolder: MarkerFolder) => {
    setMarkerFolders(
      markerFolders.map((folder) =>
        folder.id === markerFolder.id ? markerFolder : folder
      )
    );
  };

  return (
    <MarkerAndTurfContext
      value={{
        editingTurf,
        setEditingTurf,
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
        markerFolders,
        markerFoldersLoading: false,
        deleteMarkerFolder,
        insertMarkerFolder,
        updateMarkerFolder,
        updateFolderMarkerReferences,
        markerQueries,
      }}
    >
      {children}
    </MarkerAndTurfContext>
  );
}
