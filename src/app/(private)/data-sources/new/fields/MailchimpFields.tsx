import { DataSourceType } from "@/types";
import { NewDataSourceConfig } from "../types";

export default function MailchimpInputs({
  config,
  onChange,
}: {
  config: NewDataSourceConfig;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.Mailchimp) {
    return null;
  }

  return (
    <>
      <input
        type="text"
        placeholder="List ID"
        value={config.listId || ""}
        onChange={(e) => onChange({ listId: e.target.value })}
      />
      <input
        type="text"
        placeholder="Server Prefix"
        value={config.serverPrefix || ""}
        onChange={(e) => onChange({ serverPrefix: e.target.value })}
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
