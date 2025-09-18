import DataListRow from "@/components/DataListRow";
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
      <DataListRow label="Base ID" name="baseId">
        <Input
          type="text"
          required
          placeholder="Base ID"
          className="w-50"
          id="baseId"
          value={config.baseId || ""}
          onChange={(e) => onChange({ baseId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="Table ID" name="tableId">
        <Input
          type="text"
          required
          placeholder="Table ID"
          id="tableId"
          className="w-50"
          value={config.tableId || ""}
          onChange={(e) => onChange({ tableId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="API Key" name="apiKey">
        <Input
          type="text"
          required
          placeholder="API Key"
          className="w-50"
          id="apiKey"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </DataListRow>
    </>
  );
}
