"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceFeatures } from "@/features";
import {
  DataSourceType,
  geocodingConfigSchema,
} from "@/server/models/DataSource";
import { Button } from "@/shadcn/ui/button";
import { Switch } from "@/shadcn/ui/switch";
import { ColumnRoleFields } from "./ColumnRoleFields";
import { GeocodingConfigFields } from "./GeocodingConfigFields";
import type {
  UpdateDataSourceConfigMutation,
  UpdateDataSourceConfigMutationVariables,
} from "@/__generated__/types";
import type { RouterOutputs } from "@/services/trpc/react";
import type { SyntheticEvent } from "react";

export default function ConfigurationForm({
  dataSource,
  redirectToParent = false,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
  redirectToParent?: boolean;
}) {
  const router = useRouter();

  // Columns config
  const [nameColumns, setNameColumns] = useState<string[]>(
    dataSource.columnRoles.nameColumns || [],
  );

  // Geocoding config
  const [geocodingConfig, setGeocodingConfig] = useState(
    dataSource.geocodingConfig,
  );

  const [autoImport, setAutoImport] = useState(dataSource.autoImport);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [updateColumnRoles] = useMutation<
    UpdateDataSourceConfigMutation,
    UpdateDataSourceConfigMutationVariables
  >(gql`
    mutation UpdateDataSourceConfig(
      $id: String!
      $columnRoles: ColumnRolesInput!
      $looseGeocodingConfig: LooseGeocodingConfigInput
      $autoImport: Boolean!
    ) {
      updateDataSourceConfig(
        id: $id
        columnRoles: $columnRoles
        looseGeocodingConfig: $looseGeocodingConfig
        autoImport: $autoImport
      ) {
        code
      }
    }
  `);

  const columnRoles = { nameColumns };

  const { data: validGeocodingConfig } =
    geocodingConfigSchema.safeParse(geocodingConfig);

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await updateColumnRoles({
        variables: {
          id: dataSource.id,
          columnRoles,
          looseGeocodingConfig: validGeocodingConfig,
          autoImport,
        },
      });
      if (result.data?.updateDataSourceConfig?.code !== 200) {
        throw new Error(String(result.errors || "Unknown error"));
      } else {
        setLoading(false);
        if (redirectToParent) {
          router.push(`/data-sources/${dataSource.id}`);
        } else {
          toast.success("Your changes have been saved.");
        }
        return;
      }
    } catch (e) {
      console.error(`Could not update data source: ${e}`);
      setError("Could not update data source.");
    }

    setLoading(false);
  };

  const features = DataSourceFeatures[dataSource.config.type as DataSourceType];

  return (
    <form onSubmit={onSubmit} className="flex flex-col items-start gap-6">
      <ColumnRoleFields
        dataSource={dataSource}
        nameColumns={nameColumns}
        setNameColumns={setNameColumns}
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
            label="Automatically sync data to Mapped"
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

      <Button
        disabled={!validGeocodingConfig || loading}
        variant="secondary"
        type="submit"
      >
        Import data
      </Button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
