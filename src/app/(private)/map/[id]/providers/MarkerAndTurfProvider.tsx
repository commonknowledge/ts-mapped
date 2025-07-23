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
    reorderMarkers,
    reorderFolders: serverReorderFolders,
    loading: placedMarkersLoading,
  } = usePlacedMarkers(mapId, updateFolderMarkerReferences);

  // Reorder function that syncs with server and updates state
  const reorderFolders = async (
    folderPositions: { id: string; position: number }[]
  ) => {
    // Sync with server first
    await serverReorderFolders(folderPositions);

    // The query refetch will update the state automatically
  };

  useEffect(() => {
    if (mapQuery?.data?.map?.placedMarkers) {
      setPlacedMarkers(mapQuery?.data?.map.placedMarkers);
    }
    if (mapQuery?.data?.map?.turfs) {
      setTurfs(mapQuery?.data.map.turfs);
    }
    if (mapQuery?.data?.map?.markerFolders) {
      setMarkerFolders(mapQuery?.data?.map.markerFolders);
    }
  }, [mapQuery?.data?.map, setPlacedMarkers, setTurfs]);

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
        reorderMarkers,
        reorderFolders,
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
