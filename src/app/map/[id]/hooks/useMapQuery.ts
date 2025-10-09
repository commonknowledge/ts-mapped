import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/services/trpc/react";

export function useMapQuery(mapId: string | null | undefined) {
  const trpc = useTRPC();
  return useQuery(
    trpc.map.byId.queryOptions(
      { mapId: mapId || "" },
      { enabled: Boolean(mapId), refetchOnMount: "always" },
    ),
  );
}
