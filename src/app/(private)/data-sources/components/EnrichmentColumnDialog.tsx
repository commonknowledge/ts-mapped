"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { AreaSetCodeLabels } from "@/labels";
import { AreaSetCode } from "@/server/models/AreaSet";
import {
  AreaPropertyType,
  EnrichmentSourceType,
  enrichmentSchema,
} from "@/server/models/DataSource";
import { type RouterOutputs, useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Combobox } from "@/shadcn/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";

const boundaryTypeOptions = Object.entries(AreaSetCodeLabels)
  .filter(([code]) => code !== AreaSetCode.PC)
  .map(([code, label]) => ({ value: code, label }));

export default function EnrichmentColumnDialog({
  dataSource,
}: {
  dataSource: RouterOutputs["dataSource"]["byId"];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);
  const [columnType, setColumnType] = useState<"geographic" | "data" | "">("");

  // Geographic fields
  const [areaSetCode, setAreaSetCode] = useState("");
  const [areaProperty, setAreaProperty] = useState("");

  // Data fields
  const [selectedDataSourceId, setSelectedDataSourceId] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const { data: dataSources } = useQuery(
    trpc.dataSource.listReadable.queryOptions(undefined, {
      enabled: dialogOpen && columnType === "data",
    }),
  );

  const dataSourceOptions = useMemo(
    () =>
      (dataSources ?? [])
        .filter(
          (ds) =>
            "areaSetCode" in ds.geocodingConfig &&
            ds.geocodingConfig.areaSetCode !== AreaSetCode.PC,
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((ds) => ({
          value: ds.id,
          label: ds.name,
        })),
    [dataSources],
  );

  const selectedDs = dataSources?.find((ds) => ds.id === selectedDataSourceId);
  const columnOptions = useMemo(
    () =>
      (selectedDs?.columnDefs ?? []).map((col) => ({
        value: col.name,
        label: col.name,
      })),
    [selectedDs],
  );

  // Determine if the core fields (everything except name) are complete
  const coreFieldsComplete = useMemo(() => {
    if (columnType === "geographic") {
      return areaSetCode !== "" && areaProperty !== "";
    }
    if (columnType === "data") {
      return selectedDataSourceId !== "" && selectedColumns.length > 0;
    }
    return false;
  }, [
    columnType,
    areaSetCode,
    areaProperty,
    selectedDataSourceId,
    selectedColumns,
  ]);

  // Compute a suggested default name
  const suggestedName = useMemo(() => {
    if (columnType === "geographic" && areaSetCode) {
      return `${AreaSetCodeLabels[areaSetCode as AreaSetCode] ?? areaSetCode} ${areaProperty}`;
    }
    if (columnType === "data" && selectedColumns.length === 1) {
      return selectedColumns[0];
    }
    return "";
  }, [columnType, areaSetCode, selectedColumns, areaProperty]);

  // Auto-populate name when core fields become complete (unless user manually edited)
  useEffect(() => {
    if (coreFieldsComplete && !nameManuallyEdited && suggestedName) {
      setName(suggestedName);
    }
  }, [coreFieldsComplete, nameManuallyEdited, suggestedName]);

  const { mutate: updateConfig, isPending } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Column added successfully");
        resetForm();
        setDialogOpen(false);
        queryClient.invalidateQueries({
          queryKey: trpc.dataSource.enrichmentPreview.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.dataSource.byId.queryKey({
            dataSourceId: dataSource.id,
          }),
        });
      },
      onError: (error) => {
        toast.error("Failed to add column", {
          description: error.message,
        });
      },
    }),
  );

  const resetForm = () => {
    setName("");
    setNameManuallyEdited(false);
    setColumnType("");
    setAreaSetCode("");
    setAreaProperty("");
    setSelectedDataSourceId("");
    setSelectedColumns([]);
  };

  const newEnrichments = useMemo(() => {
    if (columnType === "geographic") {
      const result = enrichmentSchema.safeParse({
        name: `${ENRICHMENT_COLUMN_PREFIX}${name}`,
        sourceType: EnrichmentSourceType.Area,
        areaSetCode,
        areaProperty,
      });
      return result.success ? [result.data] : null;
    }
    if (columnType === "data") {
      const enrichments = selectedColumns.map((col) =>
        enrichmentSchema.safeParse({
          name: `${ENRICHMENT_COLUMN_PREFIX}${selectedColumns.length === 1 ? name : col}`,
          sourceType: EnrichmentSourceType.DataSource,
          dataSourceId: selectedDataSourceId,
          dataSourceColumn: col,
        }),
      );
      if (!enrichments.every((r) => r.success)) return null;
      return enrichments.map((r) => r.data);
    }
    return null;
  }, [
    columnType,
    name,
    areaSetCode,
    areaProperty,
    selectedDataSourceId,
    selectedColumns,
  ]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newEnrichments) return;
    updateConfig({
      dataSourceId: dataSource.id,
      enrichments: [...dataSource.enrichments, ...newEnrichments],
    });
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add column
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add column</DialogTitle>
          <DialogDescription>
            Add an enrichment column to this data source.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormFieldWrapper id="column-type" label="Lookup type">
            <Select
              value={columnType}
              onValueChange={(value: "geographic" | "data") => {
                setColumnType(value);
                setAreaSetCode("");
                setAreaProperty("");
                setSelectedDataSourceId("");
                setSelectedColumns([]);
                setName("");
                setNameManuallyEdited(false);
              }}
            >
              <SelectTrigger id="column-type">
                <SelectValue placeholder="Choose a lookup type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geographic">Boundary lookup</SelectItem>
                <SelectItem value="data">Data lookup</SelectItem>
              </SelectContent>
            </Select>
          </FormFieldWrapper>

          {columnType === "geographic" && (
            <>
              <FormFieldWrapper id="boundary-type" label="Boundary type">
                <Select value={areaSetCode} onValueChange={setAreaSetCode}>
                  <SelectTrigger id="boundary-type">
                    <SelectValue placeholder="Select a boundary type" />
                  </SelectTrigger>
                  <SelectContent>
                    {boundaryTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              <FormFieldWrapper id="boundary-value" label="Boundary value">
                <Select value={areaProperty} onValueChange={setAreaProperty}>
                  <SelectTrigger id="boundary-value">
                    <SelectValue placeholder="Code or name?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AreaPropertyType.Name}>
                      Name (e.g. &quot;Islington North&quot;)
                    </SelectItem>
                    <SelectItem value={AreaPropertyType.Code}>
                      Code (e.g. &quot;E14001305&quot;)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </>
          )}

          {columnType === "data" && (
            <>
              <FormFieldWrapper id="data-source" label="Data source">
                <Combobox
                  options={dataSourceOptions}
                  value={selectedDataSourceId}
                  onValueChange={(value) => {
                    setSelectedDataSourceId(value);
                    setSelectedColumns([]);
                  }}
                  placeholder="Select a data source"
                  searchPlaceholder="Search data sources…"
                  emptyMessage="No data sources found."
                />
              </FormFieldWrapper>

              <CustomMultiSelect
                id="data-columns"
                label="Columns"
                allOptions={columnOptions.map((o) => o.value)}
                selectedOptions={selectedColumns}
                onChange={(value) => {
                  setSelectedColumns((prev) =>
                    prev.includes(value)
                      ? prev.filter((v) => v !== value)
                      : [...prev, value],
                  );
                }}
                placeholder="Select columns"
              />
            </>
          )}

          {coreFieldsComplete &&
            (columnType === "geographic" || selectedColumns.length === 1) && (
              <FormFieldWrapper id="column-name" label="Column name">
                <Input
                  id="column-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameManuallyEdited(true);
                  }}
                  placeholder="Enter column name"
                  required
                />
              </FormFieldWrapper>
            )}

          <Button
            type="submit"
            disabled={!newEnrichments || isPending}
            className="mt-2"
          >
            {isPending ? "Adding…" : "Add column"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
