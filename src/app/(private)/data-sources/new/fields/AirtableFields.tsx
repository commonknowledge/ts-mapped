import DataListRow from "@/components/DataListRow";
import { Input } from "@/shadcn/ui/input";
import { DataSourceType } from "@/types";
import { NewDataSourceConfig } from "../types";

export default function AirtableFields({
  config,
  onChange,
}: {
  config: NewDataSourceConfig;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.airtable) {
    return;
  }

  return (
    <>
      <DataListRow label="Base ID" id="airtable-base-id">
        <Input
          type="text"
          placeholder="Base ID"
          value={config.baseId || ""}
          onChange={(e) => onChange({ baseId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="Table ID" id="airtable-table-id">
        <Input
          type="text"
          placeholder="Table ID"
          value={config.tableId || ""}
          onChange={(e) => onChange({ tableId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="API Key" id="airtable-api-key">
        <Input
          type="text"
          placeholder="API Key"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </DataListRow>
    </>
  );
}
