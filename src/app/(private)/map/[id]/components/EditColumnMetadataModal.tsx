"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getCategoryColorsKey,
  makeColorMap,
} from "@/app/(private)/map/[id]/colors";
import { useAreaStats } from "@/app/(private)/map/[id]/data";
import { useDataSources } from "@/app/(private)/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { type ColumnMetadata, ColumnType } from "@/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { Textarea } from "@/shadcn/ui/textarea";
import { resolveColumnMetadataEntry } from "@/utils/resolveColumnMetadata";
import { DEFAULT_FILL_COLOR } from "../constants";
import { useEditColumnMetadata } from "../hooks/useEditColumnMetadata";
import type { EditColumnMetadataFields } from "../atoms/editColumnMetadataAtom";

export default function EditColumnMetadataModal() {
  const [editColumnMetadata, setEditColumnMetadata] = useEditColumnMetadata();
  const { getDataSourceById } = useDataSources();
  const organisationId = useOrganisationId();
  const trpc = useTRPC();
  const client = useQueryClient();

  const { viewConfig, updateViewConfig } = useMapViews();

  const dataSource = getDataSourceById(editColumnMetadata?.dataSourceId);
  const columnName = editColumnMetadata?.column ?? "";

  // Debounce timers for color changes
  const debounceTimers = useRef<Record<string, NodeJS.Timeout | null>>({});
  const metadataSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({
    description: "",
    valueLabels: {} as Record<string, string>,
  });

  // Cleanup debounce timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
      if (metadataSaveTimer.current) {
        clearTimeout(metadataSaveTimer.current);
      }
    };
  }, []);

  // Whether the user's current org owns this data source
  const isOwner = Boolean(
    organisationId &&
    dataSource &&
    dataSource.organisationId === organisationId,
  );

  const columnType = dataSource?.columnDefs.find(
    (col) => col.name === columnName,
  )?.type;

  const existingMeta = useMemo(() => {
    if (!dataSource) return undefined;
    return resolveColumnMetadataEntry(
      dataSource.columnMetadata,
      dataSource.organisationOverride?.columnMetadata,
      columnName,
    );
  }, [dataSource, columnName]);

  const [draftDescription, setDraftDescription] = useState("");
  const [draftValueLabels, setDraftValueLabels] = useState<
    Record<string, string>
  >({});
  // Reset draft state when the dialog opens for a new column
  useEffect(() => {
    if (editColumnMetadata) {
      const desc = existingMeta?.description ?? "";
      const labels = existingMeta?.valueLabels ?? {};
      setDraftDescription(desc);
      setDraftValueLabels(labels);
      lastSavedRef.current = { description: desc, valueLabels: labels };
    }
  }, [editColumnMetadata, existingMeta]);

  const { data: columnValues } = useQuery(
    trpc.dataSource.uniqueColumnValues.queryOptions(
      { dataSourceId: dataSource?.id ?? "", column: columnName },
      { enabled: Boolean(dataSource && columnName) },
    ),
  );

  // If this column is currently being visualised, merge in area stats categories
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;

  const isVisualisedColumn =
    editColumnMetadata?.dataSourceId === viewConfig.areaDataSourceId &&
    editColumnMetadata?.column === viewConfig.areaDataColumn;

  const areaStatsValues = useMemo(() => {
    if (!isVisualisedColumn || !areaStats?.stats.length) return [];
    return Array.from(
      new Set(
        areaStats.stats
          .map((s) => String(s.primary))
          .filter((v) => v && v !== "null" && v !== "undefined"),
      ),
    );
  }, [isVisualisedColumn, areaStats]);

  // Merge unique column values with area stats categories
  // null means too many values (>50); undefined means still loading
  const mergedValues = useMemo((): string[] | null | undefined => {
    // If the query returned null, there are too many values
    if (columnValues === null) return null;
    // If the query is still loading and we have no area stats values, show loading
    if (columnValues === undefined && areaStatsValues.length === 0)
      return undefined;
    let merged = Array.from(
      new Set([...(columnValues ?? []), ...areaStatsValues]),
    );
    // If nullIsZero is true, combine blank/undefined/0 into just "0"
    if (dataSource?.nullIsZero && columnType === ColumnType.Number) {
      const blankValues = new Set(["", "null", "undefined"]);
      const hasBlankOrZero =
        merged.some((v) => blankValues.has(v)) || merged.includes("0");
      if (hasBlankOrZero) {
        merged = merged.filter((v) => !blankValues.has(v));
        if (!merged.includes("0")) {
          merged.push("0");
        }
      }
    }
    // Enforce the 50-value cap
    if (merged.length > 50) return null;
    return merged;
  }, [columnValues, areaStatsValues, dataSource?.nullIsZero, columnType]);

  // Sorted distinct values for the D3 ordinal scale domain
  const sortedValues = useMemo(
    () => [...(mergedValues ?? [])].sort(),
    [mergedValues],
  );

  const colorMap = useMemo(
    () => makeColorMap(sortedValues, viewConfig, dataSource?.id, columnName),
    [columnName, dataSource, sortedValues, viewConfig],
  );

  // Resolve the display color for a given value
  const getColorForValue = useCallback(
    (value: string) => {
      return colorMap[value] ?? DEFAULT_FILL_COLOR;
    },
    [colorMap],
  );

  const isColorSet = useCallback(
    (value: string) => {
      const key = getCategoryColorsKey(dataSource?.id, columnName, value);
      return Boolean(
        viewConfig.colorMappings?.[key] ?? viewConfig.colorMappings?.[value],
      );
    },
    [viewConfig.colorMappings, dataSource?.id, columnName],
  );

  const handleColorChange = useCallback(
    (value: string, color: string) => {
      const key = getCategoryColorsKey(dataSource?.id, columnName, value);
      const currentColors = viewConfig.colorMappings || {};
      updateViewConfig({
        colorMappings: {
          ...currentColors,
          [value]: color,
          [key]: color,
        },
      });
    },
    [dataSource?.id, columnName, updateViewConfig, viewConfig.colorMappings],
  );

  const handleColorChangeDebounced = useCallback(
    (value: string, color: string) => {
      if (debounceTimers.current[value]) {
        clearTimeout(debounceTimers.current[value]);
      }
      debounceTimers.current[value] = setTimeout(() => {
        handleColorChange(value, color);
        debounceTimers.current[value] = null;
      }, 300);
    },
    [handleColorChange],
  );

  const handleResetColor = useCallback(
    (value: string) => {
      if (debounceTimers.current[value]) {
        clearTimeout(debounceTimers.current[value]);
        debounceTimers.current[value] = null;
      }
      const key = getCategoryColorsKey(dataSource?.id, columnName, value);
      const currentColors = viewConfig.colorMappings || {};
      const nextColors = Object.fromEntries(
        Object.entries(currentColors).filter(([k]) => k !== value && k !== key),
      );
      updateViewConfig({
        colorMappings:
          Object.keys(nextColors).length > 0 ? nextColors : undefined,
      });
    },
    [dataSource?.id, columnName, updateViewConfig, viewConfig.colorMappings],
  );

  // Mutation for owners: update the data source directly
  const { mutate: updateDataSourceConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: (_data, variables) => {
        client.setQueryData(
          trpc.dataSource.listReadable.queryKey({
            activeOrganisationId: organisationId ?? undefined,
          }),
          (old) =>
            old?.map((ds) =>
              ds.id === variables.dataSourceId
                ? {
                    ...ds,
                    columnMetadata:
                      variables.columnMetadata ?? ds.columnMetadata,
                  }
                : ds,
            ),
        );
      },
      onError: (error) => {
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  // Mutation for non-owners: save as org-specific override
  const { mutate: updateOverride } = useMutation(
    trpc.dataSource.updateColumnMetadataOverride.mutationOptions({
      onSuccess: (_data, variables) => {
        client.setQueryData(
          trpc.dataSource.listReadable.queryKey({
            activeOrganisationId: organisationId ?? undefined,
          }),
          (old) =>
            old?.map((ds) =>
              ds.id === variables.dataSourceId
                ? {
                    ...ds,
                    organisationOverride: {
                      ...(ds.organisationOverride ?? {}),
                      columnMetadata: variables.columnMetadata,
                      inspectorColumns:
                        ds.organisationOverride?.inspectorColumns ?? [],
                    },
                  }
                : ds,
            ),
        );
      },
      onError: (error) => {
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  const saveMetadata = useCallback(() => {
    if (!dataSource) return;

    const sourceMetadata = isOwner
      ? dataSource.columnMetadata
      : (dataSource.organisationOverride?.columnMetadata ?? []);

    const existingMetadata: ColumnMetadata[] = dataSource.columnDefs.map(
      (col) => {
        const existing = sourceMetadata.find((m) => m.name === col.name);
        return {
          name: col.name,
          description: existing?.description ?? "",
          valueLabels: existing?.valueLabels ?? {},
        };
      },
    );

    const updated = existingMetadata.map((m) =>
      m.name === columnName
        ? { ...m, description: draftDescription, valueLabels: draftValueLabels }
        : m,
    );

    lastSavedRef.current = {
      description: draftDescription,
      valueLabels: { ...draftValueLabels },
    };

    if (isOwner) {
      updateDataSourceConfig({
        dataSourceId: dataSource.id,
        columnMetadata: updated,
      });
    } else if (organisationId) {
      updateOverride({
        organisationId,
        dataSourceId: dataSource.id,
        columnMetadata: updated,
        inspectorColumns:
          dataSource.organisationOverride?.inspectorColumns ?? [],
      });
    }
  }, [
    dataSource,
    columnName,
    draftDescription,
    draftValueLabels,
    isOwner,
    organisationId,
    updateDataSourceConfig,
    updateOverride,
  ]);

  // Auto-save description and value labels when they change
  useEffect(() => {
    if (!dataSource || !editColumnMetadata) return;
    const { description: lastDesc, valueLabels: lastLabels } =
      lastSavedRef.current;
    if (
      draftDescription === lastDesc &&
      JSON.stringify(draftValueLabels) === JSON.stringify(lastLabels)
    ) {
      return;
    }
    if (metadataSaveTimer.current) {
      clearTimeout(metadataSaveTimer.current);
    }
    metadataSaveTimer.current = setTimeout(() => {
      saveMetadata();
      metadataSaveTimer.current = null;
    }, 500);
    return () => {
      if (metadataSaveTimer.current) {
        clearTimeout(metadataSaveTimer.current);
      }
    };
  }, [
    draftDescription,
    draftValueLabels,
    dataSource,
    editColumnMetadata,
    saveMetadata,
  ]);

  const handleClose = useCallback(() => {
    // Flush any pending metadata save
    if (metadataSaveTimer.current) {
      clearTimeout(metadataSaveTimer.current);
      metadataSaveTimer.current = null;
    }
    const { description: lastDesc, valueLabels: lastLabels } =
      lastSavedRef.current;
    if (
      draftDescription !== lastDesc ||
      JSON.stringify(draftValueLabels) !== JSON.stringify(lastLabels)
    ) {
      saveMetadata();
    }
    setEditColumnMetadata(null);
  }, [setEditColumnMetadata, draftDescription, draftValueLabels, saveMetadata]);

  const isOpen = editColumnMetadata !== null;

  const showTable =
    editColumnMetadata?.fields.valueLabels ||
    editColumnMetadata?.fields.colorMappings;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      {isOpen && (
        <DialogContent>
          <div className="flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editColumnMetadata.fields.description ? (
                  <>
                    Metadata for <span className="font-mono">{columnName}</span>
                  </>
                ) : (
                  <>
                    Display values for{" "}
                    <span className="font-mono">{columnName}</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {fieldsToDescription(editColumnMetadata.fields)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              {editColumnMetadata.fields.description && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    placeholder="Column description"
                  />
                </div>
              )}
              {showTable && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Display values</label>
                  {(() => {
                    if (mergedValues === undefined) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          Loading values…
                        </p>
                      );
                    }
                    if (mergedValues === null) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          Too many unique values to configure labels.
                        </p>
                      );
                    }
                    if (mergedValues.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          No values found.
                        </p>
                      );
                    }
                    return (
                      <ScrollArea className="max-h-64 rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Value</TableHead>
                              {editColumnMetadata.fields.valueLabels && (
                                <TableHead>Label</TableHead>
                              )}
                              {editColumnMetadata.fields.colorMappings && (
                                <TableHead className="w-16">Color</TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mergedValues
                              .toSorted((a, b) => {
                                if (columnType === ColumnType.Number) {
                                  const numA = Number(a);
                                  const numB = Number(b);
                                  if (isNaN(numA) || isNaN(numB)) {
                                    return a.localeCompare(b);
                                  }
                                  return numA - numB;
                                }
                                return a.localeCompare(b);
                              })
                              .map((value) => (
                                <TableRow key={value}>
                                  <TableCell className="font-mono text-sm text-muted-foreground whitespace-normal">
                                    {value || "(blank)"}
                                  </TableCell>
                                  {editColumnMetadata.fields.valueLabels && (
                                    <TableCell>
                                      <Input
                                        value={draftValueLabels[value] ?? ""}
                                        onChange={(e) => {
                                          const label = e.target.value;
                                          setDraftValueLabels((prev) => {
                                            if (label) {
                                              return {
                                                ...prev,
                                                [value]: label,
                                              };
                                            }

                                            const {
                                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                              [value]: _removed,
                                              ...rest
                                            } = prev;
                                            return rest;
                                          });
                                        }}
                                        className="h-8 text-sm"
                                      />
                                    </TableCell>
                                  )}
                                  {editColumnMetadata.fields.colorMappings && (
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <label className="relative cursor-pointer">
                                          <div
                                            className="w-6 h-6 rounded border border-neutral-300 flex-shrink-0"
                                            style={{
                                              backgroundColor:
                                                getColorForValue(value),
                                            }}
                                          />
                                          <input
                                            type="color"
                                            value={getColorForValue(value)}
                                            onChange={(e) =>
                                              handleColorChangeDebounced(
                                                value,
                                                e.target.value,
                                              )
                                            }
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            title={`Change color for ${value || "(blank)"}`}
                                          />
                                        </label>
                                        {isColorSet(value) && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleResetColor(value)
                                            }
                                            className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-100"
                                            title="Reset to default color"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

const fieldsToDescription = (fields: EditColumnMetadataFields): string => {
  const labels: Record<keyof EditColumnMetadataFields, string> = {
    description: "description",
    valueLabels: "display values",
    colorMappings: "colors",
  };
  const keys = Object.keys(fields) as (keyof EditColumnMetadataFields)[];
  const parts = keys.filter((f) => fields[f]).map((f) => labels[f]);
  if (!parts.length) {
    return "Configure this column.";
  }
  let listStr = "";
  if (parts.length === 1) {
    listStr = parts[0];
  } else {
    const last = parts.pop();
    listStr = parts.join(", ") + " and " + last;
  }
  return `Configure ${listStr} for this column.`;
};
