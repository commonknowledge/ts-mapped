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
      <FormFieldWrapper
        label="Audience ID"
        id="listId"
        helpText={AudienceHelpText}
        hint="In the Audience tab, select More&nbsp;options&nbsp;>&nbsp;Audience&nbsp;settings."
      >
        <Input
          type="text"
          placeholder="5xxxxxxxx6"
          required
          id="listId"
          value={config.listId || ""}
          onChange={(e) => onChange({ listId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="API Key"
        id="apiKey"
        helpText={APIKeyHelpText}
        hint="Generate a new API key in Profile&nbsp;>&nbsp;Extras."
      >
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

const AudienceHelpText = (
  <>
    <h3>How to find your Audience ID in Mailchimp</h3>
    <ol>
      <li>Click Audience.</li>
      <li>
        If you have more than one audience, click the Audience drop-down and
        choose the one you want to work with.
      </li>
      <li>
        Click the More options drop-down menu, then select Audience settings.
      </li>
      <li>
        In the table of settings, find the one labeled Audience ID and copy it.
      </li>
      <li>Paste the Audience ID in the Audience ID field here.</li>
    </ol>
  </>
);

const APIKeyHelpText = (
  <>
    <h3>How to generate an API key in Mailchimp</h3>
    <ol>
      <li>Click your profile icon and choose Profile.</li>
      <li>Click the Extras drop-down then choose API keys.</li>
      <li>In the Your API Keys section, click Create A Key.</li>
      <li>
        Name your key. Be descriptive, so you know what app uses that key. Keep
        in mind that you’ll see only this name and the first 4 key digits on
        your list of API keys.
      </li>
      <li>Click Generate Key.</li>
      <li>
        Click Copy Key to Clipboard. Save your key someplace secure–you won’t be
        able to see or copy it again. If you lose this key, you’ll need to
        generate a new key and update any integration that uses it.
      </li>
      <li>Click Done.</li>
      <li>Paste your API key into the API key field here.</li>
    </ol>
  </>
);
