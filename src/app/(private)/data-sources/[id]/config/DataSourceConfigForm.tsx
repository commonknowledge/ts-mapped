"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import {
  DataSourceConfigQuery,
  UpdateDataSourceConfigMutation,
  UpdateDataSourceConfigMutationVariables,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { DataSourceFeatures } from "@/features";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { Switch } from "@/shadcn/ui/switch";
import { DataSourceType } from "@/types";
import { GeocodingConfigSchema } from "@/zod";
import ColumnRoleFields from "./ColumnRoleFields";
import GeocodingConfigFields from "./GeocodingConfigFields";

export default function DataSourceConfigForm({
  dataSource,
}: {
  // Exclude<...> marks dataSource as not null or undefined (this is checked in the parent page)
  dataSource: Exclude<DataSourceConfigQuery["dataSource"], null | undefined>;
}) {
  // Columns config
  const [nameColumn, setNameColumn] = useState<string>(
    dataSource.columnRoles.nameColumn || "",
  );

  // Geocoding config
  const [geocodingConfig, setGeocodingConfig] = useState(
    dataSource.geocodingConfig,
  );

  const [autoImport, setAutoImport] = useState(dataSource.autoImport);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const columnRoles = { nameColumn };

  const { data: validGeocodingConfig } =
    GeocodingConfigSchema.safeParse(geocodingConfig);

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
        router.push(`/data-sources/${dataSource.id}`);
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
    <form onSubmit={onSubmit} className="max-w-2xl">
      <h2 className="text-xl tracking-tight font-light">Data setup</h2>
      <ColumnRoleFields
        dataSource={dataSource}
        nameColumn={nameColumn}
        setNameColumn={setNameColumn}
      />
      <Separator className="mb-4" />
      <h2 className="text-xl tracking-tight font-light">Geocoding setup</h2>
      <GeocodingConfigFields
        dataSource={dataSource}
        geocodingConfig={geocodingConfig}
        onChange={(nextGeocodingConfig) =>
          setGeocodingConfig({ ...geocodingConfig, ...nextGeocodingConfig })
        }
      />
      {features.autoImport && (
        <>
          <Separator className="mb-4" />
          <h2 className="text-xl tracking-tight font-light">Auto-import</h2>
          <DataListRow label="Import new records automatically">
            <Switch
              checked={autoImport}
              onCheckedChange={(v) => setAutoImport(v)}
            />
          </DataListRow>
        </>
      )}
      <Button disabled={!validGeocodingConfig || loading}>Submit</Button>
      {error && (
        <div>
          <small>{error}</small>
        </div>
      )}
    </form>
  );
}
