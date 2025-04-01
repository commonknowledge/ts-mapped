"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import {
  DataSourceConfigQuery,
  UpdateDataSourceConfigMutation,
  UpdateDataSourceConfigMutationVariables,
} from "@/__generated__/types";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { DataSourceGeocodingConfigSchema } from "@/zod";
import ColumnsConfigFields from "./ColumnsConfigFields";
import GeocodingConfigFields from "./GeocodingConfigFields";

export default function DataSourceConfigForm({
  dataSource,
}: {
  // Exclude<...> marks dataSource as not null or undefined (this is checked in the parent page)
  dataSource: Exclude<DataSourceConfigQuery["dataSource"], null | undefined>;
}) {
  // Columns config
  const [nameColumn, setNameColumn] = useState<string>(
    dataSource.columnsConfig.nameColumn || "",
  );

  // Geocoding config
  const [geocodingConfig, setGeocodingConfig] = useState(
    dataSource.geocodingConfig,
  );

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [updateColumnsConfig] = useMutation<
    UpdateDataSourceConfigMutation,
    UpdateDataSourceConfigMutationVariables
  >(gql`
    mutation UpdateDataSourceConfig(
      $id: String!
      $columnsConfig: ColumnsConfigInput!
      $rawGeocodingConfig: JSON!
    ) {
      updateDataSourceConfig(
        id: $id
        columnsConfig: $columnsConfig
        rawGeocodingConfig: $rawGeocodingConfig
      ) {
        code
      }
    }
  `);

  const columnsConfig = { nameColumn };

  const { data: validGeocodingConfig } =
    DataSourceGeocodingConfigSchema.safeParse(geocodingConfig);

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await updateColumnsConfig({
        variables: {
          id: dataSource.id,
          columnsConfig,
          rawGeocodingConfig: geocodingConfig,
        },
      });
      if (result.errors) {
        throw new Error(String(result.errors));
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

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <h2 className="text-xl tracking-tight font-light">Data setup</h2>
      <ColumnsConfigFields
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
      <Button disabled={!validGeocodingConfig || loading}>Submit</Button>
      {error && (
        <div>
          <small>{error}</small>
        </div>
      )}
    </form>
  );
}
