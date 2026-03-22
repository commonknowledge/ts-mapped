"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ColumnSemanticTypeLabels } from "@/labels";
import {
  type ColumnMetadata,
  type ColumnSemanticType,
  ColumnType,
  JobStatus,
  numericColumnSemanticTypes,
} from "@/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { Textarea } from "@/shadcn/ui/textarea";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSource = NonNullable<RouterOutputs["dataSource"]["byId"]>;

function ColumnValueLabelsCell({
  dataSourceId,
  columnName,
  columnType,
  nullIsZero,
  currentLabels,
  onSave,
}: {
  dataSourceId: string;
  columnName: string;
  columnType: ColumnType;
  nullIsZero: boolean | undefined;
  currentLabels: Record<string, string>;
  onSave: (labels: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localLabels, setLocalLabels] =
    useState<Record<string, string>>(currentLabels);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trpc = useTRPC();

  const { data: rawColumnValues } = useQuery(
    trpc.dataSource.uniqueColumnValues.queryOptions(
      { dataSourceId, column: columnName },
      { enabled: open },
    ),
  );

  const columnValues = useMemo(() => {
    if (rawColumnValues == null) return rawColumnValues;
    if (!nullIsZero || columnType !== ColumnType.Number) {
      return rawColumnValues;
    }
    const blankValues = new Set(["", "null", "undefined"]);
    const hasBlankOrZero =
      rawColumnValues.some((v) => blankValues.has(v)) ||
      rawColumnValues.includes("0");
    if (!hasBlankOrZero) return rawColumnValues;
    const filtered = rawColumnValues.filter((v) => !blankValues.has(v));
    if (!filtered.includes("0")) {
      filtered.push("0");
    }
    return filtered;
  }, [rawColumnValues, nullIsZero, columnType]);

  const sortedValues = useMemo(() => {
    if (!columnValues) return columnValues;
    return columnValues.toSorted((a, b) => {
      if (columnType === ColumnType.Number) {
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [columnValues, columnType]);

  const handleLabelChange = useCallback(
    (value: string, label: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [value]: _removed, ...rest } = localLabels;
      const updated = label ? { ...localLabels, [value]: label } : rest;
      setLocalLabels(updated);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSave(updated);
      }, 300);
    },
    [localLabels, onSave],
  );

  const labelCount = Object.keys(currentLabels).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          {labelCount > 0
            ? `${labelCount} label${labelCount !== 1 ? "s" : ""}`
            : "Configure labels"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="max-h-64 overflow-y-auto">
          {sortedValues === undefined ? (
            <p className="text-sm text-muted-foreground p-3">Loading values…</p>
          ) : sortedValues === null ? (
            <p className="text-sm text-muted-foreground p-3">
              Too many unique values to configure labels.
            </p>
          ) : sortedValues.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">
              No values found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2 text-xs">Value</TableHead>
                  <TableHead className="w-1/2 text-xs">Label</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedValues.map((value) => (
                  <TableRow key={value}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-normal py-1.5">
                      {value || "(blank)"}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Input
                        value={localLabels[value] ?? ""}
                        onChange={(e) =>
                          handleLabelChange(value, e.target.value)
                        }
                        className="h-7 text-xs"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ColumnColorMappingsCell({
  dataSourceId,
  columnName,
  columnType,
  nullIsZero,
  currentMappings,
  onSave,
}: {
  dataSourceId: string;
  columnName: string;
  columnType: ColumnType;
  nullIsZero: boolean | undefined;
  currentMappings: Record<string, string>;
  onSave: (mappings: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localMappings, setLocalMappings] =
    useState<Record<string, string>>(currentMappings);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trpc = useTRPC();

  const { data: rawColumnValues } = useQuery(
    trpc.dataSource.uniqueColumnValues.queryOptions(
      { dataSourceId, column: columnName },
      { enabled: open },
    ),
  );

  const columnValues = useMemo(() => {
    if (rawColumnValues == null) return rawColumnValues;
    if (!nullIsZero || columnType !== ColumnType.Number) {
      return rawColumnValues;
    }
    const blankValues = new Set(["", "null", "undefined"]);
    const hasBlankOrZero =
      rawColumnValues.some((v) => blankValues.has(v)) ||
      rawColumnValues.includes("0");
    if (!hasBlankOrZero) return rawColumnValues;
    const filtered = rawColumnValues.filter((v) => !blankValues.has(v));
    if (!filtered.includes("0")) {
      filtered.push("0");
    }
    return filtered;
  }, [rawColumnValues, nullIsZero, columnType]);

  const sortedValues = useMemo(() => {
    if (!columnValues) return columnValues;
    return columnValues.toSorted((a, b) => {
      if (columnType === ColumnType.Number) {
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [columnValues, columnType]);

  const handleMappingChange = useCallback(
    (value: string, color: string) => {
      const updated = { ...localMappings, [value]: color };
      setLocalMappings(updated);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSave(updated);
      }, 300);
    },
    [localMappings, onSave],
  );

  const mappingCount = Object.keys(currentMappings).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          {mappingCount > 0
            ? `${mappingCount} colour${mappingCount !== 1 ? "s" : ""}`
            : "Configure colours"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="max-h-64 overflow-y-auto">
          {sortedValues === undefined ? (
            <p className="text-sm text-muted-foreground p-3">Loading values…</p>
          ) : sortedValues === null ? (
            <p className="text-sm text-muted-foreground p-3">
              Too many unique values to configure colours.
            </p>
          ) : sortedValues.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">
              No values found.
            </p>
          ) : (
            <div className="p-2 flex flex-col gap-1">
              {sortedValues.map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={localMappings[value] ?? "#000000"}
                    onChange={(e) => handleMappingChange(value, e.target.value)}
                    className="h-7 w-10 p-0.5 cursor-pointer shrink-0"
                  />
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {value || "(blank)"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function ColumnMetadataTable({
  dataSource,
}: {
  dataSource: DataSource;
}) {
  const initialMetadata = useMemo(() => {
    const existing = new Map(
      (dataSource.columnMetadata ?? []).map((m) => [m.name, m]),
    );
    return dataSource.columnDefs.map((col) => ({
      name: col.name,
      valueLabels: existing.get(col.name)?.valueLabels ?? {},
      description: existing.get(col.name)?.description ?? "",
      semanticType: existing.get(col.name)?.semanticType,
      colorMappings: existing.get(col.name)?.colorMappings,
    }));
  }, [dataSource.columnDefs, dataSource.columnMetadata]);

  const [metadata, setMetadata] = useState<ColumnMetadata[]>(initialMetadata);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setMetadata(initialMetadata);
  }, [initialMetadata]);

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
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  const save = useCallback(
    (updated: ColumnMetadata[]) => {
      updateDataSourceConfig({
        dataSourceId: dataSource.id,
        columnMetadata: updated,
      });
    },
    [dataSource.id, updateDataSourceConfig],
  );

  const handleDescriptionChange = useCallback(
    (index: number, value: string) => {
      const updated = metadata.map((m, i) =>
        i === index ? { ...m, description: value } : m,
      );
      setMetadata(updated);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(updated), 500);
    },
    [metadata, save],
  );

  const handleSemanticTypeChange = useCallback(
    (index: number, value: ColumnSemanticType | undefined) => {
      const updated = metadata.map((m, i) =>
        i === index ? { ...m, semanticType: value } : m,
      );
      setMetadata(updated);
      save(updated);
    },
    [metadata, save],
  );

  const handleValueLabelsChange = useCallback(
    (index: number, labels: Record<string, string>) => {
      const updated = metadata.map((m, i) =>
        i === index ? { ...m, valueLabels: labels } : m,
      );
      setMetadata(updated);
      save(updated);
    },
    [metadata, save],
  );

  const handleColorMappingsChange = useCallback(
    (index: number, colorMappings: Record<string, string>) => {
      const updated = metadata.map((m, i) =>
        i === index ? { ...m, colorMappings } : m,
      );
      setMetadata(updated);
      save(updated);
    },
    [metadata, save],
  );

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
          ? "Column metadata will be editable when your data source is fully imported."
          : "Import your data source to set column metadata."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Add descriptions to columns, mark numeric columns as percentages, and
        configure display labels for specific values.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Data type</TableHead>
            <TableHead>Value labels</TableHead>
            <TableHead>Colour mappings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metadata.map((col, index) => {
            const colDef = dataSource.columnDefs.find(
              (d) => d.name === col.name,
            );
            const isNumeric = colDef?.type === ColumnType.Number;

            return (
              <TableRow key={col.name}>
                <TableCell className="font-mono text-sm align-top">
                  {col.name}
                </TableCell>
                <TableCell className="align-top">
                  <Textarea
                    value={col.description}
                    onChange={(e) =>
                      handleDescriptionChange(index, e.target.value)
                    }
                    placeholder="Add description"
                    className="text-sm min-h-0 resize-none"
                    rows={2}
                  />
                </TableCell>
                <TableCell className="align-top">
                  {isNumeric ? (
                    <Select
                      value={col.semanticType ?? ""}
                      onValueChange={(value) =>
                        handleSemanticTypeChange(
                          index,
                          value ? (value as ColumnSemanticType) : undefined,
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-sm data-[placeholder]:text-black">
                        <SelectValue placeholder="Number" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericColumnSemanticTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {ColumnSemanticTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="text-sm font-normal">
                      {colDef?.type === ColumnType.String
                        ? "Text"
                        : (colDef?.type ?? "Unknown")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <ColumnValueLabelsCell
                    dataSourceId={dataSource.id}
                    columnName={col.name}
                    columnType={colDef?.type ?? ColumnType.Unknown}
                    nullIsZero={dataSource.nullIsZero}
                    currentLabels={col.valueLabels}
                    onSave={(labels) => handleValueLabelsChange(index, labels)}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <ColumnColorMappingsCell
                    dataSourceId={dataSource.id}
                    columnName={col.name}
                    columnType={colDef?.type ?? ColumnType.Unknown}
                    nullIsZero={dataSource.nullIsZero}
                    currentMappings={col.colorMappings ?? {}}
                    onSave={(mappings) =>
                      handleColorMappingsChange(index, mappings)
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
