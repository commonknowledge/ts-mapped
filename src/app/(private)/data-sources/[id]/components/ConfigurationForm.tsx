"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceFeatures } from "@/features";
import {
  DataSourceType,
  geocodingConfigSchema,
} from "@/server/models/DataSource";
import { type RouterOutputs, useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Switch } from "@/shadcn/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { ColumnRoleFields } from "./ColumnRoleFields";
import { GeocodingConfigFields } from "./GeocodingConfigFields";
import type { SyntheticEvent } from "react";

export default function ConfigurationForm({
  dataSource,
  redirectToParent = false,
  onAutoImportChange,
  webhookStatus,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
  redirectToParent?: boolean;
  onAutoImportChange?: (enabled: boolean) => void;
  webhookStatus?:
    | { hasWebhook: boolean; hasErrors: boolean; error: string | null }
    | undefined;
}) {
  const router = useRouter();

  // Columns config
  const [nameColumns, setNameColumns] = useState<string[]>(
    dataSource.columnRoles.nameColumns || [],
  );

  const [dateColumn, setDateColumn] = useState<string>(
    dataSource.columnRoles.dateColumn || "",
  );

  const [dateFormat, setDateFormat] = useState<string>(dataSource.dateFormat);

  // Geocoding config
  const [geocodingConfig, setGeocodingConfig] = useState(
    dataSource.geocodingConfig,
  );

  const [autoImport, setAutoImport] = useState(dataSource.autoImport);

  const [isPublic, setIsPublic] = useState(dataSource.public);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: updateDataSourceConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: async () => {
        // Notify parent of autoImport status change
        onAutoImportChange?.(autoImport);

        // Invalidate webhook status to refetch and show/hide errors
        await queryClient.invalidateQueries({
          queryKey: trpc.dataSource.checkWebhookStatus.queryKey({
            dataSourceId: dataSource.id,
          }),
        });

        if (redirectToParent) {
          router.push(`/data-sources/${dataSource.id}`);
        } else {
          setLoading(false);
          toast.success("Your changes have been saved.");
        }
      },
      onError: (error) => {
        console.error(error);
        setLoading(false);
        const errorMessage = error.message || "Could not update data source.";
        setError(errorMessage);
        toast.error(errorMessage);
      },
    }),
  );

  const columnRoles = { nameColumns, dateColumn };

  const { data: validGeocodingConfig } =
    geocodingConfigSchema.safeParse(geocodingConfig);

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    updateDataSourceConfig({
      dataSourceId: dataSource.id,
      columnRoles,
      geocodingConfig: validGeocodingConfig,
      autoImport,
      dateFormat,
      public: isPublic,
    });
  };

  const features = DataSourceFeatures[dataSource.config.type as DataSourceType];

  return (
    <form onSubmit={onSubmit} className="flex flex-col items-start gap-6">
      <ColumnRoleFields
        dataSource={dataSource}
        nameColumns={nameColumns}
        setNameColumns={setNameColumns}
        dateColumn={dateColumn}
        setDateColumn={setDateColumn}
        dateFormat={dateFormat}
        setDateFormat={setDateFormat}
      />

      <GeocodingConfigFields
        dataSource={dataSource}
        geocodingConfig={geocodingConfig}
        onChange={(nextGeocodingConfig) =>
          setGeocodingConfig({
            ...geocodingConfig,
            ...nextGeocodingConfig,
          } as typeof geocodingConfig)
        }
      />

      {features.autoImport && (
        <>
          <FormFieldWrapper
            label={
              <span className="flex items-center gap-2">
                Automatically sync data to Mapped
                {webhookStatus?.hasErrors && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-4 w-4 text-red-600 " />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={8}
                      className="max-w-xs"
                    >
                      {webhookStatus.error}
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            }
            hint="When enabled, any change you make in this database will automatically display on your map."
            isHorizontal
          >
            <Switch
              checked={autoImport}
              onCheckedChange={(v) => setAutoImport(v)}
            />
          </FormFieldWrapper>

          {dataSource.config.type === DataSourceType.ActionNetwork && (
            <div className="w-full text-sm mb-4">
              <p className="mb-2">
                Add this URL as a webhook in your Action Network settings, with
                all triggers enabled:
              </p>
              <pre className="rounded border p-2 overflow-auto">
                {process.env.NEXT_PUBLIC_BASE_URL}/api/data-sources/
                {dataSource.id}/webhook
              </pre>
            </div>
          )}
        </>
      )}

      <FormFieldWrapper
        label="Share this data with the Movement Data Library"
        hint="Warning: this will make the data publicly available."
        isHorizontal
      >
        <Switch checked={isPublic} onCheckedChange={(v) => setIsPublic(v)} />
      </FormFieldWrapper>

      <Button
        disabled={!validGeocodingConfig || loading}
        variant="secondary"
        type="submit"
      >
        {loading ? "Saving (this can take a minute...)" : "Save and import"}
      </Button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
