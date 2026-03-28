import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useState } from "react";
import { DataSourceItem } from "@/components/DataSourceItem";
import { useDataSources } from "@/hooks/useDataSources";
import { type InspectorDataSourceConfig } from "@/models/MapView";
import { Button } from "@/shadcn/ui/button";
import { InspectorConfigModal } from "./InspectorConfigModal";

export function BoundaryConfigItem({
  boundaryConfig,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onClickRemove,
  onUpdate,
}: {
  boundaryConfig: InspectorDataSourceConfig;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClickRemove: () => void;
  onUpdate: (config: InspectorDataSourceConfig) => void;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(boundaryConfig.dataSourceId);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  if (!dataSource) {
    return (
      <div className="py-8 text-muted-foreground flex items-center justify-center">
        <p className="text-sm">Data source not found</p>
        <Button
          variant="ghost"
          className="text-xs font-normal text-muted-foreground hover:text-destructive"
          onClick={onClickRemove}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center gap-1 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          aria-label="Move up"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          aria-label="Move down"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClickRemove}
          aria-label="Remove"
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="text-left w-full"
          onClick={() => setIsConfigModalOpen(true)}
        >
          <DataSourceItem
            className="shadow-xs"
            density="compactPreview"
            showColumnPreview={true}
            columnPreviewVariant="pills"
            maxColumnPills={8}
            singleLineColumnPreview={false}
            hideTypeLabel={true}
            hidePublishedBadge={true}
            dataSource={dataSource}
          />
        </button>
        <InspectorConfigModal
          open={isConfigModalOpen}
          onOpenChange={setIsConfigModalOpen}
          boundaryConfig={boundaryConfig}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
}
