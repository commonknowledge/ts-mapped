import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
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
      <FormFieldWrapper label="List ID" id="listId">
        <Input
          type="text"
          required
          id="listId"
          placeholder="List ID"
          value={config.listId || ""}
          onChange={(e) => onChange({ listId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper label="Server Prefix" id="serverPrefix">
        <Input
          type="text"
          required
          id="serverPrefix"
          placeholder="Server Prefix"
          value={config.serverPrefix || ""}
          onChange={(e) => onChange({ serverPrefix: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper label="API Key" id="apiKey">
        <Input
          type="text"
          required
          id="apiKey"
          placeholder="API Key"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </FormFieldWrapper>
    </>
  );
}
