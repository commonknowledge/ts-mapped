"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useOrganisations } from "@/hooks/useOrganisations";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Combobox } from "@/shadcn/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import type { ComboboxOption } from "@/shadcn/ui/combobox";

interface CreatePublicMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePublicMapDialog({
  open,
  onOpenChange,
}: CreatePublicMapDialogProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organisationId } = useOrganisations();

  const [dataSourceId, setDataSourceId] = useState("");

  const { data: dataSources } = useQuery(
    trpc.dataSource.listReadable.queryOptions(undefined, {
      enabled: open,
    }),
  );

  const validDataSources = dataSources?.filter(
    (ds) => ds.recordType !== DataSourceRecordType.Data,
  );

  const options: ComboboxOption[] = (validDataSources ?? []).map((ds) => ({
    value: ds.id,
    label: ds.name,
  }));

  const { mutate: createPublicMap, isPending } = useMutation(
    trpc.publicMap.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.publicMap.list.queryKey({
            organisationId: organisationId || "",
          }),
        });
        onOpenChange(false);
        setDataSourceId("");
        router.push(`/map/${data.mapId}?mode=publish&listed=true`);
      },
      onError: (error) => {
        toast.error("Failed to create public map", {
          description: error.message,
        });
      },
    }),
  );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organisationId || !dataSourceId) return;
    createPublicMap({ organisationId, dataSourceId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Public Map</DialogTitle>
          <DialogDescription>
            Select a data source to create a new public map.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormFieldWrapper id="data-source" label="Data source">
            <Combobox
              options={options}
              value={dataSourceId}
              onValueChange={setDataSourceId}
              placeholder="Select a data source..."
              searchPlaceholder="Search data sources..."
              emptyMessage="No data sources found."
            />
          </FormFieldWrapper>

          <Button
            disabled={isPending || !dataSourceId}
            type="submit"
            size="sm"
            className="mt-2"
          >
            {isPending ? "Creating…" : "Create public map"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
