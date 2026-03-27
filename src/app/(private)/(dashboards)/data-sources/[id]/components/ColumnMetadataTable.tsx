"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDataSourceListCache } from "@/app/(private)/hooks/useDataSourceListCache";
import ColorMappingsEditor from "@/components/ColorMappingsEditor";
import ValueLabelsEditor from "@/components/ValueLabelsEditor";
import { useColumnValues } from "@/hooks/useColumnValues";
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

  useEffect(() => {
    if (!open) setLocalLabels(currentLabels);
  }, [currentLabels, open]);

  const sortedValues = useColumnValues({
    dataSourceId,
    column: columnName,
    columnType,
    nullIsZero,
    enabled: open,
  });

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
      <PopoverContent
        className="w-72 p-0 max-h-64 overflow-y-auto"
        align="start"
      >
        <ValueLabelsEditor
          values={sortedValues}
          columnType={columnType}
          valueLabels={localLabels}
          onChange={handleLabelChange}
        />
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

  useEffect(() => {
    if (!open) setLocalMappings(currentMappings);
  }, [currentMappings, open]);

  const sortedValues = useColumnValues({
    dataSourceId,
    column: columnName,
    columnType,
    nullIsZero,
    enabled: open,
  });

  const handleChange = useCallback(
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

  const handleReset = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [value]: _removed, ...rest } = localMappings;
      setLocalMappings(rest);
      onSave(rest);
    },
    [localMappings, onSave],
  );

  const handleResetAll = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalMappings({});
    onSave({});
  }, [onSave]);

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
      <PopoverContent
        className="w-56 p-0 max-h-64 overflow-y-auto"
        align="start"
      >
        <ColorMappingsEditor
          values={sortedValues}
          colorMappings={localMappings}
          onChange={handleChange}
          onReset={handleReset}
          onResetAll={handleResetAll}
        />
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
      valueColors: existing.get(col.name)?.valueColors,
    }));
  }, [dataSource.columnDefs, dataSource.columnMetadata]);

  const [metadata, setMetadata] = useState<ColumnMetadata[]>(initialMetadata);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setMetadata(initialMetadata);
  }, [initialMetadata]);

  const trpc = useTRPC();
  const { updateDataSource } = useDataSourceListCache();

  const { mutate: updateDataSourceConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: (_data, variables) => {
        toast.success("Saved.");
        updateDataSource(variables.dataSourceId, (ds) => ({
          ...ds,
          columnMetadata: variables.columnMetadata ?? ds.columnMetadata,
        }));
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
    (index: number, valueColors: Record<string, string>) => {
      const updated = metadata.map((m, i) =>
        i === index ? { ...m, valueColors } : m,
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
        configure display labels and colours for specific values.
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
                    currentMappings={col.valueColors ?? {}}
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
