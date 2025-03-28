"use client";

import { gql, useMutation } from "@apollo/client";
import { SyntheticEvent, useState } from "react";
import {
  DataSourceQuery,
  UpdateGeocodingConfigMutation,
  UpdateGeocodingConfigMutationVariables,
} from "@/__generated__/types";
import { AreaSetCode, GeocodingType } from "@/types";
import { DataSourceGeocodingConfigSchema, GeocodingOnAreaSetType } from "@/zod";
import { AreaSetCodeLabels, GeocodingTypeLabels } from "./labels";

export default function GeocodeDataSourceForm({
  dataSource,
}: {
  dataSource: Exclude<DataSourceQuery["dataSource"], null | undefined>;
}) {
  const initialState = getInitialState(dataSource);

  const [column, setColumn] = useState(initialState.column);
  const [type, setType] = useState<GeocodingType>(initialState.type);
  const [areaSetCode, setAreaSetCode] = useState<AreaSetCode | "">(
    initialState.areaSetCode,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      await updateGeocodingConfig({
        variables: { id: dataSource.id, rawGeocodingConfig: geocodingConfig },
      });
    } catch (e) {
      console.error(`Could not update geocoding config: ${e}`);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit}>
      <select value={column} onChange={(e) => setColumn(e.target.value)}>
        <option value="">Select a column to geocode on</option>
        {dataSource.columnDefs.map((cd) => (
          <option key={cd.name} value={cd.name}>
            {cd.name}
          </option>
        ))}
      </select>
      <select
        value={type}
        onChange={(e) => setType(e.target.value as GeocodingType)}
      >
        <option value={GeocodingType.none}>What kind of data is this?</option>
        {Object.keys(GeocodingTypeLabels)
          .filter((type) => type !== GeocodingType.none)
          .map((type) => (
            <option key={type} value={type}>
              {GeocodingTypeLabels[type as GeocodingType]}
            </option>
          ))}
      </select>
      {type in GeocodingOnAreaSetType ? (
        <select
          value={areaSetCode}
          onChange={(e) => setAreaSetCode(e.target.value as AreaSetCode)}
        >
          <option value="">What kind of area is this?</option>
          {Object.keys(AreaSetCodeLabels)
            .filter((type) => type !== AreaSetCode.PC)
            .map((type) => (
              <option key={type} value={type}>
                {AreaSetCodeLabels[type as AreaSetCode]}
              </option>
            ))}
        </select>
      ) : null}
      <button disabled={!validGeocodingConfig || loading}>Submit</button>
      {error ? (
        <div>
          <small>{error}</small>
        </div>
      ) : null}
    </form>
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
