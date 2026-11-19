import MapAccessCard from "@/components/MapAccessCard";
import MapAccessForm from "@/components/MapAccessForm";
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
    <MapAccessCard name={name} description={description}>
      {embedContext.kind === "unlisted" ? (
        <UnlistedWebsiteMessage origin={embedContext.origin} mapUrl={mapUrl} />
      ) : (
        <MapAccessForm target={{ kind: "publicMap", publicMapId, mapUrl }} />
      )}
    </MapAccessCard>
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
