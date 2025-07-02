import { useState } from "react";
import { PlacedMarker, Turf } from "@/__generated__/types";
import {
  useDeletePlacedMarkerMutation,
  useDeleteTurfMutation,
  useUpsertPlacedMarkerMutation,
  useUpsertTurfMutation,
} from "./data";

export const usePlacedMarkers = (mapId: string) => {
  const [placedMarkers, setPlacedMarkers] = useState<PlacedMarker[]>([]);

  const [deletePlacedMarkerMutation] = useDeletePlacedMarkerMutation();
  const [upsertPlacedMarkerMutation, { loading }] =
    useUpsertPlacedMarkerMutation();

  /* Complex actions */
  const deletePlacedMarker = (id: string) => {
    deletePlacedMarkerMutation({
      variables: {
        id,
        mapId,
      },
    });
    const newMarkers = placedMarkers.filter((m) => m.id !== id);
    setPlacedMarkers(newMarkers);
  };

  const insertPlacedMarker = async (newMarker: PlacedMarker) => {
    const newMarkers = [...placedMarkers, newMarker];
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
        newMarkers.map((m) =>
          m.id === newMarker.id ? { ...m, id: newId } : m,
        ),
      );
    }
  };

  const updatePlacedMarker = (updatedMarker: PlacedMarker) => {
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
      placedMarkers.map((m) => (m.id === updatedMarker.id ? updatedMarker : m)),
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

export const useTurfs = (mapId: string) => {
  const [turfs, setTurfs] = useState<Turf[]>([]);

  const [deleteTurfMutation] = useDeleteTurfMutation();
  const [upsertTurfMutation, { loading }] = useUpsertTurfMutation();

  /* Complex actions */
  const deleteTurf = (id: string) => {
    deleteTurfMutation({
      variables: {
        id,
        mapId,
      },
    });
    const newTurfs = turfs.filter((m) => m.id !== id);
    setTurfs(newTurfs);
  };

  const insertTurf = async (newTurf: Turf) => {
    const newTurfs = [...turfs, newTurf];
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

    setTurfs(turfs.map((t) => (t.id === updatedTurf.id ? updatedTurf : t)));
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
