import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTRPC } from "@/services/trpc/react";

export function useMapQuery() {
  const trpc = useTRPC();
  const { id: mapId } = useParams<{ id: string }>();
  return useQuery(trpc.map.byId.queryOptions({ mapId }));
}
