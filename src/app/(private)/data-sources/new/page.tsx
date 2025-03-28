"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import {
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables,
} from "@/__generated__/types";
import { DataSourceType, UploadResponseBody } from "@/types";
import { DataSourceConfig, DataSourceConfigSchema } from "@/zod";
import AirtableFields from "./fields/AirtableFields";
import CSVFields from "./fields/CSVFields";
import MailchimpFields from "./fields/MailchimpFields";
import { NewDataSourceConfig } from "./types";

export default function NewDataSourcePage() {
  const [name, setName] = useState("");
  const [config, setConfig] = useState<NewDataSourceConfig>({
    type: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onChangeConfig = (update: Partial<NewDataSourceConfig>) => {
    setConfig(Object.assign({}, config, update));
  };

  const [createDataSource] = useMutation<
    CreateDataSourceMutation,
    CreateDataSourceMutationVariables
  >(gql`
    mutation CreateDataSource($name: String!, $rawConfig: JSON!) {
      createDataSource(name: $name, rawConfig: $rawConfig) {
        result {
          id
        }
        code
      }
    }
  `);

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const preparedConfig = await prepareDataSource(config);

      const result = await createDataSource({
        variables: { name, rawConfig: preparedConfig },
      });

      const dataSourceId = result.data?.createDataSource.result?.id;
      if (result.errors || !dataSourceId) {
        setError("Could not create data source.");
      } else {
        router.push(`/data-sources/geocode/${dataSourceId}`);
        return
      }
    } catch (e) {
      console.error(`Could not create data source: ${e}`)
    }

    setLoading(false);
  };

  const { data: validDataSource } = DataSourceConfigSchema.safeParse(config);
  return (
    <div className="container">
      <h1>New Data Source</h1>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          value={config.type}
          onChange={(e) =>
            onChangeConfig({ type: e.target.value as DataSourceType })
          }
        >
          <option value="">Choose a type</option>
          {Object.keys(DataSourceType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {/* Each field set only displays if config.type matches */}
        <AirtableFields config={config} onChange={onChangeConfig} />
        <CSVFields config={config} onChange={onChangeConfig} />
        <MailchimpFields config={config} onChange={onChangeConfig} />
        <button disabled={!validDataSource || loading}>Submit</button>
        {error ? (
          <div>
            <small>{error}</small>
          </div>
        ) : null}
      </form>
    </div>
  );
}

// Take preparatory actions before this data source can be created
const prepareDataSource = async (
  clientConfig: NewDataSourceConfig
): Promise<DataSourceConfig> => {
  if (clientConfig.type === "") {
    throw new Error("Invalid data source config");
  }

  if (clientConfig.type !== DataSourceType.CSV) {
    return clientConfig;
  }

  clientConfig.filename = await uploadFile(clientConfig.file);
  return clientConfig;
};

const uploadFile = async (file: File | null): Promise<string> => {
  if (!file) {
    throw new Error("Invalid file");
  }
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/upload", {
    body,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to upload file");
  }
  const data: UploadResponseBody = await response.json();
  return data.filename;
};
