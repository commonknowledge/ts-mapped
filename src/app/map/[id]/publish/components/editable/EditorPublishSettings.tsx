import { useIsMutating, useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTRPC } from "@/services/trpc/react";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  useHostAvailable,
  usePublicMapValue,
  usePublishedPublicMapValue,
  useSetHostAvailable,
  useUpdatePublicMap,
} from "../../hooks/usePublicMap";

export default function EditorPublishSettings() {
  const publicMap = usePublicMapValue();
  const publishedPublicMap = usePublishedPublicMapValue();
  const updatePublicMap = useUpdatePublicMap();
  const hostAvailable = useHostAvailable();
  const setHostAvailable = useSetHostAvailable();
  const trpc = useTRPC();

  // Detect in-flight applyDraft/discard mutations (owned by usePublishActions in the navbar)
  const isApplyDraftMutating = useIsMutating({
    mutationKey: trpc.publicMap.applyDraft.mutationOptions().mutationKey,
  });
  const isDiscardMutating = useIsMutating({
    mutationKey: trpc.publicMap.discardDraft.mutationOptions().mutationKey,
  });
  const loading = isApplyDraftMutating > 0 || isDiscardMutating > 0;

  // Debounced host for availability checking
  const [debouncedHost, setDebouncedHost] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentHost = publicMap?.host || "";

  // Debounce hostname changes for availability checking
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // If the host hasn't changed from the published version, it's available
    if (currentHost === publishedPublicMap?.host) {
      setHostAvailable(currentHost ? true : null);
      setDebouncedHost(null);
      return;
    }

    if (!currentHost || !getSubdomain(currentHost)) {
      setHostAvailable(null);
      setDebouncedHost(null);
      return;
    }

    // Mark as "checking" while debouncing
    setHostAvailable(null);

    timerRef.current = setTimeout(() => {
      setDebouncedHost(currentHost);
    }, 500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentHost, publishedPublicMap?.host, setHostAvailable]);

  // Run the availability check query
  const { data: availability, isFetching: isChecking } = useQuery(
    trpc.publicMap.checkHostAvailability.queryOptions(
      { host: debouncedHost ?? "", viewId: publicMap?.viewId },
      { enabled: Boolean(debouncedHost) },
    ),
  );

  // Update the hostAvailable atom when the query result changes
  useEffect(() => {
    if (availability && debouncedHost) {
      setHostAvailable(availability.available);
    }
  }, [availability, debouncedHost, setHostAvailable]);

  if (!publicMap) {
    return null;
  }

  // Helper functions
  const getBaseUrl = () =>
    new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001");

  const makeHost = (subdomain: string) => {
    const baseHost = getBaseUrl().host;
    return `${subdomain}.${baseHost}`;
  };

  const getPublicMapUrlAfterSubDomain = () => {
    const baseHost = getBaseUrl().host;
    return `.${baseHost}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>URL</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-500">{`${getBaseUrl().protocol}//`}</span>
        <Input
          type="text"
          placeholder="my-map"
          value={getSubdomain(publicMap.host || "")}
          onChange={(e) => updatePublicMap({ host: makeHost(e.target.value) })}
          pattern="^[a-z]+(-[a-z]+)*$"
          disabled={loading}
        />
        <span className="text-sm text-neutral-500">
          {getPublicMapUrlAfterSubDomain()}
        </span>
      </div>
      {/* Hostname availability indicator */}
      {getSubdomain(currentHost) && (
        <div className="flex items-center gap-1.5 text-xs mt-1">
          {isChecking || (hostAvailable === null && debouncedHost !== null) ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
              <span className="text-neutral-500">Checking availability…</span>
            </>
          ) : hostAvailable === true ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-green-600">Subdomain available</span>
            </>
          ) : hostAvailable === false ? (
            <>
              <XCircle className="w-3 h-3 text-red-600" />
              <span className="text-red-600">
                Subdomain is taken — choose another
              </span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function getSubdomain(host: string | undefined) {
  if (!host) {
    return "";
  }
  return host.split(".")[0];
}
