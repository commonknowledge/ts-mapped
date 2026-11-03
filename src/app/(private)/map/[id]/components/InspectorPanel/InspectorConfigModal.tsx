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
import InspectorAutoScan from "./InspectorAutoScan";
import RecordNameColumnSelect from "./RecordNameColumnSelect";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-full overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Inspector configuration</DialogTitle>
        </DialogHeader>
        <InspectorConfigEditor config={config} onUpdate={onUpdate} />
      </DialogContent>
    </Dialog>
  );
}

/** The title, icon and column settings for one inspector section; used by
 *  the modal and the light editor's inspector edit panel */
export function InspectorConfigEditor({
  config,
  onUpdate,
  compact = false,
}: {
  config: InspectorConfig;
  onUpdate: (config: InspectorConfig) => void;
  /** Stacked, for the light editor's narrow flyout */
  compact?: boolean;
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

  const autoScan = (
    <InspectorAutoScan
      config={config}
      onUpdate={onUpdate}
      onPatchColumnMetadata={handlePatchColumnMetadata}
      compact={compact}
    />
  );

  return (
    <>
      <GeneralSection
        dataSourceName={dataSource.name}
        name={config.name ?? ""}
        icon={config.icon ?? ""}
        showDescription={false}
        headerDescription="Configure the title and icon shown."
        compact={compact}
        onChange={(patch) => onUpdate({ ...config, ...patch })}
      />
      <div className={compact ? "" : "mb-6"}>
        <RecordNameColumnSelect
          dataSourceId={config.dataSourceId}
          compact={compact}
        />
      </div>
      {!compact && autoScan}
      <InspectorConfigSection
        dataSourceId={config.dataSourceId}
        columnDefs={dataSource.columnDefs}
        config={config}
        onChange={(patch) => onUpdate({ ...config, ...patch })}
        onPatchColumnMetadata={handlePatchColumnMetadata}
        compact={compact}
        columnsHeader={autoScan}
      />
    </>
  );
}
