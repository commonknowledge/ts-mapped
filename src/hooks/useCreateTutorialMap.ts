"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";

/** Makes a new, empty tutorial map and opens it in the light editor, where
 *  the guided tour starts */
export function useCreateTutorialMap() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { organisationId } = useOrganisations();

  const { mutate, isPending } = useMutation(
    trpc.map.createTutorial.mutationOptions({
      onSuccess: (map) => {
        queryClient.invalidateQueries(trpc.map.list.queryFilter());
        // The tutorial may have just made "Tutorial members": without a
        // refetch the pickers wouldn't list it, nor grey out the rest
        queryClient.invalidateQueries({ queryKey: trpc.dataSource.pathKey() });
        router.push(`/map/${map.id}/v3`);
      },
      onError: () => toast.error("Couldn't make a tutorial map"),
    }),
  );

  const createTutorialMap = () => {
    if (organisationId) mutate({ organisationId });
  };

  return { createTutorialMap, isCreating: isPending };
}
