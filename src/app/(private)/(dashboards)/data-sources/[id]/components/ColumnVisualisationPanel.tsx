"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import DataSourcePropertiesList from "@/app/(private)/map/[id]/components/InspectorPanel/DataSourcePropertiesList";
import { ColumnDisplayFormatLabels } from "@/labels";
import {
  ColumnDisplayFormat,
  type ColumnMetadata,
  ColumnSemanticType,
  ColumnType,
  type InspectorColumn,
  JobStatus,
  percentageColumnDisplayFormats,
} from "@/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSource = NonNullable<RouterOutputs["dataSource"]["byId"]>;

export default function ColumnVisualisationPanel({
  dataSource,
}: {
  dataSource: DataSource;
}) {
  const importStatus = dataSource.importInfo?.status;
  const importInProgress =
    importStatus === JobStatus.Running || importStatus === JobStatus.Pending;
  const hasBeenImported = dataSource.columnDefs.some(
    (col) => col.type !== ColumnType.Unknown,
  );

  if (!hasBeenImported) {
    return (
      <p className="text-sm text-muted-foreground">
        {importInProgress
          ? "Column visualisations will be editable when your data source is fully imported."
          : "Import your data source to configure the data inspector."}
      </p>
    );
  }

  return <ColumnVisualisationPanelInner dataSource={dataSource} />;
}

function ColumnVisualisationPanelInner({
  dataSource,
}: {
  dataSource: DataSource;
}) {
  const initialInspectorColumns = useMemo(() => {
    const existing = new Map(
      (dataSource.inspectorColumns ?? []).map((v) => [v.name, v]),
    );
    return dataSource.columnDefs.map(
      (col): InspectorColumn => existing.get(col.name) ?? { name: col.name },
    );
  }, [dataSource.columnDefs, dataSource.inspectorColumns]);

  const [inspectorColumns, setInspectorColumns] = useState<InspectorColumn[]>(
    initialInspectorColumns,
  );
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInspectorColumns(initialInspectorColumns);
  }, [initialInspectorColumns]);

  const client = useQueryClient();
  const trpc = useTRPC();

  const { mutate: updateDataSourceConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Saved.");
        client.invalidateQueries({
          queryKey: trpc.dataSource.listReadable.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Could not save column visualisations.");
      },
    }),
  );

  const save = useCallback(
    (updated: InspectorColumn[]) => {
      updateDataSourceConfig({
        dataSourceId: dataSource.id,
        inspectorColumns: updated,
      });
    },
    [dataSource.id, updateDataSourceConfig],
  );

  const getVis = useCallback(
    (name: string) => inspectorColumns.find((v) => v.name === name),
    [inspectorColumns],
  );

  const isHidden = useCallback(
    (name: string) => Boolean(getVis(name)?.hidden),
    [getVis],
  );

  const updateVis = useCallback(
    (name: string, partial: Partial<InspectorColumn>, debounce: boolean) => {
      const updated = inspectorColumns.map((v) =>
        v.name === name ? { ...v, ...partial } : v,
      );
      setInspectorColumns(updated);
      if (debounce) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => save(updated), 500);
      } else {
        save(updated);
      }
    },
    [inspectorColumns, save],
  );

  const shownColumnNames = useMemo(
    () =>
      dataSource.columnDefs
        .map((col) => col.name)
        .filter((name) => !isHidden(name)),
    [dataSource.columnDefs, isHidden],
  );

  const { data: recordsData } = useQuery(
    trpc.dataRecord.list.queryOptions({
      dataSourceId: dataSource.id,
      page: 0,
    }),
  );

  const firstRecord = recordsData?.records[0];

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <p className="text-sm">
        Choose which data to display by default in the inspector panel of the
        map.
      </p>
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left panel: all columns */}
        <div className="border rounded-md overflow-auto">
          <div className="px-3 py-2 border-b bg-muted/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              All columns
            </p>
          </div>
          <ul className="divide-y">
            {dataSource.columnDefs.map((col) => {
              const hidden = isHidden(col.name);
              return (
                <li
                  key={col.name}
                  className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors ${selectedColumnName === col.name ? "bg-muted" : ""} ${hidden ? "opacity-40" : ""}`}
                  onClick={() =>
                    setSelectedColumnName(
                      selectedColumnName === col.name ? null : col.name,
                    )
                  }
                >
                  <span className="font-mono text-sm truncate">{col.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateVis(col.name, { hidden: !hidden }, false);
                    }}
                  >
                    {hidden ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Middle panel: config for selected column */}
        <div className="border rounded-md overflow-auto">
          <div className="px-3 py-2 border-b bg-muted/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {selectedColumnName ? selectedColumnName : "Column config"}
            </p>
          </div>
          {selectedColumnName ? (
            <ColumnConfig
              metadata={dataSource.columnMetadata.find(
                (m) => m.name === selectedColumnName,
              )}
              inspectorColumn={
                getVis(selectedColumnName) ?? { name: selectedColumnName }
              }
              onUpdate={(partial) =>
                updateVis(selectedColumnName, partial, true)
              }
            />
          ) : (
            <p className="p-3 text-sm text-muted-foreground">
              Select a column to configure.
            </p>
          )}
        </div>

        {/* Right panel: inspector preview */}
        <div className="border rounded-md overflow-auto">
          <div className="px-3 py-2 border-b bg-muted/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Inspector preview
            </p>
          </div>
          <div className="p-3">
            {firstRecord ? (
              <DataSourcePropertiesList
                dataSource={dataSource}
                json={firstRecord.json}
                onlyColumns={shownColumnNames}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No records found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColumnConfig({
  metadata,
  inspectorColumn,
  onUpdate,
}: {
  metadata: ColumnMetadata | undefined;
  inspectorColumn: InspectorColumn;
  onUpdate: (partial: Partial<InspectorColumn>) => void;
}) {
  const isPercentage =
    metadata?.semanticType === ColumnSemanticType.Percentage01 ||
    metadata?.semanticType === ColumnSemanticType.Percentage0100;

  return (
    <div className="p-3 flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Display format</Label>
        {isPercentage ? (
          <Select
            value={inspectorColumn.displayFormat ?? ""}
            onValueChange={(value) =>
              onUpdate({
                displayFormat: value
                  ? (value as ColumnDisplayFormat)
                  : undefined,
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Percentage" />
            </SelectTrigger>
            <SelectContent>
              {percentageColumnDisplayFormats.map((fmt) => (
                <SelectItem key={fmt} value={fmt}>
                  {fmt === ColumnDisplayFormat.Auto
                    ? "Percentage"
                    : ColumnDisplayFormatLabels[fmt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="text-sm font-normal self-start">
            Text
          </Badge>
        )}
      </div>
    </div>
  );
}
