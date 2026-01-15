import { Database } from "lucide-react";
import { useState } from "react";
import { DataSourceItem } from "@/components/DataSourceItem";
import {
  InspectorDataSourceConfigType,
  inspectorTypes,
} from "@/server/models/MapView";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useChoroplethDataSource } from "../../hooks/useDataSources";
import { useMapViews } from "../../hooks/useMapViews";
import TogglePanel from "../TogglePanel";

export default function InspectorConfigTab() {
  const { viewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();
  const [configName, setConfigName] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  if (!viewConfig.areaDataSourceId || !dataSource) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p className="text-sm">No data source configured</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TogglePanel label="Data display configuration" defaultExpanded={true}>
        <div className="flex flex-col gap-4">
          <div className="border rounded-lg p-3">
            <TogglePanel
              label={dataSource.name.toUpperCase()}
              icon={Database}
              defaultExpanded={true}
            >
              <div className="pt-4 pb-2 flex flex-col gap-4">
                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Database size={16} />
                  Data source
                </h3>

                {/* Data source info */}
                {viewConfig.areaDataSourceId && dataSource && (
                  <DataSourceItem
                    className="shadow-xs"
                    dataSource={{
                      ...dataSource,
                    }}
                  />
                )}

                {/* Name field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="config-name"
                    className="text-muted-foreground"
                  >
                    Name
                  </Label>
                  <Input
                    id="config-name"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g. Main Data"
                  />
                </div>

                {/* Type field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="config-type"
                    className="text-muted-foreground"
                  >
                    Type
                  </Label>
                  <Select defaultValue={InspectorDataSourceConfigType.Simple}>
                    <SelectTrigger id="config-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectorTypes.map((type) => (
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select columns..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSource.columnDefs.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(col.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedColumns([
                                    ...selectedColumns,
                                    col.name,
                                  ]);
                                } else {
                                  setSelectedColumns(
                                    selectedColumns.filter(
                                      (c) => c !== col.name,
                                    ),
                                  );
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {col.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected columns display */}
                  {selectedColumns.length > 0 && (
                    <div className="flex flex-col gap-2 mt-3">
                      {selectedColumns.map((col) => (
                        <div
                          key={col}
                          className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                        >
                          <span>{col}</span>
                          <button
                            onClick={() =>
                              setSelectedColumns(
                                selectedColumns.filter((c) => c !== col),
                              )
                            }
                            className="ml-auto text-muted-foreground hover:text-foreground"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TogglePanel>
          </div>
        </div>
      </TogglePanel>
    </div>
  );
}
