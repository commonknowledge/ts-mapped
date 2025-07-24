import { useCallback, useRef, useState } from "react";
import { Folder, PlacedMarker, Turf } from "@/__generated__/types";
import { getNewLastPosition } from "./components/controls/layers/MarkersControl/utils";
import {
  useDeleteFolderMutation,
  useDeletePlacedMarkerMutation,
  useDeleteTurfMutation,
  useUpsertFolderMutation,
  useUpsertPlacedMarkerMutation,
  useUpsertTurfMutation,
} from "./data";

export const useFolders = (mapId: string | null) => {
  const ref = useRef<Folder[]>([]);
  const [folders, _setFolders] = useState<Folder[]>([]);

  // Use a combination of ref and state, because Mapbox native components don't
  // update on state changes - ref is needed for them to update the latest state,
  // instead of the initial state.
  const setFolders = useCallback(
    (folders: Folder[]) => {
      ref.current = folders;
      _setFolders(folders);
    },
    [_setFolders],
  );

  const [deleteFolderMutation] = useDeleteFolderMutation();
  const [upsertFolderMutation, { loading }] = useUpsertFolderMutation();

  /* Complex actions */
  const deleteFolder = (id: string) => {
    if (!mapId) {
      return;
    }

    deleteFolderMutation({
      variables: {
        id,
        mapId,
      },
    });
    const newFolders = ref.current.filter((m) => m.id !== id);
    setFolders(newFolders);
  };

  const insertFolder = async (newFolder: Folder) => {
    if (!mapId) {
      return;
    }

    const newFolders = [...ref.current, newFolder];
    setFolders(newFolders);

    upsertFolderMutation({
      variables: {
        ...newFolder,
        mapId,
      },
    });
  };

  const updateFolder = (updatedFolder: Folder) => {
    if (!mapId) {
      return;
    }

    upsertFolderMutation({
      variables: {
        ...updatedFolder,
        mapId,
      },
    });

    setFolders(
      ref.current.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)),
    );
  };
  return {
    folders,
    setFolders,
    deleteFolder,
    insertFolder,
    updateFolder,
    loading,
  };
};

export const usePlacedMarkers = (mapId: string | null) => {
  const ref = useRef<PlacedMarker[]>([]);
  const [placedMarkers, _setPlacedMarkers] = useState<PlacedMarker[]>([]);

  // Use a ref to keep track of dirty (unpersisted) markers, for immediate flagging
  const dirty = useRef<Record<string, boolean>>({});

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

  const insertPlacedMarker = useCallback(
    (newMarker: Omit<PlacedMarker, "position">) => {
      if (!mapId) {
        return;
      }

      const newPosition = getNewLastPosition(ref.current);
      const positionedMarker = { ...newMarker, position: newPosition };

      const newMarkers = [...ref.current, positionedMarker];
      setPlacedMarkers(newMarkers);

      upsertPlacedMarkerMutation({
        variables: {
          ...positionedMarker,
          mapId,
        },
      });
    },
    [mapId, setPlacedMarkers, upsertPlacedMarkerMutation],
  );

  const updatePlacedMarker = useCallback(
    (placedMarker: PlacedMarker) => {
      if (!mapId) {
        return;
      }

      upsertPlacedMarkerMutation({
        variables: {
          ...placedMarker,
          mapId,
        },
      });

      setPlacedMarkers(
        ref.current.map((m) => (m.id === placedMarker.id ? placedMarker : m)),
      );
    },
    [mapId, setPlacedMarkers, upsertPlacedMarkerMutation],
  );

  /**
   * Split marker updates into two parts: prepare and commit
   * Uses the `dirty` ref to keep track of if a marker has been changed
   * but not saved.
   */
  const preparedUpdatePlacedMarker = useCallback(
    (placedMarker: PlacedMarker, stage: "prepare" | "commit") => {
      if (!mapId) {
        return;
      }

      if (stage === "prepare") {
        setPlacedMarkers(
          ref.current.map((m) => (m.id === placedMarker.id ? placedMarker : m)),
        );
        dirty.current[placedMarker.id] = true;
      } else if (dirty.current[placedMarker.id]) {
        upsertPlacedMarkerMutation({
          variables: {
            ...placedMarker,
            mapId,
          },
        })
        dirty.current[placedMarker.id] = false
      }
    },
    [mapId, setPlacedMarkers, upsertPlacedMarkerMutation],
  );

  return {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    preparedUpdatePlacedMarker,
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
