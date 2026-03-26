import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceType } from "@/models/DataSource";
import { OAUTH_STATE_KEY, type OAuthState } from "@/models/OAuth";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import type { DataSourceRecordType, ZetkinConfig } from "@/models/DataSource";

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

  const code = searchParams.get("code");

  const { mutateAsync: exchangeCode } = useMutation(
    trpc.oauth.zetkinExchangeOAuthCode.mutationOptions(),
  );

  useEffect(() => {
    const completeOAuth = async () => {
      try {
        if (code && !hasCompletedOAuth.current) {
          hasCompletedOAuth.current = true;
          setError("");
          setLoading(true);
          const oAuthCredentials = await exchangeCode({
            redirectSuccessUrl: window.location.href,
          });
          onChange({ oAuthCredentials });
        }
      } catch {
        setError("Could not authorize with Zetkin.");
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
      <FormFieldWrapper label="Organisation ID" id="orgId">
        <Input
          type="text"
          className="w-full"
          id="orgId"
          required
          placeholder="e.g. 1"
          value={config.orgId || ""}
          onChange={(e) => onChange({ orgId: e.target.value })}
        />
      </FormFieldWrapper>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </>
  );
}
