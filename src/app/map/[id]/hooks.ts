import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTRPC } from "@/services/trpc/react";
import { getNewLastPosition } from "./utils";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { Turf } from "@/server/models/Turf";

export const useFolders = (mapId: string | null) => {
  const [folders, setFolders] = useState<Folder[]>([]);

  const trpc = useTRPC();
  const { mutate: deleteFolderMutation } = useMutation(
    trpc.folder.delete.mutationOptions(),
  );

  /* Complex actions */
  const deleteFolder = useCallback(
    (id: string) => {
      if (!mapId) return;
      deleteFolderMutation({ folderId: id, mapId });
      const newFolders = folders.filter((m) => m.id !== id);
      setFolders(newFolders);
    },
    [deleteFolderMutation, folders, mapId],
  );

  const { mutate: upsertFolderMutation, isPending: upsertFolderLoading } =
    useMutation(trpc.folder.upsert.mutationOptions());

  const insertFolder = useCallback(
    (newFolder: Omit<Folder, "position" | "mapId">) => {
      if (!mapId) return;
      const newPosition = getNewLastPosition(folders);
      const positionedFolder = { ...newFolder, position: newPosition };

      const newFolders = [...folders, positionedFolder];
      setFolders(newFolders.map((f) => ({ ...f, mapId })));

      upsertFolderMutation({ ...positionedFolder, mapId });
    },
    [folders, mapId, upsertFolderMutation],
  );

  const updateFolder = useCallback(
    (updatedFolder: Omit<Folder, "mapId">) => {
      if (!mapId) return;

      upsertFolderMutation({ ...updatedFolder, mapId });

      setFolders(
        folders
          .map((f) => (f.id === updatedFolder.id ? updatedFolder : f))
          .map((f) => ({ ...f, mapId })),
      );
    },
    [folders, mapId, upsertFolderMutation],
  );

  return {
    folders,
    setFolders,
    deleteFolder,
    insertFolder,
    updateFolder,
    loading: upsertFolderLoading,
  };
};

export const usePlacedMarkers = (mapId: string | null) => {
  const ref = useRef<PlacedMarker[]>([]);
  const [placedMarkers, _setPlacedMarkers] = useState<PlacedMarker[]>([]);

  // Use a ref to keep track of dirty (unpersisted) markers, for immediate flagging
  const dirty = useRef<Record<string, PlacedMarker | null>>({});

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

  const trpc = useTRPC();
  const { mutate: deletePlacedMarkerMutation } = useMutation(
    trpc.placedMarker.delete.mutationOptions(),
  );
  const {
    mutate: upsertPlacedMarkerMutation,
    isPending: upsertPlacedMarkerLoading,
  } = useMutation(trpc.placedMarker.upsert.mutationOptions());

  /* Complex actions */
  const deletePlacedMarker = (id: string) => {
    if (!mapId) return;
    deletePlacedMarkerMutation({
      placedMarkerId: id,
      mapId,
    });
    const newMarkers = ref.current.filter((m) => m.id !== id);
    setPlacedMarkers(newMarkers);
  };

  const insertPlacedMarker = useCallback(
    (newMarker: Omit<PlacedMarker, "position" | "mapId">) => {
      if (!mapId) return;

      const newPosition = getNewLastPosition(ref.current);
      const positionedMarker = { ...newMarker, position: newPosition };

      const newMarkers = [...ref.current, positionedMarker];
      setPlacedMarkers(newMarkers.map((m) => ({ ...m, mapId })));

      upsertPlacedMarkerMutation({ ...positionedMarker, mapId });
    },
    [mapId, setPlacedMarkers, upsertPlacedMarkerMutation],
  );

  const updatePlacedMarker = useCallback(
    (placedMarker: Omit<PlacedMarker, "mapId">) => {
      if (!mapId) return;

      upsertPlacedMarkerMutation({ ...placedMarker, mapId });

      setPlacedMarkers(
        ref.current
          .map((m) => (m.id === placedMarker.id ? placedMarker : m))
          .map((m) => ({ ...m, mapId })),
      );
    },
    [mapId, setPlacedMarkers, upsertPlacedMarkerMutation],
  );

  /**
   * Two functions, preparePlacedMarkerUpdate and commitPlacedMarkerUpdates
   * to aggregate updates before sending them to the API. Originally
   * added for the drag-and-drop functionality of the marker sidebar.
   */
  const preparePlacedMarkerUpdate = useCallback(
    (placedMarker: PlacedMarker) => {
      setPlacedMarkers(
        ref.current.map((m) => (m.id === placedMarker.id ? placedMarker : m)),
      );
      dirty.current[placedMarker.id] = placedMarker;
    },
    [setPlacedMarkers],
  );

  const commitPlacedMarkerUpdates = useCallback(() => {
    if (!mapId) return;

    for (const placedMarker of Object.values(dirty.current)) {
      if (placedMarker) {
        upsertPlacedMarkerMutation({ ...placedMarker, mapId });
        dirty.current[placedMarker.id] = null;
      }
    }
  }, [mapId, upsertPlacedMarkerMutation]);

  return {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    preparePlacedMarkerUpdate,
    commitPlacedMarkerUpdates,
    updatePlacedMarker,
    loading: upsertPlacedMarkerLoading,
  };
};

export const useTurfs = (mapId: string | null) => {
  const trpc = useTRPC();
  const client = useQueryClient();

  const { mutate: deleteTurfMutation } = useMutation(
    trpc.turf.delete.mutationOptions({
      onSuccess: (_, { turfId }) => {
        if (!mapId) return;
        client.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
          if (!old) return old;
          return { ...old, turfs: old.turfs.filter((t) => t.id !== turfId) };
        });
      },
    }),
  );

  const { mutate: upsertTurfMutation, isPending: upsertTurfLoading } =
    useMutation(
      trpc.turf.upsert.mutationOptions({
        onSuccess: (res) => {
          if (!mapId) return;
          client.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
            if (!old) return old;
            if (old.turfs.find((t) => t.id === res.id)) {
              return {
                ...old,
                turfs: old.turfs.map((t) => (t.id === res.id ? res : t)),
              };
            }
            return { ...old, turfs: [...old.turfs, res] };
          });
        },
      }),
    );

  const deleteTurf = (id: string) => {
    if (!mapId) return;
    deleteTurfMutation({ turfId: id, mapId });
  };

  const insertTurf = async (newTurf: Omit<Turf, "mapId" | "id">) => {
    if (!mapId) return;
    upsertTurfMutation({ ...newTurf, mapId });
  };

  const updateTurf = (updatedTurf: Omit<Turf, "mapId">) => {
    if (!mapId) return;
    upsertTurfMutation({ ...updatedTurf, mapId });
  };

  return {
    deleteTurf,
    insertTurf,
    updateTurf,
    loading: upsertTurfLoading,
  };
};
