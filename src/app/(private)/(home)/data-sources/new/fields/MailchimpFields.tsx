import DataListRow from "@/components/DataListRow";
import { DataSourceType } from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";
import type { NewDataSourceConfig } from "../schema";

export default function MailchimpFields({
  config,
  onChange,
}: {
  config: Partial<NewDataSourceConfig>;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.Mailchimp) {
    return null;
  }

  return (
    <>
      <DataListRow label="List ID">
        <Input
          type="text"
          placeholder="List ID"
          value={config.listId || ""}
          onChange={(e) => onChange({ listId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="Server Prefix">
        <Input
          type="text"
          placeholder="Server Prefix"
          value={config.serverPrefix || ""}
          onChange={(e) => onChange({ serverPrefix: e.target.value })}
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
