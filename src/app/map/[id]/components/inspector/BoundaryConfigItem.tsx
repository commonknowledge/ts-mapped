import { Database, X } from "lucide-react";
import { useMemo, useState } from "react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import {
  type InspectorBoundaryConfig,
  InspectorBoundaryConfigType,
  inspectorBoundaryTypes,
} from "@/server/models/MapView";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { MultiSelect } from "@/shadcn/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useDataSources } from "../../hooks/useDataSources";
import DataSourceSelectButton from "../DataSourceSelectButton";
import TogglePanel from "../TogglePanel";
import type { AreaSetCode } from "@/server/models/AreaSet";

export function BoundaryConfigItem({
  areaSetCode,
  boundaryConfig,
  index,
  onClickRemove,
  onUpdate,
}: {
  areaSetCode: AreaSetCode | null | undefined;
  boundaryConfig: InspectorBoundaryConfig;
  index: number;
  onClickRemove: () => void;
  onUpdate: (config: InspectorBoundaryConfig) => void;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(boundaryConfig.dataSourceId);
  const [configName, setConfigName] = useState(boundaryConfig.name || "");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    boundaryConfig.columns || [],
  );

  const dataSourceType = dataSource ? getDataSourceType(dataSource) : null;

  const columnOptions = useMemo(() => {
    if (!dataSource) return [];
    return dataSource.columnDefs.map((col) => ({
      value: col.name,
      label: col.name,
    }));
  }, [dataSource]);

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

  const handleTypeChange = (newType: InspectorBoundaryConfigType) => {
    onUpdate({
      ...boundaryConfig,
      type: newType,
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
    setSelectedColumns([]);
    onUpdate({
      ...boundaryConfig,
      dataSourceId,
      columns: [],
    });
  };

  return (
    <div className="border rounded-lg p-3">
      <TogglePanel
        label={dataSource.name.toUpperCase()}
        icon={
          dataSourceType ? <DataSourceIcon type={dataSourceType} /> : undefined
        }
        defaultExpanded={true}
      >
        <div className="pt-4 pb-2 flex flex-col gap-4">
          <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Database size={16} />
            Data source
          </h3>

          {/* Data source info */}
          <DataSourceSelectButton
            areaSetCode={areaSetCode}
            className="w-full"
            dataSource={dataSource}
            onClickRemove={onClickRemove}
            onSelect={(dataSourceId) => handleDataSourceIdChange(dataSourceId)}
          />

          {/* Name field */}
          <div className="space-y-2">
            <Label
              htmlFor={`config-name-${index}`}
              className="text-muted-foreground"
            >
              Name
            </Label>
            <Input
              id={`config-name-${index}`}
              value={configName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Main Data"
            />
          </div>

          {/* Type field */}
          <div className="space-y-2">
            <Label
              htmlFor={`config-type-${index}`}
              className="text-muted-foreground"
            >
              Type
            </Label>
            <Select
              defaultValue={
                boundaryConfig.type || InspectorBoundaryConfigType.Simple
              }
              onValueChange={(value) =>
                handleTypeChange(value as InspectorBoundaryConfigType)
              }
            >
              <SelectTrigger id={`config-type-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {inspectorBoundaryTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Columns field */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Columns</Label>
            <MultiSelect
              options={columnOptions}
              selected={selectedColumns}
              onChange={handleColumnsChange}
              placeholder="Select columns..."
            />
          </div>
        </div>
      </TogglePanel>
    </div>
  );
}
