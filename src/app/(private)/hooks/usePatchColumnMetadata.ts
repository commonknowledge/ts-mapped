"use client";

import { useCallback } from "react";
import { useColumnMetadataMutations } from "@/app/(private)/hooks/useColumnMetadataMutations";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useDataSources } from "@/hooks/useDataSources";
import type { ColumnMetadata } from "@/models/DataSource";

/**
 * Saves column metadata the way the metadata dialog does: on the data
 * source if your organisation owns it, otherwise as your organisation's
 * override
 */
export function usePatchColumnMetadata(dataSourceId: string | undefined) {
  const { getDataSourceById } = useDataSources();
  const organisationId = useOrganisationId();
  const { patchColumnMetadata, patchColumnMetadataOverride } =
    useColumnMetadataMutations();
  const dataSource = getDataSourceById(dataSourceId);
  const isOwner = Boolean(
    organisationId && dataSource?.organisationId === organisationId,
  );

  const patch = useCallback(
    (column: string, changes: Partial<Omit<ColumnMetadata, "name">>) => {
      if (!dataSourceId) return;
      if (isOwner) {
        patchColumnMetadata({ dataSourceId, column, patch: changes });
      } else if (organisationId) {
        patchColumnMetadataOverride({
          organisationId,
          dataSourceId,
          column,
          patch: changes,
        });
      }
    },
    [
      dataSourceId,
      isOwner,
      organisationId,
      patchColumnMetadata,
      patchColumnMetadataOverride,
    ],
  );

  return { patch, isOwner, organisationId };
}
