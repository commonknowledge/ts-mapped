import DataListRow from "@/components/DataListRow";
import { Input } from "@/shadcn/ui/input";
import { DataSourceType } from "@/types";
import { NewDataSourceConfig } from "../types";

export default function MailchimpFields({
  config,
  onChange,
}: {
  config: Partial<NewDataSourceConfig>;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.mailchimp) {
    return null;
  }

  return (
    <>
      <DataListRow label="List ID">
        <Input
          type="text"
          placeholder="5xxxxxxxx6"
          value={config.listId || ""}
          onChange={(e) => onChange({ listId: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="API Key">
        <Input
          type="text"
          placeholder="1...2-xx00"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </DataListRow>
    </>
  );
}
