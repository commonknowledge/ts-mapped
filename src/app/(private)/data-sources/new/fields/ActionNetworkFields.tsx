import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceType } from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";
import type { ActionNetworkConfig } from "@/server/models/DataSource";

export default function ActionNetworkFields({
  config,
  onChange,
}: {
  config: Partial<ActionNetworkConfig>;
  onChange: (config: Partial<Pick<ActionNetworkConfig, "apiKey">>) => void;
}) {
  if (config.type !== DataSourceType.ActionNetwork) return;

  return (
    <FormFieldWrapper
      label="API Key"
      id="apiKey"
      hint="From the Start Organizing menu in Action Network, select&nbsp;Details&nbsp;>&nbsp;API & Sync."
      helpText={HelpText}
    >
      <Input
        type="text"
        required
        className="w-full"
        id="apiKey"
        value={config.apiKey || ""}
        onChange={(e) => onChange({ apiKey: e.target.value })}
      />
    </FormFieldWrapper>
  );
}

const HelpText = (
  <>
    <h3>How to generate an API key in Action Network</h3>
    <p>
      To configure this, you will need an&nbsp;
      <a href="https://actionnetwork.org/" target="_blank" rel="noreferrer">
        Action Network
      </a>
       account with&nbsp;
      <a
        href="https://docs.n8n.io/integrations/builtin/credentials/actionnetwork/#request-api-access"
        target="_blank"
        rel="noreferrer"
      >
        API key access enabled
      </a>
       and an API Key.
    </p>
    <ol>
      <li>Log in to your Action Network account.</li>
      <li>
        From the Start Organizing menu, select Details&nbsp;&gt;&nbsp;
        <a href="actionnetwork.org/apis" target="_blank" rel="noreferrer">
          API & Sync
        </a>
        .
      </li>
      <li>Select the list you want to generate an API key for.</li>
      <li>Generate an API key for that list.</li>
      <li>Copy the API Key and paste it into the API key field here.</li>
    </ol>
  </>
);
