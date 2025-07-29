"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { SyntheticEvent, useCallback, useContext, useState } from "react";
import {
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { DataSourceTypeLabels } from "@/labels";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { uploadFile } from "@/services/uploads";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { DataSourceType } from "@/types";
import { DataSourceConfig } from "@/zod";
import ActionNetworkFields from "./fields/ActionNetworkFields";
import AirtableFields from "./fields/AirtableFields";
import CSVFields from "./fields/CSVFields";
import GoogleSheetsFields from "./fields/GoogleSheetsFields";
import MailchimpFields from "./fields/MailchimpFields";
import { NewDataSourceConfig, NewDataSourceConfigSchema } from "./types";

// Loose type for incomplete config
type ConfigState = Partial<NewDataSourceConfig> | { type: "" };

export default function NewDataSourcePage() {
  const { organisationId } = useContext(OrganisationsContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Saved state from OAuth flow - { dataSourceName, dataSourceType }
  const state: Record<string, string> = JSON.parse(
    searchParams.get("state") || "{}",
  );

  const [name, setName] = useState(state.dataSourceName || "");
  const [config, setConfig] = useState<ConfigState>({
    type: (state.dataSourceType as DataSourceType) || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChangeConfig = useCallback(
    (update: Partial<NewDataSourceConfig>) => {
      setConfig(Object.assign({}, config, update));
    },
    [config],
  );

  const [createDataSource] = useMutation<
    CreateDataSourceMutation,
    CreateDataSourceMutationVariables
  >(gql`
    mutation CreateDataSource(
      $name: String!
      $organisationId: String!
      $rawConfig: JSON!
    ) {
      createDataSource(
        name: $name
        organisationId: $organisationId
        rawConfig: $rawConfig
      ) {
        result {
          id
        }
        code
      }
    }
  `);

  const { data: validConfig } = NewDataSourceConfigSchema.safeParse(config);

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!organisationId) {
        throw new Error("No organisation selected");
      }

      if (!validConfig) {
        throw new Error("Invalid config");
      }

      const preparedConfig = await prepareDataSource(validConfig);

      const result = await createDataSource({
        variables: { name, organisationId, rawConfig: preparedConfig },
      });

      const dataSourceId = result.data?.createDataSource?.result?.id;
      if (result.errors || !dataSourceId) {
        throw new Error(String(result.errors));
      } else {
        router.push(`/data-sources/${dataSourceId}/config`);
        return;
      }
    } catch (e) {
      console.error(`Could not create data source: ${e}`);
      setError("Could not create data source.");
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
          <BreadcrumbItem>New</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title="New Data Source"
        description="Create a new data source to import into your maps."
      />
      <Separator className="my-4" />
      <form
        onSubmit={onSubmit}
        className="max-w-2xl "
        id="joyride-datasources-new-form"
      >
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
          {config.type !== "" && (
            <>
              <ActionNetworkFields config={config} onChange={onChangeConfig} />
              <AirtableFields config={config} onChange={onChangeConfig} />
              <CSVFields config={config} onChange={onChangeConfig} />
              <GoogleSheetsFields
                dataSourceName={name}
                config={config}
                onChange={onChangeConfig}
              />
              <MailchimpFields config={config} onChange={onChangeConfig} />
            </>
          )}
        </div>
        <Button
          disabled={!validConfig || loading}
          id="joyride-datasources-new-form-submit"
        >
          Submit
        </Button>
        {error && (
          <div>
            <span className="text-xs text-red-500">{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}

const prepareDataSource = async (
  config: NewDataSourceConfig,
): Promise<DataSourceConfig> => {
  if (config.type === DataSourceType.csv) {
    const url = await uploadFile(config.file);
    return { ...config, url };
  }

  return config;
};
