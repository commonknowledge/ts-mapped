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
    config: Partial<Pick<MailchimpConfig, "listId" | "apiKey">>,
  ) => void;
}) {
  if (config.type !== DataSourceType.Mailchimp) return;

  return (
    <>
      <FormFieldWrapper label="List ID" id="listId">
        <Input
          type="text"
          placeholder="5xxxxxxxx6"
          required
          id="listId"
          value={config.listId || ""}
          onChange={(e) => onChange({ listId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper label="API Key" id="apiKey">
        <Input
          type="text"
          required
          placeholder="1...2-xx00"
          id="apiKey"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </FormFieldWrapper>
    </>
  );
}
