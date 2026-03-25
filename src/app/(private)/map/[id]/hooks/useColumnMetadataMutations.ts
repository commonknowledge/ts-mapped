"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useTRPC } from "@/services/trpc/react";

export function useColumnMetadataMutations() {
  const trpc = useTRPC();
  const client = useQueryClient();
  const organisationId = useOrganisationId();

  const { mutate: patchColumnMetadata } = useMutation(
    trpc.dataSource.patchColumnMetadata.mutationOptions({
      onSuccess: (data, variables) => {
        client.setQueryData(
          trpc.dataSource.listReadable.queryKey({
            activeOrganisationId: organisationId ?? undefined,
          }),
          (old) =>
            old?.map((ds) =>
              ds.id === variables.dataSourceId
                ? { ...ds, columnMetadata: data.columnMetadata }
                : ds,
            ),
        );
      },
      onError: (error) => {
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  const { mutate: patchColumnMetadataOverride } = useMutation(
    trpc.dataSource.patchColumnMetadataOverride.mutationOptions({
      onSuccess: (data, variables) => {
        client.setQueryData(
          trpc.dataSource.listReadable.queryKey({
            activeOrganisationId: organisationId ?? undefined,
          }),
          (old) =>
            old?.map((ds) =>
              ds.id === variables.dataSourceId
                ? {
                    ...ds,
                    organisationOverride: {
                      ...(ds.organisationOverride ?? {
                        id: 0,
                        organisationId: organisationId ?? "",
                        dataSourceId: variables.dataSourceId,
                        inspectorColumns: [],
                      }),
                      columnMetadata: data.columnMetadata,
                    },
                  }
                : ds,
            ),
        );
      },
      onError: (error) => {
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  return { patchColumnMetadata, patchColumnMetadataOverride };
}
