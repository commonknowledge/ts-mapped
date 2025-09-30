import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceType } from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";
import type { AirtableConfig } from "@/server/models/DataSource";

export default function AirtableFields({
  config,
  onChange,
}: {
  config: Partial<AirtableConfig>;
  onChange: (
    config: Partial<Pick<AirtableConfig, "apiKey" | "baseId" | "tableId">>,
  ) => void;
}) {
  if (config.type !== DataSourceType.Airtable) return;

  return (
    <>
      <FormFieldWrapper label="Base ID" id="baseId">
        <Input
          type="text"
          required
          placeholder="Base ID"
          className="w-full"
          id="baseId"
          value={config.baseId || ""}
          onChange={(e) => onChange({ baseId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper label="Table ID" id="tableId">
        <Input
          type="text"
          required
          placeholder="Table ID"
          id="tableId"
          className="w-full"
          value={config.tableId || ""}
          onChange={(e) => onChange({ tableId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper label="API Key" id="apiKey">
        <Input
          type="text"
          required
          placeholder="API Key"
          className="w-full"
          id="apiKey"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </FormFieldWrapper>
    </>
  );
}
