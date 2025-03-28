import { DataSourceType } from "@/types";
import { NewDataSourceConfig } from "../types";

export default function AirtableFields({
  config,
  onChange,
}: {
  config: NewDataSourceConfig;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.Airtable) {
    return;
  }

  return (
    <>
      <input
        type="text"
        placeholder="Base ID"
        value={config.baseId || ""}
        onChange={(e) => onChange({ baseId: e.target.value })}
      />
      <input
        type="text"
        placeholder="Table ID"
        value={config.tableId || ""}
        onChange={(e) => onChange({ tableId: e.target.value })}
      />
      <input
        type="text"
        placeholder="API Key"
        value={config.apiKey || ""}
        onChange={(e) => onChange({ apiKey: e.target.value })}
      />
    </>
  );
}
