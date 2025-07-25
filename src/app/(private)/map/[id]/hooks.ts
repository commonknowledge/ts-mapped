import { useCallback, useRef, useState } from "react";
import { PlacedMarker, Turf } from "@/__generated__/types";
import {
  useDeletePlacedMarkerMutation,
  useDeleteTurfMutation,
  useUpsertPlacedMarkerMutation,
  useUpsertTurfMutation,
} from "./data";

export const usePlacedMarkers = (mapId: string | null) => {
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
    [_setPlacedMarkers],
  );

  const [deletePlacedMarkerMutation] = useDeletePlacedMarkerMutation();
  const [upsertPlacedMarkerMutation, { loading }] =
    useUpsertPlacedMarkerMutation();

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

    upsertPlacedMarkerMutation({
      variables: {
        id: newMarker.id,
        label: newMarker.label,
        notes: newMarker.notes,
        point: newMarker.point,
        mapId,
      },
    });
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
      ref.current.map((m) => (m.id === updatedMarker.id ? updatedMarker : m)),
    );
  };
  return {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    updatePlacedMarker,
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
    [_setTurfs],
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
        newTurfs.map((t) => (t.id === newTurf.id ? { ...t, id: newId } : t)),
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
      ref.current.map((t) => (t.id === updatedTurf.id ? updatedTurf : t)),
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
