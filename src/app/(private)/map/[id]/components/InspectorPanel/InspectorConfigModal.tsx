"use client";

import { GeneralSection } from "@/app/(private)/(dashboards)/superadmin/data-sources/[id]/components/GeneralSection";
import { InspectorConfigSection } from "@/app/(private)/(dashboards)/superadmin/data-sources/[id]/components/InspectorConfigSection";
import { useColumnMetadataMutations } from "@/app/(private)/hooks/useColumnMetadataMutations";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useDataSources } from "@/hooks/useDataSources";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import type { InspectorConfig } from "../../hooks/useUpdateInspectorConfig";

export function InspectorConfigModal({
  open,
  onOpenChange,
  config,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: InspectorConfig;
  onUpdate: (config: InspectorConfig) => void;
}) {
  const { getDataSourceById } = useDataSources();
  const organisationId = useOrganisationId();
  const { patchColumnMetadata, patchColumnMetadataOverride } =
    useColumnMetadataMutations();

  const dataSource = getDataSourceById(config.dataSourceId);

  if (!dataSource) return null;

  const isOwner = Boolean(
    organisationId && dataSource.organisationId === organisationId,
  );

  const handlePatchColumnMetadata = (
    column: string,
    patch: Parameters<typeof patchColumnMetadata>[0]["patch"],
  ) => {
    if (isOwner) {
      patchColumnMetadata({ dataSourceId: dataSource.id, column, patch });
    } else if (organisationId) {
      patchColumnMetadataOverride({
        organisationId,
        dataSourceId: dataSource.id,
        column,
        patch,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-full overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Inspector configuration</DialogTitle>
        </DialogHeader>
        <GeneralSection
          dataSourceName={dataSource.name}
          name={config.name ?? ""}
          icon={config.icon ?? ""}
          showDescription={false}
          headerDescription="Configure the title and icon shown."
          onChange={(patch) => onUpdate({ ...config, ...patch })}
        />
        <InspectorConfigSection
          dataSourceId={config.dataSourceId}
          columnDefs={dataSource.columnDefs}
          config={config}
          onChange={(patch) => onUpdate({ ...config, ...patch })}
          onPatchColumnMetadata={handlePatchColumnMetadata}
        />
      </DialogContent>
    </Dialog>
  );
}
