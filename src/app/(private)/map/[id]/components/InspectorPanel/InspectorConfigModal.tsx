"use client";

import { DefaultInspectorConfigSection } from "@/app/(private)/(dashboards)/superadmin/data-sources/[id]/components/DefaultInspectorConfigSection";
import { GeneralSection } from "@/app/(private)/(dashboards)/superadmin/data-sources/[id]/components/GeneralSection";
import { useDataSources } from "@/hooks/useDataSources";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import type { InspectorDataSourceConfig } from "@/models/MapView";

export function InspectorConfigModal({
  open,
  onOpenChange,
  boundaryConfig,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boundaryConfig: InspectorDataSourceConfig;
  onUpdate: (config: InspectorDataSourceConfig) => void;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(boundaryConfig.dataSourceId);

  if (!dataSource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-full overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Inspector configuration</DialogTitle>
        </DialogHeader>
        <GeneralSection
          dataSourceName={dataSource.name}
          name={boundaryConfig.name ?? ""}
          description={boundaryConfig.description ?? ""}
          icon={boundaryConfig.icon ?? ""}
          disabled={false}
          showDescription={false}
          headerDescription="Configure the title and icon shown."
          onChange={(patch) => onUpdate({ ...boundaryConfig, ...patch })}
        />
        <DefaultInspectorConfigSection
          dataSourceId={boundaryConfig.dataSourceId}
          columnDefs={dataSource.columnDefs}
          config={boundaryConfig}
          onChange={(patch) => onUpdate({ ...boundaryConfig, ...patch })}
        />
      </DialogContent>
    </Dialog>
  );
}
