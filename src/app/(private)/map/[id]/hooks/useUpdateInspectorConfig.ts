"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/services/trpc/react";
import { useDebouncedCallback } from "./useDebouncedCallback";
import { useMapId } from "./useMapCore";
import { useSetDirtyViewIds, useViewId } from "./useMapViews";
import type { RouterOutputs } from "@/services/trpc/react";

export type InspectorConfig =
  RouterOutputs["mapView"]["inspectorConfigs"][number];

export function useUpdateInspectorConfig() {
  const mapId = useMapId();
  const viewId = useViewId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const setDirtyViewIds = useSetDirtyViewIds();

  const queryKey = trpc.mapView.inspectorConfigs.queryKey({
    mapId: mapId || "",
    viewId: viewId || "",
  });

  const { mutate: mutateRaw } = useMutation(
    trpc.mapView.updateInspectorConfigs.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey });
        const prev = queryClient.getQueryData(queryKey);
        return { prev };
      },
      onError: (_err, _vars, context) => {
        if (context?.prev !== undefined) {
          queryClient.setQueryData(queryKey, context.prev);
        }
        toast.error("Failed to update inspector configuration");
      },
      onSuccess: () => {
        if (viewId) {
          setDirtyViewIds((ids) => ids.filter((id) => id !== viewId));
        }
      },
    }),
  );

  const debouncedMutate = useDebouncedCallback(() => {
    if (!mapId || !viewId) return;
    const configs = queryClient.getQueryData(queryKey) as
      | InspectorConfig[]
      | undefined;
    if (!configs) return;
    mutateRaw({ mapId, viewId, configs });
  }, 600);

  return useCallback(
    (updater: (current: InspectorConfig[]) => InspectorConfig[]) => {
      if (!mapId || !viewId) return;

      setDirtyViewIds((ids) =>
        ids.includes(viewId) ? ids : ids.concat([viewId]),
      );

      queryClient.setQueryData(queryKey, (old: InspectorConfig[] | undefined) =>
        updater(old ?? []),
      );

      debouncedMutate();
    },
    [mapId, viewId, setDirtyViewIds, queryClient, queryKey, debouncedMutate],
  );
}
