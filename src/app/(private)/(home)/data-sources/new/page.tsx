"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext } from "react";
import { toast } from "sonner";
import DataListRow from "@/components/DataListRow";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { DataSourceRecordTypeLabels, DataSourceTypeLabels } from "@/labels";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { DataSourceType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
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
import ActionNetworkFields from "./fields/ActionNetworkFields";
import AirtableFields from "./fields/AirtableFields";
import CSVFields from "./fields/CSVFields";
import GoogleSheetsFields from "./fields/GoogleSheetsFields";
import MailchimpFields from "./fields/MailchimpFields";
import { type NewDataSourceConfig, defaultStateSchema } from "./schema";
import type {
  DataSourceConfig,
  DataSourceRecordType,
} from "@/server/models/DataSource";

export default function NewDataSourcePage() {
  const { organisationId } = useContext(OrganisationsContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const parsedState = defaultStateSchema.parse(searchParams.get("state") || {});

  const trpc = useTRPC();

  const {
    mutate: createDataSource,
    error,
    isPending,
  } = useMutation(
    trpc.dataSource.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/data-sources/${data.id}/config`);
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: parsedState.dataSourceName || "",
      recordType: parsedState.recordType || ("" as DataSourceRecordType),
      config: (parsedState.dataSourceType
        ? { type: parsedState.dataSourceType }
        : undefined) as NewDataSourceConfig | undefined,
    },
    onSubmit: async ({ value }) => {
      if (!organisationId) return toast.error("No organisation selected");
      if (!value.config) return toast.error("No config added");
      const preparedConfig = await prepareDataSource(value.config);
      createDataSource({ ...value, config: preparedConfig, organisationId });
    },
  });

  const fieldErrors = error?.data?.zodError?.fieldErrors;
  const formError = error?.data?.formError;

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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="max-w-2xl"
      >
        <form.Field name="name">
          {(field) => (
            <>
              <DataListRow label="Name" name={field.name}>
                <Input
                  type="text"
                  id={field.name}
                  placeholder="Name"
                  value={field.state.value}
                  className="w-50"
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
                {fieldErrors?.[field.name] && (
                  <div className="text-xs text-red-500 mt-1">
                    {fieldErrors[field.name]?.join(", ")}
                  </div>
                )}
              </DataListRow>
            </>
          )}
        </form.Field>

        <form.Field name="recordType">
          {(field) => (
            <DataListRow label="Data type" border name={field.name}>
              <Select
                required
                value={field.state.value || ""}
                onValueChange={(value) =>
                  field.handleChange(value as DataSourceRecordType)
                }
              >
                <SelectTrigger className="w-50" id={field.name}>
                  <SelectValue placeholder="Choose a record type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DataSourceRecordTypeLabels).map((type) => (
                    <SelectItem key={type} value={type}>
                      {DataSourceRecordTypeLabels[type as DataSourceRecordType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors?.[field.name] && (
                <div className="text-xs text-red-500 mt-1">
                  {fieldErrors[field.name]?.join(", ")}
                </div>
              )}
            </DataListRow>
          )}
        </form.Field>

        <form.Field name="config.type">
          {(field) => (
            <DataListRow label="Source type" name={field.name}>
              <Select
                required
                value={field.state.value || ""}
                onValueChange={(value) =>
                  field.handleChange(value as DataSourceType)
                }
              >
                <SelectTrigger className="w-50" id={field.name}>
                  <SelectValue placeholder="Choose a type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DataSourceType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {DataSourceTypeLabels[type as DataSourceType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors?.[field.name] && (
                <div className="text-xs text-red-500 mt-1">
                  {fieldErrors[field.name]?.join(", ")}
                </div>
              )}
            </DataListRow>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({
            config: state.values.config,
            dataSourceName: state.values.name,
            recordType: state.values.recordType,
          })}
        >
          {({ config, dataSourceName, recordType }) => (
            <>
              {config && (
                <div className="mb-10">
                  <ConfigFields
                    config={config}
                    dataSourceName={dataSourceName}
                    recordType={recordType}
                    onChange={(update) =>
                      form.setFieldValue("config", {
                        ...config,
                        ...update,
                      } as NewDataSourceConfig)
                    }
                  />
                  {fieldErrors?.config && (
                    <div className="text-xs text-red-500 mt-1">
                      {fieldErrors.config?.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </form.Subscribe>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button disabled={!canSubmit || isPending} type="submit">
              {isSubmitting || isPending ? "Creating..." : "Configure fields"}
            </Button>
          )}
        </form.Subscribe>
        {formError && <p className="text-xs mt-2 text-red-500">{formError}</p>}
      </form>
    </div>
  );
}

function ConfigFields({
  config,
  dataSourceName,
  recordType,
  onChange,
}: {
  config: NewDataSourceConfig;
  dataSourceName: string;
  recordType: DataSourceRecordType;
  onChange: (update: Partial<NewDataSourceConfig>) => void;
}) {
  switch (config.type) {
    case DataSourceType.ActionNetwork:
      return <ActionNetworkFields config={config} onChange={onChange} />;
    case DataSourceType.Airtable:
      return <AirtableFields config={config} onChange={onChange} />;
    case DataSourceType.CSV:
      return <CSVFields config={config} onChange={onChange} />;
    case DataSourceType.GoogleSheets:
      return (
        <GoogleSheetsFields
          dataSourceName={dataSourceName}
          recordType={recordType}
          config={config}
          onChange={onChange}
        />
      );
    case DataSourceType.Mailchimp:
      return <MailchimpFields config={config} onChange={onChange} />;
    default:
      return null;
  }
}

const prepareDataSource = async (
  config: NewDataSourceConfig
): Promise<DataSourceConfig> => {
  if (config.type === DataSourceType.CSV) {
    const url = await uploadFile(config.file);
    return { ...config, url };
  }
  return config;
};
