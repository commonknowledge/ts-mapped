"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useState } from "react";
import { toast } from "sonner";
import DataSourceIcon from "@/components/DataSourceIcon";
import FormFieldWrapper, {
  FormFieldError,
} from "@/components/forms/FormFieldWrapper";
import PageHeader from "@/components/PageHeader";
import { DataSourceRecordTypeLabels, DataSourceTypeLabels } from "@/labels";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { DataSourceType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { uploadFile } from "@/services/uploads";
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
  const oAuthState = useOAuthState();

  // Manually manage loading state to account for success redirect duration
  const [isNavigating, setIsNavigating] = useState(false);

  const trpc = useTRPC();
  const {
    mutate: createDataSource,
    isPending,
    error,
  } = useMutation(
    trpc.dataSource.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/data-sources/${data.id}/config`);
      },
      onError: () => {
        setIsNavigating(false);
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      name: oAuthState?.dataSourceName || "",
      recordType: oAuthState?.recordType || ("" as DataSourceRecordType),
      config: (oAuthState?.dataSourceType
        ? { type: oAuthState?.dataSourceType }
        : undefined) as NewDataSourceConfig | undefined,
    },
    onSubmit: async ({ value }) => {
      if (!organisationId) return toast.error("No organisation selected");
      if (!value.config) return toast.error("No config added");
      const preparedConfig = await prepareDataSource(value.config);
      setIsNavigating(true);
      createDataSource({ ...value, config: preparedConfig, organisationId });
    },
  });

  const fieldErrors = error?.data?.zodError?.fieldErrors;
  const formError = error?.data?.formError;

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <PageHeader
        title="New data source"
        description="Create a new data source to import into your maps."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col items-start gap-6 max-w-[40ch] mt-8"
      >
        <form.Field name="name">
          {(field) => (
            <FormFieldWrapper
              label="Name"
              id={field.name}
              error={fieldErrors?.[field.name]}
            >
              <Input
                type="text"
                autoFocus
                id={field.name}
                placeholder="Name"
                value={field.state.value}
                className="w-full"
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </FormFieldWrapper>
          )}
        </form.Field>

        <form.Field name="recordType">
          {(field) => (
            <FormFieldWrapper
              label="Data type"
              id={field.name}
              error={fieldErrors?.[field.name]}
            >
              <Select
                required
                value={field.state.value || ""}
                onValueChange={(value) =>
                  field.handleChange(value as DataSourceRecordType)
                }
              >
                <SelectTrigger className="w-full" id={field.name}>
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
            </FormFieldWrapper>
          )}
        </form.Field>

        <form.Field name="config.type">
          {(field) => (
            <FormFieldWrapper
              label="Source type"
              id={field.name}
              error={fieldErrors?.[field.name]}
            >
              <Select
                required
                value={field.state.value || ""}
                onValueChange={(value) =>
                  field.handleChange(value as DataSourceType)
                }
              >
                <SelectTrigger className="w-full" id={field.name}>
                  <SelectValue placeholder="Choose a type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DataSourceType).map((type) => (
                    <SelectItem key={type} value={type}>
                      <DataSourceIcon type={type} />
                      {DataSourceTypeLabels[type as DataSourceType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldWrapper>
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
                <div className="flex flex-col items-start gap-6 w-full">
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
                  <FormFieldError error={fieldErrors?.config} />
                </div>
              )}
            </>
          )}
        </form.Subscribe>

        <Button disabled={isNavigating || isPending} type="submit">
          {isNavigating ? "Creating..." : "Configure fields"}
        </Button>

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
  config: NewDataSourceConfig,
): Promise<DataSourceConfig> => {
  if (config.type === DataSourceType.CSV) {
    const url = await uploadFile(config.file);
    return { ...config, url };
  }
  return config;
};

const useOAuthState = () => {
  const searchParams = useSearchParams();
  try {
    const rawState = JSON.parse(searchParams.get("state") || "{}");
    return defaultStateSchema.parse(rawState);
  } catch {
    return null;
  }
};
