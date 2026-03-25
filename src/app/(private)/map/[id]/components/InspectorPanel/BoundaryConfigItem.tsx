import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataSourceItem } from "@/components/DataSourceItem";
import { getDataSourceType } from "@/components/DataSourceItem";
import { type InspectorDataSourceConfig } from "@/models/MapView";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { MultiSelect } from "@/shadcn/ui/multi-select";
import { useDataSources } from "../../hooks/useDataSources";
import DataSourceSelectButton from "../DataSourceSelectButton";
import { DataSourceSelectModal } from "../DataSourceSelectButton";

export function BoundaryConfigItem({
  boundaryConfig,
  index,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onClickRemove,
  onUpdate,
}: {
  boundaryConfig: InspectorDataSourceConfig;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClickRemove: () => void;
  onUpdate: (config: InspectorDataSourceConfig) => void;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(boundaryConfig.dataSourceId);
  const [configName, setConfigName] = useState(boundaryConfig.name || "");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    boundaryConfig.columns || [],
  );
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [movementMeta, setMovementMeta] = useState<{
    title?: string;
    icon?: string;
    description?: string;
  } | null>(null);

  const dataSourceType = dataSource ? getDataSourceType(dataSource) : null;
  const isMovementLibrary = Boolean(dataSource?.public);

  const columnOptions = useMemo(() => {
    if (!dataSource) return [];
    return dataSource.columnDefs.map((col) => ({
      value: col.name,
      label: col.name,
    }));
  }, [dataSource]);

  useEffect(() => {
    let cancelled = false;
    if (!dataSource?.public) {
      setMovementMeta(null);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/data-source-previews/${dataSource.id}/meta`, {
          method: "GET",
        });
        if (!res.ok) {
          if (!cancelled) setMovementMeta(null);
          return;
        }
        const meta = (await res.json()) as {
          title?: string;
          icon?: string;
          description?: string;
        };
        if (!cancelled) {
          setMovementMeta({
            title: meta.title,
            icon: meta.icon,
            description: meta.description,
          });
        }
      } catch {
        if (!cancelled) setMovementMeta(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataSource?.id, dataSource?.public]);

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

  const handleNameChange = (newName: string) => {
    setConfigName(newName);
    onUpdate({
      ...boundaryConfig,
      name: newName,
    });
  };

  const handleColumnsChange = (newColumns: string[]) => {
    setSelectedColumns(newColumns);
    onUpdate({
      ...boundaryConfig,
      columns: newColumns,
    });
  };

  const handleDataSourceIdChange = (dataSourceId: string) => {
    const newDataSource = getDataSourceById(dataSourceId);
    const newName = newDataSource?.name ?? configName;

    setConfigName(newName || "");
    setSelectedColumns([]);
    onUpdate({
      ...boundaryConfig,
      dataSourceId,
      columns: [],
      name: newName,
    });
  };

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

      <div className={isMovementLibrary ? "min-w-0 flex-1" : "min-w-0 flex-1 border rounded-lg p-3"}>
        {isMovementLibrary ? (
          <>
            <button
              type="button"
              className="text-left w-full"
              onClick={() => setIsSelectModalOpen(true)}
            >
              <DataSourceItem
                className="shadow-xs"
                density="compactPreview"
                previewImageUrl={`/data-source-previews/${dataSource.id}.jpg`}
                showColumnPreview={true}
                columnPreviewVariant="pills"
                maxColumnPills={8}
                singleLineColumnPreview={false}
                overrideTitle={movementMeta?.title}
                overrideIconName={movementMeta?.icon}
                overrideDescription={movementMeta?.description}
                hideTypeLabel={true}
                hidePublishedBadge={true}
                dataSource={
                  {
                    ...dataSource,
                    movementLibraryDescription: movementMeta?.description,
                  } as typeof dataSource & {
                    movementLibraryDescription?: string;
                  }
                }
              />
            </button>
            <DataSourceSelectModal
              isModalOpen={isSelectModalOpen}
              setIsModalOpen={setIsSelectModalOpen}
              onSelect={(dataSourceId) => {
                setIsSelectModalOpen(false);
                handleDataSourceIdChange(dataSourceId);
              }}
              title="Select data source for inspector"
            />
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <DataSourceSelectButton
              className="w-full"
              dataSource={dataSource}
              onSelect={(dataSourceId) =>
                handleDataSourceIdChange(dataSourceId)
              }
              modalTitle="Select data source for inspector"
            />

            <div className="space-y-1.5">
              <Label
                htmlFor={`config-name-${index}`}
                className="text-xs text-muted-foreground"
              >
                Name
              </Label>
              <Input
                id={`config-name-${index}`}
                value={configName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Main Data"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Columns</Label>
              <MultiSelect
                options={columnOptions}
                selected={selectedColumns}
                onChange={handleColumnsChange}
                placeholder="Select columns..."
                className="text-sm [&>div]:px-2.5 [&>div]:py-1.5"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
