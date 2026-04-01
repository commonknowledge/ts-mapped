import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceType } from "@/models/DataSource";
import { OAUTH_STATE_KEY, type OAuthState } from "@/models/OAuth";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import type { DataSourceRecordType, ZetkinConfig } from "@/models/DataSource";

interface ZetkinOrganisation {
  id: number;
  title: string;
}

export default function ZetkinFields({
  dataSourceName,
  recordType,
  config,
  onChange,
}: {
  dataSourceName: string;
  recordType: DataSourceRecordType;
  config: Partial<ZetkinConfig>;
  onChange: (
    config: Partial<Pick<ZetkinConfig, "oAuthCredentials" | "orgId">>,
  ) => void;
}) {
  if (config.type !== DataSourceType.Zetkin) return;

  return (
    <ZetkinFieldsWithOAuth
      dataSourceName={dataSourceName}
      recordType={recordType}
      config={config}
      onChange={onChange}
    />
  );
}

function ZetkinFieldsWithOAuth({
  dataSourceName,
  recordType,
  config,
  onChange,
}: {
  dataSourceName: string;
  recordType: DataSourceRecordType;
  config: Partial<ZetkinConfig>;
  onChange: (
    config: Partial<Pick<ZetkinConfig, "oAuthCredentials" | "orgId">>,
  ) => void;
}) {
  const hasCompletedOAuth = useRef<boolean>(false);
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [organisations, setOrganisations] = useState<ZetkinOrganisation[]>([]);

  const code = searchParams.get("code");

  const { mutateAsync: exchangeCode } = useMutation(
    trpc.oauth.zetkinExchangeOAuthCode.mutationOptions(),
  );

  useEffect(() => {
    const completeOAuth = async () => {
      if (!code || hasCompletedOAuth.current) return;
      hasCompletedOAuth.current = true;
      setError("");
      setLoading(true);
      try {
        let oAuthCredentials;
        try {
          oAuthCredentials = await exchangeCode({
            redirectSuccessUrl: window.location.href,
          });
        } catch {
          setError(
            "Something went wrong connecting to Zetkin. Please try again or contact us if the problem persists.",
          );
          return;
        }
        onChange({ oAuthCredentials });

        const response = await fetch(
          "https://api.zetk.in/v1/users/me/memberships",
          {
            headers: {
              Authorization: `Bearer ${oAuthCredentials.access_token}`,
            },
          },
        );
        if (!response.ok) {
          setError(
            "Could not load your Zetkin organisations. Please check that you are an admin on the Zetkin organisation you want to connect.",
          );
          return;
        }
        const data = (await response.json()) as {
          data: { organization: ZetkinOrganisation }[];
        };
        const orgs = data.data.map((m) => m.organization);
        setOrganisations(orgs);
        if (orgs.length === 1) {
          onChange({ orgId: String(orgs[0].id) });
        }
      } finally {
        setLoading(false);
      }
    };
    completeOAuth();
  }, [code, exchangeCode, onChange]);

  const onClickConnect = async () => {
    setLoading(true);
    try {
      const state: OAuthState = {
        dataSourceName,
        recordType: recordType || undefined,
        dataSourceType: DataSourceType.Zetkin,
      };
      sessionStorage.setItem(OAUTH_STATE_KEY, JSON.stringify(state));
      const result = await queryClient.fetchQuery(
        trpc.oauth.zetkinGetOAuthURL.queryOptions(),
      );
      window.location.href = result.url;
    } catch {
      setError("Could not authorize with Zetkin.");
    } finally {
      setLoading(false);
    }
  };

  if (!config.oAuthCredentials) {
    return (
      <div className="mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClickConnect}
          disabled={loading}
        >
          Connect to Zetkin
        </Button>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <FormFieldWrapper label="Organisation" id="orgId">
        <Select
          value={config.orgId || ""}
          onValueChange={(value) => onChange({ orgId: value })}
        >
          <SelectTrigger className="w-full" id="orgId">
            <SelectValue placeholder="Choose an organisation" />
          </SelectTrigger>
          <SelectContent>
            {organisations.map((org) => (
              <SelectItem key={org.id} value={String(org.id)}>
                {org.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormFieldWrapper>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </>
  );
}
