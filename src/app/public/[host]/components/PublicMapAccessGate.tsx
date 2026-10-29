import { LockIcon } from "lucide-react";
import PublicMapAccessForm from "./PublicMapAccessForm";
import type { EmbedContext } from "@/utils/publicMapAccess";

/**
 * Shown instead of a moderated public map to visitors without an access
 * grant. The server has already withheld the map's data, so this only
 * needs the public map's name and description.
 *
 * Embedded on a website the map's owner hasn't listed, it explains that
 * instead of offering the request form: the request would be refused, as a
 * magic link can only go back to a listed website.
 */
export default function PublicMapAccessGate({
  publicMapId,
  name,
  description,
  mapUrl,
  embedContext,
}: {
  publicMapId: string;
  name: string;
  description: string;
  mapUrl: string;
  embedContext: EmbedContext;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-50 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <LockIcon size={16} className="text-muted-foreground shrink-0" />
            <h1 className="text-base font-semibold truncate">{name}</h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {embedContext.kind === "unlisted" ? (
          <UnlistedWebsiteMessage
            origin={embedContext.origin}
            mapUrl={mapUrl}
          />
        ) : (
          <PublicMapAccessForm publicMapId={publicMapId} mapUrl={mapUrl} />
        )}
      </div>
    </div>
  );
}

function UnlistedWebsiteMessage({
  origin,
  mapUrl,
}: {
  origin: string | null;
  mapUrl: string;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="font-medium">
        This map hasn&apos;t been set up to be embedded on this site.
      </p>
      <p className="text-muted-foreground">
        If you run this website, ask the map&apos;s owner to add{" "}
        {origin ? <strong>{origin}</strong> : "it"} to the map&apos;s websites
        in Mapped.
      </p>
      <p>
        You can still{" "}
        <a href={mapUrl} target="_blank" className="underline">
          request access at the map&apos;s own address
        </a>
        .
      </p>
    </div>
  );
}
