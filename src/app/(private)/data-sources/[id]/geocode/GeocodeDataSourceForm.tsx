"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import {
  DataSourceGeocodingConfigQuery,
  UpdateGeocodingConfigMutation,
  UpdateGeocodingConfigMutationVariables,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { AreaSetCodeLabels, GeocodingTypeLabels } from "@/labels";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { AreaSetCode, GeocodingType } from "@/types";
import { DataSourceGeocodingConfigSchema, GeocodingOnAreaSetType } from "@/zod";

export default function GeocodeDataSourceForm({
  dataSource,
}: {
  // Exclude<...> marks dataSource as not null or undefined (this is checked in the parent page)
  dataSource: Exclude<
    DataSourceGeocodingConfigQuery["dataSource"],
    null | undefined
  >;
}) {
  const initialState = getInitialState(dataSource.geocodingConfig);

  const [column, setColumn] = useState(initialState.column);
  const [type, setType] = useState<GeocodingType>(initialState.type);
  const [areaSetCode, setAreaSetCode] = useState<AreaSetCode | "">(
    initialState.areaSetCode,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [updateGeocodingConfig] = useMutation<
    UpdateGeocodingConfigMutation,
    UpdateGeocodingConfigMutationVariables
  >(gql`
    mutation UpdateGeocodingConfig($id: String!, $rawGeocodingConfig: JSON!) {
      updateGeocodingConfig(id: $id, rawGeocodingConfig: $rawGeocodingConfig) {
        code
      }
    }
  `);

  const geocodingConfig = prepareConfig({ type, column, areaSetCode });
  const { data: validGeocodingConfig } =
    DataSourceGeocodingConfigSchema.safeParse(geocodingConfig);

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await updateGeocodingConfig({
        variables: { id: dataSource.id, rawGeocodingConfig: geocodingConfig },
      });
      if (result.errors) {
        throw new Error(String(result.errors));
      } else {
        router.push(`/data-sources/${dataSource.id}`);
        return;
      }
    } catch (e) {
      console.error(`Could not update geocoding config: ${e}`);
      setError("Could not update geocoding config.");
    }

    setLoading(false);
  };

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/data-sources">Data sources</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href={`/data-sources/${dataSource.id}`}>
              {dataSource.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Geocode</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title={`Geocode ${dataSource.name}`}
        description="Set up geocoding so we know where your data is."
      />
      <Separator className="my-4" />
      <form onSubmit={onSubmit} className="max-w-2xl ">
        <DataListRow label="Column">
          <Select value={column} onValueChange={(c) => setColumn(c)}>
            <SelectTrigger className="w-[360px]">
              <SelectValue placeholder="Select a column to geocode on" />
            </SelectTrigger>
            <SelectContent>
              {dataSource.columnDefs.map((cd) => (
                <SelectItem key={cd.name} value={cd.name}>
                  {cd.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataListRow>

        <DataListRow label="Data type">
          <Select
            // Make the trigger display when type === 'none'
            value={type === GeocodingType.none ? "" : type}
            onValueChange={(t) => setType(t as GeocodingType)}
          >
            <SelectTrigger className="w-[360px]">
              <SelectValue placeholder="What kind of data is this?" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(GeocodingTypeLabels)
                .filter((type) => type !== GeocodingType.none)
                .map((type) => (
                  <SelectItem key={type} value={type}>
                    {GeocodingTypeLabels[type as GeocodingType]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </DataListRow>

        {type in GeocodingOnAreaSetType ? (
          <DataListRow label="Area type">
            <Select
              value={areaSetCode}
              onValueChange={(t) => setAreaSetCode(t as AreaSetCode)}
            >
              <SelectTrigger className="w-[360px]">
                <SelectValue placeholder="What kind of area is this?" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(AreaSetCodeLabels)
                  .filter((type) => type !== AreaSetCode.PC)
                  .map((type) => (
                    <SelectItem key={type} value={type}>
                      {AreaSetCodeLabels[type as AreaSetCode]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </DataListRow>
        ) : null}

        <Button disabled={!validGeocodingConfig || loading}>Submit</Button>
        {error ? (
          <div>
            <small>{error}</small>
          </div>
        ) : null}
      </form>
    </div>
  );
}

const getInitialState = (rawGeocodingConfig: unknown) => {
  const { data: geocodingConfig } =
    DataSourceGeocodingConfigSchema.safeParse(rawGeocodingConfig);
  return Object.assign(
    {
      type: GeocodingType.none,
      column: "",
      areaSetCode: "" as const,
    },
    geocodingConfig,
  );
};

const prepareConfig = (config: {
  type: GeocodingType | "postcode";
  column: string;
  areaSetCode: string;
}) => {
  if (config.type === "postcode") {
    return {
      type: GeocodingType.code,
      column: config.column,
      areaSetCode: AreaSetCode.PC,
    };
  }
  return config;
};
