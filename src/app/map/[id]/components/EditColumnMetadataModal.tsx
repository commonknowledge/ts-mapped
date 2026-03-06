"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { type ColumnMetadata, ColumnType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useEditColumnMetadata } from "../hooks/useEditColumnMetadata";

export default function EditColumnMetadataModal() {
  const [editColumnMetadata, setEditColumnMetadata] = useEditColumnMetadata();
  const { getDataSourceById } = useDataSources();
  const { organisationId } = useContext(OrganisationsContext);
  const trpc = useTRPC();
  const client = useQueryClient();

  const dataSource = getDataSourceById(editColumnMetadata?.dataSourceId);
  const columnName = editColumnMetadata?.column ?? "";

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
      dataSource.columnMetadataOverride,
      columnName,
    );
  }, [dataSource, columnName]);

  const [draftDescription, setDraftDescription] = useState("");
  const [draftValueLabels, setDraftValueLabels] = useState<
    Record<string, string>
  >({});
  const [saving, setSaving] = useState(false);

  // Reset draft state when the dialog opens for a new column
  useEffect(() => {
    if (editColumnMetadata) {
      setDraftDescription(existingMeta?.description ?? "");
      setDraftValueLabels(existingMeta?.valueLabels ?? {});
    }
  }, [editColumnMetadata, existingMeta]);

  const { data: columnValues } = useQuery(
    trpc.dataSource.uniqueColumnValues.queryOptions(
      { dataSourceId: dataSource?.id ?? "", column: columnName },
      { enabled: Boolean(dataSource && columnName) },
    ),
  );

  // Mutation for owners: update the data source directly
  const { mutate: updateDataSourceConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: (_data, variables) => {
        setSaving(false);
        toast.success("Column metadata saved.");
        client.setQueryData(
          trpc.dataSource.listReadable.queryKey({
            organisationId: organisationId ?? undefined,
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
        setEditColumnMetadata(null);
      },
      onError: (error) => {
        setSaving(false);
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  // Mutation for non-owners: save as org-specific override
  const { mutate: updateOverride } = useMutation(
    trpc.dataSource.updateColumnMetadataOverride.mutationOptions({
      onSuccess: (_data, variables) => {
        setSaving(false);
        toast.success("Column metadata saved.");
        client.setQueryData(
          trpc.dataSource.listReadable.queryKey({
            organisationId: organisationId ?? undefined,
          }),
          (old) =>
            old?.map((ds) =>
              ds.id === variables.dataSourceId
                ? { ...ds, columnMetadataOverride: variables.columnMetadata }
                : ds,
            ),
        );
        setEditColumnMetadata(null);
      },
      onError: (error) => {
        setSaving(false);
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  const handleClose = useCallback(() => {
    setEditColumnMetadata(null);
  }, [setEditColumnMetadata]);

  const handleSave = useCallback(() => {
    if (!dataSource) return;

    // Build the full metadata array from the source we're updating
    const sourceMetadata = isOwner
      ? dataSource.columnMetadata
      : (dataSource.columnMetadataOverride ?? []);

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

    setSaving(true);

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

  const isOpen = editColumnMetadata !== null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      {isOpen && (
        <DialogContent>
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                Metadata for <span className="font-mono">{columnName}</span>
              </DialogTitle>
              <DialogDescription>
                Configure a description and value labels for this column.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Column description"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Value labels</label>
                {(() => {
                  if (columnValues === undefined) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        Loading values…
                      </p>
                    );
                  }
                  if (columnValues === null) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        Too many unique values to configure labels.
                      </p>
                    );
                  }
                  if (columnValues.length === 0) {
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
                            <TableHead className="w-1/2">Value</TableHead>
                            <TableHead className="w-1/2">Label</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {columnValues
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
                                <TableCell>
                                  <Input
                                    value={draftValueLabels[value] ?? ""}
                                    onChange={(e) => {
                                      const label = e.target.value;
                                      setDraftValueLabels((prev) => {
                                        if (label) {
                                          return { ...prev, [value]: label };
                                        }
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        const { [value]: _removed, ...rest } =
                                          prev;
                                        return rest;
                                      });
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  );
                })()}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
