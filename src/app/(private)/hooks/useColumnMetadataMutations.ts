"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDataSourceListCache } from "@/app/(private)/hooks/useDataSourceListCache";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useTRPC } from "@/services/trpc/react";

export function useColumnMetadataMutations() {
  const trpc = useTRPC();
  const organisationId = useOrganisationId();
  const { updateDataSource } = useDataSourceListCache();

  const { mutate: patchColumnMetadata } = useMutation(
    trpc.dataSource.patchColumnMetadata.mutationOptions({
      onSuccess: (data, variables) => {
        updateDataSource(variables.dataSourceId, (ds) => ({
          ...ds,
          columnMetadata: data.columnMetadata,
        }));
      },
      onError: (error) => {
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  const { mutate: patchColumnMetadataOverride } = useMutation(
    trpc.dataSource.patchColumnMetadataOverride.mutationOptions({
      onSuccess: (data, variables) => {
        updateDataSource(variables.dataSourceId, (ds) => ({
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
        }));
      },
      onError: (error) => {
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  return { patchColumnMetadata, patchColumnMetadataOverride };
}
