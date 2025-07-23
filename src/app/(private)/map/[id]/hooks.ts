import { useApolloClient } from "@apollo/client";
import { useCallback, useRef, useState } from "react";
import { PlacedMarker, Turf } from "@/__generated__/types";
import {
  useDeletePlacedMarkerMutation,
  useDeleteTurfMutation,
  useUpsertPlacedMarkerMutation,
  useUpsertTurfMutation,
  useUpdateFolderPositionsMutation,
  useUpdateMarkerPositionsMutation,
} from "./data";

export const usePlacedMarkers = (
  mapId: string | null,
  updateFolderMarkerReferences?: (oldId: string, newId: string) => void
) => {
  const client = useApolloClient();
  const ref = useRef<PlacedMarker[]>([]);
  const [placedMarkers, _setPlacedMarkers] = useState<PlacedMarker[]>([]);

  // Use a combination of ref and state, because Mapbox native components don't
  // update on state changes - ref is needed for them to update the latest state,
  // instead of the initial state.
  const setPlacedMarkers = useCallback(
    (markers: PlacedMarker[]) => {
      ref.current = markers;
      _setPlacedMarkers(markers);
    },
    [_setPlacedMarkers]
  );

  const [deletePlacedMarkerMutation] = useDeletePlacedMarkerMutation();
  const [upsertPlacedMarkerMutation, { loading }] =
    useUpsertPlacedMarkerMutation();
  const [updateMarkerPositionsMutation] = useUpdateMarkerPositionsMutation();
  const [updateFolderPositionsMutation] = useUpdateFolderPositionsMutation();

  /* Complex actions */
  const deletePlacedMarker = (id: string) => {
    if (!mapId) {
      return;
    }

    deletePlacedMarkerMutation({
      variables: {
        id,
        mapId,
      },
    });
    const newMarkers = ref.current.filter((m) => m.id !== id);
    setPlacedMarkers(newMarkers);
  };

  const insertPlacedMarker = async (newMarker: PlacedMarker) => {
    if (!mapId) {
      return;
    }

    const newMarkers = [...ref.current, newMarker];
    setPlacedMarkers(newMarkers);

    const { data } = await upsertPlacedMarkerMutation({
      variables: {
        label: newMarker.label,
        notes: newMarker.notes,
        point: newMarker.point,
        mapId,
      },
    });
    const newId = data?.upsertPlacedMarker?.result?.id;
    if (newId) {
      setPlacedMarkers(
        newMarkers.map((m) => (m.id === newMarker.id ? { ...m, id: newId } : m))
      );
      // Update folder references if the marker ID changed
      if (newId !== newMarker.id) {
        updateFolderMarkerReferences?.(newMarker.id, newId);
      }
    }
  };

  const updatePlacedMarker = (updatedMarker: PlacedMarker) => {
    if (!mapId) {
      return;
    }

    upsertPlacedMarkerMutation({
      variables: {
        id: updatedMarker.id,
        label: updatedMarker.label,
        notes: updatedMarker.notes,
        point: { lat: updatedMarker.point.lat, lng: updatedMarker.point.lng },
        mapId,
      },
    });

    setPlacedMarkers(
      ref.current.map((m) => (m.id === updatedMarker.id ? updatedMarker : m))
    );
  };

  const reorderMarkers = async (
    markerPositions: { id: string; position: number }[]
  ) => {
    if (!mapId) {
      return;
    }

    try {
      await updateMarkerPositionsMutation({
        variables: {
          mapId,
          markerPositions,
        },
      });

      // Update the local state to reflect the new order
      const updatedMarkers = ref.current.map((marker) => {
        const newPosition = markerPositions.find((p) => p.id === marker.id);
        return newPosition
          ? { ...marker, position: newPosition.position }
          : marker;
      });

      // Sort by position and update state
      const sortedMarkers = updatedMarkers.sort(
        (a, b) => a.position - b.position
      );
      setPlacedMarkers(sortedMarkers);

      // Invalidate the Apollo cache for the map query to ensure fresh data
      await client.refetchQueries({
        include: ["Map"],
      });
    } catch (error) {
      console.error("Failed to reorder markers:", error);
    }
  };

  const reorderFolders = async (
    folderPositions: { id: string; position: number }[]
  ) => {
    if (!mapId) {
      return;
    }

    try {
      await updateFolderPositionsMutation({
        variables: {
          mapId,
          folderPositions,
        },
      });

      // Refetch the map query to get updated data
      await client.refetchQueries({
        include: ["Map"],
      });
    } catch (error) {
      console.error("Failed to update folder positions:", error);
    }
  };

  return {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    updatePlacedMarker,
    reorderMarkers,
    reorderFolders,
    loading,
  };
};

export const useTurfs = (mapId: string | null) => {
  const ref = useRef<Turf[]>([]);
  const [turfs, _setTurfs] = useState<Turf[]>([]);

  // Use a combination of ref and state, because Mapbox native components don't
  // update on state changes - ref is needed for them to update the latest state,
  // instead of the initial state.
  const setTurfs = useCallback(
    (turfs: Turf[]) => {
      ref.current = turfs;
      _setTurfs(turfs);
    },
    [_setTurfs]
  );

  const [deleteTurfMutation] = useDeleteTurfMutation();
  const [upsertTurfMutation, { loading }] = useUpsertTurfMutation();

  /* Complex actions */
  const deleteTurf = (id: string) => {
    if (!mapId) {
      return;
    }

    deleteTurfMutation({
      variables: {
        id,
        mapId,
      },
    });
    const newTurfs = ref.current.filter((m) => m.id !== id);
    setTurfs(newTurfs);
  };

  const insertTurf = async (newTurf: Turf) => {
    if (!mapId) {
      return;
    }

    const newTurfs = [...ref.current, newTurf];
    setTurfs(newTurfs);

    const { data } = await upsertTurfMutation({
      variables: {
        label: newTurf.label,
        notes: newTurf.notes,
        geometry: newTurf.geometry,
        createdAt: newTurf.createdAt,
        area: newTurf.area,
        mapId,
      },
    });
    const newId = data?.upsertTurf?.result?.id;
    if (newId) {
      setTurfs(
        newTurfs.map((t) => (t.id === newTurf.id ? { ...t, id: newId } : t))
      );
    }
  };

  const updateTurf = (updatedTurf: Turf) => {
    if (!mapId) {
      return;
    }

    upsertTurfMutation({
      variables: {
        id: updatedTurf.id,
        label: updatedTurf.label,
        notes: updatedTurf.notes,
        geometry: updatedTurf.geometry,
        createdAt: updatedTurf.createdAt,
        area: updatedTurf.area,
        mapId,
      },
    });

    setTurfs(
      ref.current.map((t) => (t.id === updatedTurf.id ? updatedTurf : t))
    );
  };

  return {
    turfs,
    setTurfs,
    deleteTurf,
    insertTurf,
    updateTurf,
    loading,
  };
};
