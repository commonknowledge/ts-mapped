import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { BASEROW_DEFAULT_API_URL, DataSourceType } from "@/models/DataSource";
import { Badge } from "@/shadcn/ui/badge";
import { Input } from "@/shadcn/ui/input";
import type { BaserowConfig } from "@/models/DataSource";

export default function BaserowFields({
  config,
  onChange,
}: {
  config: Partial<BaserowConfig>;
  onChange: (
    config: Partial<
      Pick<BaserowConfig, "apiUrl" | "tableId" | "email" | "password">
    >,
  ) => void;
}) {
  if (config.type !== DataSourceType.Baserow) return;

  return (
    <>
      <FormFieldWrapper
        label="Baserow URL"
        id="apiUrl"
        helpText={UrlHelpText}
        hint="Leave as it is unless you host Baserow yourself."
      >
        <Input
          type="text"
          required
          className="w-full"
          id="apiUrl"
          placeholder={BASEROW_DEFAULT_API_URL}
          value={config.apiUrl ?? BASEROW_DEFAULT_API_URL}
          onChange={(e) => onChange({ apiUrl: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Table ID"
        id="tableId"
        helpText={TableIdHelpText}
        hint={
          <>
            The number in the URL of your table, after{" "}
            <Badge variant="secondary">/table/</Badge>
          </>
        }
      >
        <Input
          type="text"
          required
          className="w-full"
          id="tableId"
          value={config.tableId || ""}
          onChange={(e) => onChange({ tableId: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Baserow account email"
        id="email"
        helpText={AccountHelpText}
        hint="We strongly recommend creating a separate Baserow account for Mapped."
      >
        <Input
          type="email"
          required
          className="w-full"
          id="email"
          value={config.email || ""}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Baserow account password"
        id="password"
        helpText={AccountHelpText}
        hint="Used to sign in to Baserow on your behalf when syncing."
      >
        <Input
          type="password"
          required
          className="w-full"
          id="password"
          autoComplete="new-password"
          value={config.password || ""}
          onChange={(e) => onChange({ password: e.target.value })}
        />
      </FormFieldWrapper>
    </>
  );
}

const UrlHelpText = (
  <>
    <h3>Which Baserow URL should I use?</h3>
    <p>
      If you use Baserow&apos;s hosted service at baserow.io, leave this as
      https://api.baserow.io.
    </p>
    <p>
      If your organisation runs its own Baserow server, enter the address of
      that server, for example https://baserow.example.org.
    </p>
  </>
);

const TableIdHelpText = (
  <>
    <h3>How to find your Table ID in Baserow</h3>
    <ol>
      <li>Open your table in Baserow.</li>
      <li>
        Look at the address bar. The URL ends with something like
        /database/123/table/456.
      </li>
      <li>
        The number after /table/ is your Table ID. In this example it is 456.
      </li>
    </ol>
  </>
);

const AccountHelpText = (
  <>
    <h3>Why does Mapped need a Baserow email and password?</h3>
    <p>
      Baserow has no &quot;connect an app&quot; flow like Google or Zetkin, and
      its database tokens are not allowed to add columns or set up the webhooks
      that keep your data up to date. The only way to offer those features is to
      sign in to Baserow the same way you would.
    </p>
    <h3>Please create a bot account</h3>
    <p>
      We strongly recommend creating a new Baserow account just for Mapped —
      often called a bot account — rather than using your own login. For
      example, register mapped-bot@your-organisation.org and invite it to the
      workspace containing this table.
    </p>
    <p>This matters because:</p>
    <ul>
      <li>
        The password is stored so that background syncs keep working. Anyone who
        obtained it would have access to every workspace that account can see,
        so it should be able to see as little as possible.
      </li>
      <li>
        A Baserow password also allows changing that account&apos;s email and
        password. You do not want that to be your own account.
      </li>
      <li>
        If the person who set up the connection leaves your organisation, or
        changes their password, a bot account keeps your maps working.
      </li>
    </ul>
    <p>
      Invite the bot account only to the workspace it needs, and remove it when
      you delete this data source.
    </p>
  </>
);
