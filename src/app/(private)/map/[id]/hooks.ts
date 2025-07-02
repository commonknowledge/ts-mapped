import { useState } from "react";
import { PlacedMarker } from "@/__generated__/types";
import {
  useDeletePlacedMarkerMutation,
  useUpsertPlacedMarkerMutation,
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
