"use client";

import { Boxes, Check, Database, PlusIcon } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { cn } from "@/shadcn/utils";
import { DataSourceRecordType } from "@/server/models/DataSource";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSourceItemType = NonNullable<
  RouterOutputs["dataSource"]["byOrganisation"]
>[0];

interface NonPointDataSourceSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSources: DataSourceItemType[];
  selectedNonPointDataSourceIds: string[];
  onSelectNonPointDataSource: (dataSourceId: string, selected: boolean) => void;
}

export default function NonPointDataSourceSelectionModal({
  open,
  onOpenChange,
  dataSources,
  selectedNonPointDataSourceIds,
  onSelectNonPointDataSource,
}: NonPointDataSourceSelectionModalProps) {
  const router = useRouter();

  // Filter for non-point datasources - exclude Members and point-based datasources
  // For now, we'll include all datasources except Members
  // In the future, this could be filtered by checking if datasources have geocodePoint data
  const nonPointDataSources = useMemo(
    () =>
      dataSources?.filter(
        (dataSource) => dataSource.recordType !== DataSourceRecordType.Members,
      ),
    [dataSources],
  );

  const groupedNonPointDataSources = useMemo(() => {
    const groups = Object.values(DataSourceRecordType)
      .filter((rt) => rt !== DataSourceRecordType.Members)
      .map((rt) => ({
        recordType: rt,
        items: nonPointDataSources.filter((ds) => ds.recordType === rt),
      }))
      .filter((g) => g.items.length > 0);

    // Show record types with more items first
    return groups.sort((a, b) => b.items.length - a.items.length);
  }, [nonPointDataSources]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Data Sources</DialogTitle>
          <DialogDescription>
            Choose which non-point data sources to add to this map
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-6">
          {/* Empty state */}
          {dataSources && dataSources.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              <Database className="w-12 h-12 mx-auto mb-6 text-neutral-300" />
              <p className="text-lg font-medium">No sources yet</p>
              <p className="text-sm mb-4">
                Create your first data source to get started
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push("/data-sources/new");
                  onOpenChange(false);
                }}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create your first data source
              </Button>
            </div>
          )}

          {/* Non-Point Data Sources Section */}
          {nonPointDataSources && nonPointDataSources.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Non-point data sources
                </h2>
                <div className="text-xs text-muted-foreground">Multi select</div>
              </div>

              {groupedNonPointDataSources.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 border rounded-md">
                  <Boxes className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No non-point data sources yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedNonPointDataSources.map((group) => (
                    <div key={group.recordType}>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        {group.recordType}
                      </div>
                      <div className="divide-y rounded-md border border-neutral-200 bg-white">
                        {group.items.map((dataSource) => {
                          const isSelected =
                            selectedNonPointDataSourceIds.includes(
                              dataSource.id,
                            );
                          return (
                            <button
                              key={dataSource.id}
                              onClick={() =>
                                onSelectNonPointDataSource(
                                  dataSource.id,
                                  isSelected,
                                )
                              }
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-50 transition-colors",
                                isSelected && "bg-blue-50",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-neutral-300 text-transparent",
                                )}
                              >
                                <Check size={14} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">
                                  {dataSource.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {dataSource.config?.type ?? "Data source"} ·{" "}
                                  {dataSource.recordCount ?? "?"} records
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            dataSources &&
            dataSources.length > 0 && (
              <div className="text-center py-8 text-neutral-400 border rounded-md">
                <Boxes className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No non-point data sources available</p>
              </div>
            )
          )}

          {/* Add new data source button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                router.push("/data-sources/new");
                onOpenChange(false);
              }}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add new data source
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
