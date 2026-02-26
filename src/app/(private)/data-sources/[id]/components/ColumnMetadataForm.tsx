"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
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
import type { ColumnMetadata } from "@/server/models/DataSource";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSource = NonNullable<RouterOutputs["dataSource"]["byId"]>;

function hasMetadata(col: ColumnMetadata) {
  return col.description !== "" || Object.keys(col.valueLabels).length > 0;
}

export default function ColumnMetadataForm({
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
    }));
  }, [dataSource.columnDefs, dataSource.columnMetadata]);

  const [metadata, setMetadata] = useState<ColumnMetadata[]>(initialMetadata);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftDescription, setDraftDescription] = useState("");
  const [draftValueLabels, setDraftValueLabels] = useState<
    Record<string, string>
  >({});

  const client = useQueryClient();
  const trpc = useTRPC();
  const editingCol = editingIndex !== null ? metadata[editingIndex] : null;
  const { data: columnValues } = useQuery(
    trpc.dataSource.uniqueColumnValues.queryOptions(
      { dataSourceId: dataSource.id, column: editingCol?.name ?? "" },
      { enabled: editingCol !== null },
    ),
  );
  const { mutate: updateDataSourceConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: () => {
        setLoading(false);
        toast.success("Column metadata saved.");
        client.invalidateQueries({
          queryKey: trpc.dataSource.listReadable.queryKey(),
        });
      },
      onError: (error) => {
        setLoading(false);
        toast.error(error.message || "Could not save column metadata.");
      },
    }),
  );

  const openDialog = useCallback(
    (index: number) => {
      const col = metadata[index];
      setDraftDescription(col.description);
      setDraftValueLabels(col.valueLabels);
      setEditingIndex(index);
    },
    [metadata],
  );

  const closeDialog = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const saveDialog = useCallback(() => {
    if (editingIndex === null) return;
    const updated = metadata.map((m, i) =>
      i === editingIndex
        ? { ...m, description: draftDescription, valueLabels: draftValueLabels }
        : m,
    );
    setMetadata(updated);
    setEditingIndex(null);
    setLoading(true);
    updateDataSourceConfig({
      dataSourceId: dataSource.id,
      columnMetadata: updated,
    });
  }, [
    editingIndex,
    metadata,
    draftDescription,
    draftValueLabels,
    dataSource.id,
    updateDataSourceConfig,
  ]);

  if (dataSource.columnDefs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Import data to configure column metadata.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-lg">Column metadata</h3>
      <p className="text-sm text-muted-foreground">
        Add labels and descriptions for each column. These are shown to users
        viewing your data.
      </p>
      <ul className="rounded-md border divide-y">
        {metadata.map((col, index) => {
          const hasMeta = hasMetadata(col);
          return (
            <li
              key={col.name}
              className="flex items-center justify-between px-4 py-2 gap-2"
            >
              <span className="font-mono text-sm">{col.name}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => openDialog(index)}
              >
                {hasMeta ? (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit metadata
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Add metadata
                  </>
                )}
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={editingIndex !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Metadata for <span className="font-mono">{editingCol?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Configure a description and value labels for this column.
            </DialogDescription>
          </DialogHeader>
          {editingCol && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Description</label>
                <Input
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
                          {columnValues.toSorted().map((value) => (
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
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={saveDialog}
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
