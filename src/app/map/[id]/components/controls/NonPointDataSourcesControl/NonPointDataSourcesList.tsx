"use client";

import { ChevronDown, FolderPlus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import { LayerType } from "@/types";
import { cn } from "@/shadcn/utils";
import { CalculationType } from "@/server/models/MapView";
import DataSourceItem from "../DataSourceItem";
import EmptyLayer from "../LayerEmptyMessage";
import DataSourceColumnItem from "./DataSourceColumnItem";
import ColumnGroup from "./ColumnGroup";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Checkbox } from "@/shadcn/ui/checkbox";

export default function NonPointDataSourcesList() {
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { data: dataSources } = useDataSources();
  const { selectedDataSourceId, handleDataSourceSelect } = useTable();
  const { updateViewConfig, viewConfig } = useMapViews();
  const { setBoundariesPanelOpen } = useChoropleth();
  const [expandedDataSources, setExpandedDataSources] = useState<Set<string>>(
    new Set()
  );
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [selectedDataSourceForGroup, setSelectedDataSourceForGroup] = useState<string | null>(null);
  const [selectedColumnsForGroup, setSelectedColumnsForGroup] = useState<Set<string>>(new Set());

  const nonPointDataSources = useMemo(() => {
    const selectedIds = mapConfig.nonPointDataSourceIds || [];
    return dataSources?.filter((ds) => selectedIds.includes(ds.id)) || [];
  }, [dataSources, mapConfig.nonPointDataSourceIds]);

  const toggleDataSource = (dataSourceId: string) => {
    setExpandedDataSources((prev) => {
      const next = new Set(prev);
      if (next.has(dataSourceId)) {
        next.delete(dataSourceId);
      } else {
        next.add(dataSourceId);
      }
      return next;
    });
  };

  const handleVisualise = (dataSourceId: string, columnName: string) => {
    // For data layers, use data values (Sum of column values, not count)
    updateViewConfig({
      areaDataSourceId: dataSourceId,
      areaDataColumn: columnName,
      calculationType: CalculationType.Sum, // Use data values from the column
    });
    // Open the boundaries panel to show the visualization
    setBoundariesPanelOpen(true);
  };

  // Get column groups for a data source
  const getColumnGroups = (dataSourceId: string) => {
    const groupsConfig = mapConfig.columnGroups?.[dataSourceId];
    if (!groupsConfig) return { groups: [], ungroupedColumns: [] };
    return groupsConfig;
  };

  // Get columns organized by groups
  const organizeColumns = (dataSourceId: string, columns: typeof dataSources[0]['columnDefs']) => {
    const { groups, ungroupedColumns = [] } = getColumnGroups(dataSourceId);
    const allGroupedColumns = new Set(groups.flatMap(g => g.columnNames));
    
    // Find ungrouped columns (columns not in any group)
    const ungrouped = columns.filter(col => 
      !allGroupedColumns.has(col.name) && 
      (!ungroupedColumns.length || ungroupedColumns.includes(col.name))
    ).map(col => col.name);

    // Map groups to their actual column definitions
    const groupsWithColumns = groups.map(group => ({
      ...group,
      columns: columns.filter(col => group.columnNames.includes(col.name)),
    }));

    return {
      groups: groupsWithColumns,
      ungroupedColumns: columns.filter(col => ungrouped.includes(col.name)),
    };
  };

  // Group management functions
  const createGroup = (dataSourceId: string, groupName: string, columnNames: string[]) => {
    const currentGroups = getColumnGroups(dataSourceId);
    const newGroupId = `group-${Date.now()}`;
    const newGroups = [
      ...currentGroups.groups,
      { id: newGroupId, name: groupName, columnNames },
    ];
    
    updateMapConfig({
      columnGroups: {
        ...(mapConfig.columnGroups || {}),
        [dataSourceId]: {
          groups: newGroups,
          ungroupedColumns: currentGroups.ungroupedColumns?.filter(
            col => !columnNames.includes(col)
          ) || [],
        },
      },
    });
  };

  const renameGroup = (dataSourceId: string, groupId: string, newName: string) => {
    const currentGroups = getColumnGroups(dataSourceId);
    const updatedGroups = currentGroups.groups.map(group =>
      group.id === groupId ? { ...group, name: newName } : group
    );
    
    updateMapConfig({
      columnGroups: {
        ...(mapConfig.columnGroups || {}),
        [dataSourceId]: {
          ...currentGroups,
          groups: updatedGroups,
        },
      },
    });
  };

  const deleteGroup = (dataSourceId: string, groupId: string) => {
    const currentGroups = getColumnGroups(dataSourceId);
    const groupToDelete = currentGroups.groups.find(g => g.id === groupId);
    if (!groupToDelete) return;

    const updatedGroups = currentGroups.groups.filter(g => g.id !== groupId);
    const newUngrouped = [
      ...(currentGroups.ungroupedColumns || []),
      ...groupToDelete.columnNames,
    ];
    
    updateMapConfig({
      columnGroups: {
        ...(mapConfig.columnGroups || {}),
        [dataSourceId]: {
          groups: updatedGroups,
          ungroupedColumns: newUngrouped,
        },
      },
    });
  };

  const removeColumnFromGroup = (dataSourceId: string, groupId: string, columnName: string) => {
    const currentGroups = getColumnGroups(dataSourceId);
    const updatedGroups = currentGroups.groups.map(group =>
      group.id === groupId
        ? { ...group, columnNames: group.columnNames.filter(name => name !== columnName) }
        : group
    );
    
    updateMapConfig({
      columnGroups: {
        ...(mapConfig.columnGroups || {}),
        [dataSourceId]: {
          groups: updatedGroups,
          ungroupedColumns: [
            ...(currentGroups.ungroupedColumns || []),
            columnName,
          ],
        },
      },
    });
  };

  const handleCreateGroup = (groupName: string) => {
    if (!selectedDataSourceForGroup || !groupName.trim() || selectedColumnsForGroup.size === 0) {
      return;
    }
    createGroup(selectedDataSourceForGroup, groupName.trim(), Array.from(selectedColumnsForGroup));
    setCreateGroupDialogOpen(false);
    setSelectedColumnsForGroup(new Set());
    setSelectedDataSourceForGroup(null);
  };

  const openCreateGroupDialog = (dataSourceId: string) => {
    setSelectedDataSourceForGroup(dataSourceId);
    setCreateGroupDialogOpen(true);
  };

  if (nonPointDataSources.length === 0) {
    return <EmptyLayer message="Add a data source" />;
  }

  return (
    <ul className="flex flex-col gap-1 ml-1">
      {nonPointDataSources.map((dataSource) => {
        const isExpanded = expandedDataSources.has(dataSource.id);
        const hasColumns = dataSource.columnDefs && dataSource.columnDefs.length > 0;

        return (
          <li key={dataSource.id}>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <div className="flex-1 min-w-0">
                  <DataSourceItem
                    dataSource={dataSource}
                    isSelected={selectedDataSourceId === dataSource.id}
                    handleDataSourceSelect={handleDataSourceSelect}
                    layerType={LayerType.DataLayer}
                    showChevron={hasColumns}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleDataSource(dataSource.id)}
                  />
                </div>
              </div>
              {isExpanded && hasColumns && (
                <div className="ml-7 mt-1 space-y-1">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => openCreateGroupDialog(dataSource.id)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-neutral-900 hover:bg-neutral-50 rounded transition-colors w-full text-left"
                      >
                        <FolderPlus size={12} />
                        Create group
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContentWithFocus>
                      <ContextMenuItem onClick={() => openCreateGroupDialog(dataSource.id)}>
                        <FolderPlus size={12} />
                        Create new group
                      </ContextMenuItem>
                    </ContextMenuContentWithFocus>
                  </ContextMenu>
                  
                  {(() => {
                    const { groups, ungroupedColumns } = organizeColumns(dataSource.id, dataSource.columnDefs);
                    return (
                      <>
                        {groups.map((group) => (
                          <ColumnGroup
                            key={group.id}
                            groupId={group.id}
                            groupName={group.name}
                            columns={group.columns}
                            dataSourceId={dataSource.id}
                            dataSourceName={dataSource.name}
                            isVisualized={(columnName) =>
                              viewConfig.areaDataSourceId === dataSource.id &&
                              viewConfig.areaDataColumn === columnName
                            }
                            onVisualise={handleVisualise}
                            onRename={(groupId, newName) => renameGroup(dataSource.id, groupId, newName)}
                            onDelete={(groupId) => deleteGroup(dataSource.id, groupId)}
                            onRemoveColumn={(groupId, columnName) =>
                              removeColumnFromGroup(dataSource.id, groupId, columnName)
                            }
                          />
                        ))}
                        {ungroupedColumns.length > 0 && (
                          <div className="space-y-0.5">
                            {ungroupedColumns.map((column) => {
                              const isVisualized =
                                viewConfig.areaDataSourceId === dataSource.id &&
                                viewConfig.areaDataColumn === column.name;
                              return (
                                <DataSourceColumnItem
                                  key={column.name}
                                  column={column}
                                  dataSourceId={dataSource.id}
                                  dataSourceName={dataSource.name}
                                  onVisualise={handleVisualise}
                                  isVisualized={isVisualized}
                                />
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </li>
        );
      })}
      
      <CreateGroupDialog
        open={createGroupDialogOpen}
        onOpenChange={setCreateGroupDialogOpen}
        dataSourceId={selectedDataSourceForGroup}
        dataSource={dataSources?.find(ds => ds.id === selectedDataSourceForGroup)}
        selectedColumns={selectedColumnsForGroup}
        onSelectionChange={setSelectedColumnsForGroup}
        onConfirm={(groupName) => handleCreateGroup(groupName)}
      />
    </ul>
  );
}

// Create Group Dialog Component
function CreateGroupDialog({
  open,
  onOpenChange,
  dataSourceId,
  dataSource,
  selectedColumns,
  onSelectionChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSourceId: string | null;
  dataSource: typeof dataSources[0] | undefined;
  selectedColumns: Set<string>;
  onSelectionChange: (columns: Set<string>) => void;
  onConfirm: (groupName: string) => void;
}) {
  const [groupName, setGroupName] = useState("");

  const handleToggleColumn = (columnName: string) => {
    const newSelection = new Set(selectedColumns);
    if (newSelection.has(columnName)) {
      newSelection.delete(columnName);
    } else {
      newSelection.add(columnName);
    }
    onSelectionChange(newSelection);
  };

  const handleConfirm = () => {
    if (groupName.trim() && selectedColumns.size > 0) {
      onConfirm(groupName);
      setGroupName("");
    }
  };

  if (!dataSource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Column Group</DialogTitle>
          <DialogDescription>
            Select columns to group together for {dataSource.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Demographics, Economic"
            />
          </div>
          <div className="space-y-2">
            <Label>Select Columns</Label>
            <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-1">
              {dataSource.columnDefs.map((column) => (
                <div key={column.name} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedColumns.has(column.name)}
                    onCheckedChange={() => handleToggleColumn(column.name)}
                  />
                  <label className="text-sm cursor-pointer flex-1">
                    {column.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!groupName.trim() || selectedColumns.size === 0}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
