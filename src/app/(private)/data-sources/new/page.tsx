"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import {
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables,
} from "@/__generated__/types";
import { DataSourceTypeLabels } from "@/labels";
import { DataSourceType, UploadResponseBody } from "@/types";
import { DataSourceConfig, DataSourceConfigSchema } from "@/zod";
import AirtableFields from "./fields/AirtableFields";
import CSVFields from "./fields/CSVFields";
import MailchimpFields from "./fields/MailchimpFields";
import { NewDataSourceConfig } from "./types";
import PageHeader from "@/components/PageHeader";
import { Separator } from "@/shadcn/ui/separator";
import { Input } from "@/shadcn/ui/input";
import DataListRow from "@/components/DataListRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Button } from "@/shadcn/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import Link from "next/link";
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
        throw new Error(String(result.errors));
      } else {
        router.push(`/data-sources/${dataSourceId}/geocode`);
        return;
      }
    } catch (e) {
      console.error(`Could not create data source: ${e}`);
      setError("Could not create data source.");
    }

    setLoading(false);
  };

  const { data: validConfig } = DataSourceConfigSchema.safeParse(config);
  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/data-sources">Data sources</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>New</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title="New Data Source"
        description="Create a new data source to import into your maps."
      />
      <Separator className="my-4" />
      <form onSubmit={onSubmit} className="max-w-2xl ">
        <DataListRow label="Name">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </DataListRow>
        <DataListRow label="Type" border>
          <Select
            value={config.type}
            onValueChange={(value) =>
              onChangeConfig({ type: value as DataSourceType })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Choose a type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(DataSourceType).map((type) => (
                <SelectItem key={type} value={type}>
                  {DataSourceTypeLabels[type as DataSourceType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataListRow>

        {/* Each field set only displays if config.type matches */}
        <div className="mb-10">
          <AirtableFields config={config} onChange={onChangeConfig} />
          <CSVFields config={config} onChange={onChangeConfig} />
          <MailchimpFields config={config} onChange={onChangeConfig} />
        </div>
        <Button disabled={!validConfig || loading}>Submit</Button>
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

  if (clientConfig.type !== DataSourceType.csv) {
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
