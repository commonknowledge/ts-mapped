import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceType } from "@/server/models/DataSource";
import { Badge } from "@/shadcn/ui/badge";
import { Input } from "@/shadcn/ui/input";
import type { AirtableConfig } from "@/server/models/DataSource";

export default function AirtableFields({
  config,
  onChange,
}: {
  config: Partial<AirtableConfig>;
  onChange: (
    config: Partial<Pick<AirtableConfig, "apiKey" | "baseId" | "tableId">>,
  ) => void;
}) {
  if (config.type !== DataSourceType.Airtable) return;

  return (
    <>
      <FormFieldWrapper
        label="Base ID"
        id="baseId"
        helpText={IdsHelpText}
        hint={
          <>
            The path in the URL of your base that begins with{" "}
            <Badge variant="secondary">app</Badge>
          </>
        }
      >
        <Input
          type="text"
          required
          className="w-full"
          id="baseId"
          value={config.baseId || ""}
          onChange={(e) => onChange({ baseId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Table ID"
        id="tableId"
        helpText={IdsHelpText}
        hint={
          <>
            The path in the URL of your base that begins with{" "}
            <Badge variant="secondary">tbl</Badge>
          </>
        }
      >
        <Input
          type="text"
          required
          id="tableId"
          className="w-full"
          value={config.tableId || ""}
          onChange={(e) => onChange({ tableId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Personal access token"
        id="apiKey"
        helpText={TokenHelpText}
        hint="Generate a new personal access token in the Airtable Builder Hub."
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
    </>
  );
}

const IdsHelpText = (
  <>
    <h3>How to find your Base ID and Table ID in Airtable</h3>
    <p>
      Both the Base ID and Table ID are available in the Airtable website URL
      when viewing your data.
    </p>
    <ol>
      <li>Go to your Airtable Base.</li>
      <li>
        Copy the path in the URL that begins with app and paste it into the Base
        ID field here.
      </li>
      <li>
        Copy the path in the URL that begins with tbl and paste it into the
        Table ID field here.
      </li>
    </ol>
  </>
);

const TokenHelpText = (
  <>
    <h3>How to generate a Personal access token in Airtable</h3>
    <ol>
      <li>Log in to Airtable.</li>
      <li>From the main menu, select Builder Hub.</li>
      <li>Click Create Token.</li>
      <li>Enter your preferred name.</li>
      <li>
        Under Scope, add
        <ul>
          <li>&quot;data.records:read&quot;</li>
          <li>&quot;data.records:write&quot;</li>
          <li>&quot;schema.bases:read&quot;</li>
          <li>&quot;schema.tables:write&quot;</li>
          <li>&quot;webhooks:manage&quot;</li>
        </ul>
      </li>
      <li>Under Access, select the base or bases you want to include.</li>
      <li>Click Create token.</li>
      <li>Copy your token and click Done (this will only be shown once).</li>
      <li>Paste the token under the Personal Access Token field here.</li>
    </ol>
  </>
);
