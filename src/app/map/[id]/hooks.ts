import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTRPC } from "@/services/trpc/react";
import type { Turf } from "@/server/models/Turf";

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
