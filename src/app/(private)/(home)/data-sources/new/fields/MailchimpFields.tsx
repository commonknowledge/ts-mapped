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
    config: Partial<Pick<MailchimpConfig, "listId" | "apiKey">>,
  ) => void;
}) {
  if (config.type !== DataSourceType.Mailchimp) return;

  return (
    <>
      <DataListRow label="List ID" name="listId">
        <Input
          type="text"
          placeholder="5xxxxxxxx6"
          required
          id="listId"
          value={config.listId || ""}
          onChange={(e) => onChange({ listId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="API Key">
        <Input
          type="text"
          placeholder="1...2-xx00"
          required
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </DataListRow>
    </>
  );
}
