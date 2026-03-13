import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDefaultStore } from "jotai";
import { useAtomValue, useSetAtom } from "jotai/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { organisationIdAtom } from "@/atoms/organisationAtoms";
import { ORGANISATION_COOKIE_NAME } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import type { Organisation } from "@/server/models/Organisation";

export function useOrganisations() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const organisationId = useAtomValue(organisationIdAtom, {
    store: getDefaultStore(),
  });
  const setAtom = useSetAtom(organisationIdAtom, {
    store: getDefaultStore(),
  });
  const setOrganisationId = useCallback(
    (id: string) => {
      document.cookie = `${ORGANISATION_COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}`;
      setAtom(id);
    },
    [setAtom],
  );

  const { data: organisations } = useQuery(
    trpc.organisation.list.queryOptions(),
  );

  const currentOrganisation = organisations?.find(
    (o) => o.id === organisationId,
  );

  const {
    mutate: updateOrganisation,
    isPending: isUpdating,
    error: updateError,
  } = useMutation(
    trpc.organisation.update.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.organisation.list.queryKey(),
        });

        const previousOrganisations = queryClient.getQueryData<Organisation[]>(
          trpc.organisation.list.queryKey(),
        );

        if (previousOrganisations && currentOrganisation) {
          queryClient.setQueryData<Organisation[]>(
            trpc.organisation.list.queryKey(),
            previousOrganisations.map((org) =>
              org.id === currentOrganisation.id
                ? { ...org, ...variables }
                : org,
            ),
          );
        }

        return { previousOrganisations };
      },
      onSuccess: () => {
        toast.success("Organisation settings updated!");
      },
      onError: (_error, _variables, context) => {
        // Rollback to previous value on error
        if (context?.previousOrganisations) {
          queryClient.setQueryData<Organisation[]>(
            trpc.organisation.list.queryKey(),
            context.previousOrganisations,
          );
        }
        toast.error("Failed to update organisation settings");
      },
      onSettled: () => {
        // Always refetch after error or success to ensure sync
        queryClient.invalidateQueries({
          queryKey: trpc.organisation.list.queryKey(),
        });
      },
    }),
  );

  return {
    organisations: organisations || [],
    organisationId,
    setOrganisationId,
    currentOrganisation,
    updateOrganisation,
    isUpdating,
    updateError,
  };
}
