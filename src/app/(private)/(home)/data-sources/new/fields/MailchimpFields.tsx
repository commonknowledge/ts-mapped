import DataListRow from "@/components/DataListRow";
import { DataSourceType } from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";
import type { MailchimpConfig } from "@/server/models/DataSource";

export default function MailchimpFields({
  config,
  onChange,
}: {
  config: Partial<MailchimpConfig>;
  onChange: (
    config: Partial<
      Pick<MailchimpConfig, "listId" | "serverPrefix" | "apiKey">
    >,
  ) => void;
}) {
  if (config.type !== DataSourceType.Mailchimp) return;

  return (
    <>
      <DataListRow label="List ID" name="listId">
        <Input
          type="text"
          required
          id="listId"
          placeholder="List ID"
          value={config.listId || ""}
          onChange={(e) => onChange({ listId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="Server Prefix" name="serverPrefix">
        <Input
          type="text"
          required
          id="serverPrefix"
          placeholder="Server Prefix"
          value={config.serverPrefix || ""}
          onChange={(e) => onChange({ serverPrefix: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="API Key" name="apiKey">
        <Input
          type="text"
          required
          id="apiKey"
          placeholder="API Key"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </DataListRow>
    </>
  );
}
