import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceType } from "@/server/models/DataSource";
import { Badge } from "@/shadcn/ui/badge";
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
      <FormFieldWrapper
        label="Base ID"
        id="baseId"
        hint={
          <>
            The path in the URL of your base that begins with{" "}
            <Badge variant="secondary">app</Badge>
          </>
        }
      >
        <Input
          type="text"
          required
          className="w-full"
          id="baseId"
          value={config.baseId || ""}
          onChange={(e) => onChange({ baseId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Table ID"
        id="tableId"
        hint={
          <>
            The path in the URL of your base that begins with{" "}
            <Badge variant="secondary">tbl</Badge>
          </>
        }
      >
        <Input
          type="text"
          required
          id="tableId"
          className="w-full"
          value={config.tableId || ""}
          onChange={(e) => onChange({ tableId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Personal access token"
        id="apiKey"
        hint="Generate a new personal access token in the Airtable Builder Hub."
      >
        <Input
          type="text"
          required
          className="w-full"
          id="apiKey"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </FormFieldWrapper>
    </>
  );
}
