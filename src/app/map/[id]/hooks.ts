import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTRPC } from "@/services/trpc/react";
import { getNewLastPosition } from "./utils";
import type { Folder } from "@/server/models/Folder";
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

export const useTurfs = (mapId: string | null) => {
  const trpc = useTRPC();
  const ref = useRef<Turf[]>([]);

  const [turfs, _setTurfs] = useState<Turf[]>([]);

  const setTurfs = useCallback(
    (turfs: Turf[]) => {
      ref.current = turfs;
      _setTurfs(turfs);
    },
    [_setTurfs],
  );

  const { mutate: deleteTurfMutation } = useMutation(
    trpc.turf.delete.mutationOptions({
      onSuccess: () => {
        if (!mapId) return;
      },
    }),
  );

  const { mutate: upsertTurfMutation, isPending: upsertTurfLoading } =
    useMutation(
      trpc.turf.upsert.mutationOptions({
        onSuccess: (res) => {
          if (!mapId) return;
          const existingTurf = ref.current.find((t) => t.id === res.id);
          if (!existingTurf) {
            const newTurfs = [...ref.current, res];
            setTurfs(newTurfs);
          }
        },
      }),
    );

  const deleteTurf = (id: string) => {
    if (!mapId) return;
    deleteTurfMutation({ turfId: id, mapId });
    const newTurfs = ref.current.filter((m) => m.id !== id);
    setTurfs(newTurfs);
  };

  const insertTurf = async (
    newTurf: Omit<Turf, "mapId" | "id" | "createdAt">,
  ) => {
    if (!mapId) return;
    upsertTurfMutation({ ...newTurf, mapId });
  };

  const updateTurf = (updatedTurf: Omit<Turf, "mapId">) => {
    if (!mapId) return;
    upsertTurfMutation({ ...updatedTurf, mapId });
    setTurfs(
      ref.current.map((t) =>
        t.id === updatedTurf.id ? { ...updatedTurf, mapId } : t,
      ),
    );
  };

  return {
    turfs,
    deleteTurf,
    insertTurf,
    setTurfs,
    updateTurf,
    loading: upsertTurfLoading,
  };
};
