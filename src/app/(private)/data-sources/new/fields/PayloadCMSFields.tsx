import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceType } from "@/server/models/DataSource";
import { Badge } from "@/shadcn/ui/badge";
import { Input } from "@/shadcn/ui/input";
import type { PayloadCMSConfig } from "@/server/models/DataSource";

export default function PayloadCMSFields({
  config,
  onChange,
}: {
  config: Partial<PayloadCMSConfig>;
  onChange: (
    config: Partial<
      Pick<PayloadCMSConfig, "apiBaseUrl" | "apiKey" | "collectionName">
    >,
  ) => void;
}) {
  if (config.type !== DataSourceType.PayloadCMS) return;

  return (
    <>
      <FormFieldWrapper
        label="API Base URL"
        id="apiBaseUrl"
        helpText={ApiBaseUrlHelpText}
        hint="The base URL of your PayloadCMS instance (e.g., https://your-site.com)"
      >
        <Input
          type="url"
          required
          className="w-full"
          id="apiBaseUrl"
          placeholder="https://your-site.com"
          value={config.apiBaseUrl || ""}
          onChange={(e) => onChange({ apiBaseUrl: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Collection Name"
        id="collectionName"
        helpText={CollectionNameHelpText}
        hint="The slug of the collection you want to import (e.g., posts, pages)"
      >
        <Input
          type="text"
          required
          id="collectionName"
          className="w-full"
          placeholder="posts"
          value={config.collectionName || ""}
          onChange={(e) => onChange({ collectionName: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="API Key"
        id="apiKey"
        helpText={ApiKeyHelpText}
        hint="Your PayloadCMS API key for authentication"
      >
        <Input
          type="password"
          required
          className="w-full"
          id="apiKey"
          placeholder="your-api-key"
          value={config.apiKey || ""}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
      </FormFieldWrapper>
    </>
  );
}

const ApiBaseUrlHelpText = (
  <>
    <h3>API Base URL</h3>
    <p>
      This is the base URL of your PayloadCMS instance. It should include the
      protocol (https://) but not the <Badge variant="secondary">/api</Badge>{" "}
      path.
    </p>
    <p>Example: https://your-site.com</p>
  </>
);

const CollectionNameHelpText = (
  <>
    <h3>Collection Name</h3>
    <p>
      The collection slug as defined in your PayloadCMS configuration. This is
      the name used in the API endpoints.
    </p>
    <p>
      For example, if your collection is accessible at{" "}
      <Badge variant="secondary">/api/posts</Badge>, the collection name is{" "}
      <Badge variant="secondary">posts</Badge>.
    </p>
  </>
);

const ApiKeyHelpText = (
  <>
    <h3>How to generate an API Key in PayloadCMS</h3>
    <ol>
      <li>Log in to your PayloadCMS admin panel.</li>
      <li>
        Navigate to the Users collection (or wherever API keys are configured
        in your instance).
      </li>
      <li>
        Create a new API key with permissions to read and write data in your
        collection.
      </li>
      <li>Copy the API key and paste it here.</li>
    </ol>
    <p>
      For more information, see the{" "}
      <a
        href="https://payloadcms.com/docs/authentication/api-keys#api-key-only-auth"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        PayloadCMS API Keys documentation
      </a>
      .
    </p>
  </>
);
