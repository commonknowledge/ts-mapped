import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import DataSourcesSelect from "../PublishedComponents/DataSourcesSelect";
import ColumnCard from "./ColumnCard";

export default function EditorDataSettings() {
  const { publicMap, updateDataSourceConfig, activeTabId, setActiveTabId } =
    useContext(PublicMapContext);
  const { getDataSourceById } = useContext(DataSourcesContext);
  const [expandedColumns, setExpandedColumns] = useState<
    Record<string, boolean>
  >({});

  // Auto-expand visible additional columns when switching data sources or on initial load
  useEffect(() => {
    if (!publicMap) return;

    // Use activeTabId if available, otherwise use the first data source
    const currentTabId =
      activeTabId || publicMap.dataSourceConfigs[0]?.dataSourceId;
    if (!currentTabId) return;

    const currentDataSourceConfig = publicMap.dataSourceConfigs.find(
      (config) => config.dataSourceId === currentTabId
    );

    if (!currentDataSourceConfig) return;

    const dataSource = getDataSourceById(currentDataSourceConfig.dataSourceId);
    if (!dataSource?.columnDefs) return;

    const primaryColumns = currentDataSourceConfig.nameColumns || [];
    const secondaryColumn = currentDataSourceConfig.descriptionColumn;

    // Find all visible additional columns (excluding primary/secondary)
    const visibleAdditionalColumns = currentDataSourceConfig.additionalColumns
      .filter((ac) =>
        ac.sourceColumns.some(
          (col) => !primaryColumns.includes(col) && col !== secondaryColumn
        )
      )
      .flatMap((ac) => ac.sourceColumns)
      .filter(
        (col) => !primaryColumns.includes(col) && col !== secondaryColumn
      );

    // Update expanded state for visible additional columns
    setExpandedColumns((prev) => {
      const newExpanded = { ...prev };

      // Expand all visible additional columns
      visibleAdditionalColumns.forEach((columnName) => {
        newExpanded[columnName] = true;
      });

      return newExpanded;
    });
  }, [activeTabId, publicMap, getDataSourceById]);

  if (!publicMap) {
    return null;
  }

  return (
    <>
      {publicMap.dataSourceConfigs.length > 0 && (
        <Tabs
          value={activeTabId || publicMap.dataSourceConfigs[0]?.dataSourceId}
          onValueChange={setActiveTabId}
        >
          <div className="flex items-center gap-2 mb-4">
            <TabsList
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${
                  publicMap.dataSourceConfigs.length
                }, 1fr)`,
              }}
            >
              {publicMap.dataSourceConfigs.map((dsc) => (
                <TabsTrigger value={dsc.dataSourceId} key={dsc.dataSourceId}>
                  {dsc.dataSourceLabel}
                </TabsTrigger>
              ))}
            </TabsList>
            <DataSourcesSelect />
          </div>

          {publicMap.dataSourceConfigs.map((dataSourceConfig) => (
            <TabsContent
              key={dataSourceConfig.dataSourceId}
              value={dataSourceConfig.dataSourceId}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 w-full items-center p-2 rounded-md border border-neutral-200">
                    <p className="text-sm font-medium w-1/2">
                      Data source label
                    </p>
                    <Input
                      className="text-sm w-1/2 shadow-none"
                      placeholder="Data source label"
                      value={dataSourceConfig.dataSourceLabel}
                      onChange={(e) =>
                        updateDataSourceConfig(dataSourceConfig.dataSourceId, {
                          dataSourceLabel: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Listing Title */}
                  <ColumnCard
                    dataSourceId={dataSourceConfig.dataSourceId}
                    badge="1"
                    title="Listing Title"
                    value={dataSourceConfig.nameColumns || []}
                    onValueChange={(value) =>
                      updateDataSourceConfig(dataSourceConfig.dataSourceId, {
                        nameColumns: value,
                      })
                    }
                    additionalColumns={dataSourceConfig.additionalColumns}
                    onAdditionalColumnsChange={(columns) =>
                      updateDataSourceConfig(dataSourceConfig.dataSourceId, {
                        additionalColumns: columns,
                      })
                    }
                  />

                  {/* Listing Subtitle */}
                  <ColumnCard
                    dataSourceId={dataSourceConfig.dataSourceId}
                    badge="2"
                    title="Listing Subtitle "
                    value={
                      dataSourceConfig.descriptionColumn
                        ? [dataSourceConfig.descriptionColumn]
                        : []
                    }
                    onValueChange={(value) =>
                      updateDataSourceConfig(dataSourceConfig.dataSourceId, {
                        descriptionColumn:
                          value.length > 0 ? value[0] : undefined,
                      })
                    }
                    additionalColumns={dataSourceConfig.additionalColumns}
                    onAdditionalColumnsChange={(columns) =>
                      updateDataSourceConfig(dataSourceConfig.dataSourceId, {
                        additionalColumns: columns,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  {/* Additional Columns */}
                  <Label className="text-sm font-medium">
                    Additional Columns
                  </Label>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const dataSource = getDataSourceById(
                        dataSourceConfig.dataSourceId
                      );
                      if (!dataSource?.columnDefs) return null;

                      return dataSource.columnDefs.map((column) => {
                        const isVisible =
                          dataSourceConfig.additionalColumns.some((ac) =>
                            ac.sourceColumns.includes(column.name)
                          );

                        // Check expanded state
                        const isExpanded = expandedColumns[column.name];

                        const columnConfig =
                          dataSourceConfig.additionalColumns.find((ac) =>
                            ac.sourceColumns.includes(column.name)
                          );

                        return (
                          <div
                            key={column.name}
                            className="border border-neutral-200 rounded-md overflow-hidden"
                          >
                            {/* Column Header */}
                            <div className="flex items-center justify-between p-2 hover:bg-neutral-50">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {column.name}
                                </span>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (isVisible) {
                                    // Remove this column and collapse it
                                    updateDataSourceConfig(
                                      dataSourceConfig.dataSourceId,
                                      {
                                        additionalColumns:
                                          dataSourceConfig.additionalColumns.filter(
                                            (ac) =>
                                              !ac.sourceColumns.includes(
                                                column.name
                                              )
                                          ),
                                      }
                                    );
                                    // Also collapse the accordion
                                    setExpandedColumns((prev) => ({
                                      ...prev,
                                      [column.name]: false,
                                    }));
                                  } else {
                                    // Add this column and expand it
                                    updateDataSourceConfig(
                                      dataSourceConfig.dataSourceId,
                                      {
                                        additionalColumns: [
                                          ...dataSourceConfig.additionalColumns,
                                          {
                                            label: column.name,
                                            sourceColumns: [column.name],
                                            type: PublicMapColumnType.String,
                                          },
                                        ],
                                      }
                                    );
                                    // Expand accordion when making visible
                                    setExpandedColumns((prev) => ({
                                      ...prev,
                                      [column.name]: true,
                                    }));
                                  }
                                }}
                                className="h-6 w-6 p-0"
                              >
                                {isVisible ? (
                                  <Eye className="w-4 h-4 text-green-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                              </Button>
                            </div>

                            {/* Column Settings - Show when visible and expanded */}
                            {isVisible && isExpanded && columnConfig && (
                              <div className="border-t border-neutral-200 p-3 bg-neutral-50">
                                <div className="flex flex-col gap-3">
                                  {/* Label Input */}
                                  <div className="flex gap-2 items-center">
                                    <Label className="text-xs font-medium w-20">
                                      Label:
                                    </Label>

                                    <Input
                                      value={columnConfig.label}
                                      onChange={(e) => {
                                        const columnIndex =
                                          dataSourceConfig.additionalColumns.findIndex(
                                            (ac) =>
                                              ac.sourceColumns.includes(
                                                column.name
                                              )
                                          );
                                        if (columnIndex >= 0) {
                                          const updatedColumns = [
                                            ...dataSourceConfig.additionalColumns,
                                          ];
                                          updatedColumns[columnIndex] = {
                                            ...updatedColumns[columnIndex],
                                            label: e.target.value,
                                          };
                                          updateDataSourceConfig(
                                            dataSourceConfig.dataSourceId,
                                            {
                                              additionalColumns: updatedColumns,
                                            }
                                          );
                                        }
                                      }}
                                      className="text-xs flex-1"
                                      placeholder="Column label"
                                      disabled={
                                        columnConfig.type ===
                                        PublicMapColumnType.Boolean
                                      }
                                    />
                                  </div>

                                  {/* Display Type Select */}
                                  <div className="flex gap-2 items-center">
                                    <Label className="text-xs font-medium w-20">
                                      Show as:
                                    </Label>
                                    <Select
                                      value={columnConfig.type}
                                      onValueChange={(type) => {
                                        const columnIndex =
                                          dataSourceConfig.additionalColumns.findIndex(
                                            (ac) =>
                                              ac.sourceColumns.includes(
                                                column.name
                                              )
                                          );
                                        if (columnIndex >= 0) {
                                          const updatedColumns = [
                                            ...dataSourceConfig.additionalColumns,
                                          ];
                                          updatedColumns[columnIndex] = {
                                            ...updatedColumns[columnIndex],
                                            type: type as PublicMapColumnType,
                                          };
                                          updateDataSourceConfig(
                                            dataSourceConfig.dataSourceId,
                                            {
                                              additionalColumns: updatedColumns,
                                            }
                                          );
                                        }
                                      }}
                                    >
                                      <SelectTrigger className=" flex-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem
                                          value={PublicMapColumnType.String}
                                        >
                                          Text
                                        </SelectItem>
                                        <SelectItem
                                          value={
                                            PublicMapColumnType.CommaSeparatedList
                                          }
                                        >
                                          List
                                        </SelectItem>
                                        <SelectItem
                                          value={PublicMapColumnType.Boolean}
                                        >
                                          Positive/Negative
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {!publicMap?.dataSourceConfigs.length && (
        <div className="flex flex-col gap-2 p-4 border border-neutral-200 rounded-md border-dashed">
          <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="text-sm text-neutral-500 text-center">
            No data sources added yet. Add a data source to get started.
          </p>
        </div>
      )}

      <div className="text-center mt-4">
        <span className="text-xs text-neutral-400">
          This is the{" "}
          <span className="font-semibold bg-yellow-100 text-yellow-800 px-1 rounded">
            editing view
          </span>{" "}
          of your map. When ready{" "}
          <span className="font-semibold bg-green-100 text-green-800 px-1 rounded">
            publish
          </span>{" "}
          to make it public!{" "}
        </span>
      </div>
    </>
  );
}
