import DataListRow from "@/components/DataListRow";
import { DataSourceType } from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";
import type { NewDataSourceConfig } from "../schema";

export default function AirtableFields({
  config,
  onChange,
}: {
  config: Partial<NewDataSourceConfig>;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.Airtable) {
    return;
  }

  return (
    <>
      <DataListRow label="Base ID">
        <Input
          type="text"
          placeholder="Base ID"
          value={config.baseId || ""}
          onChange={(e) => onChange({ baseId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="Table ID">
        <Input
          type="text"
          placeholder="Table ID"
          value={config.tableId || ""}
          onChange={(e) => onChange({ tableId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="API Key">
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
