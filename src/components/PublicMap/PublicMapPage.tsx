import MapProviders from "@/components/Map/MapProviders";
import { DEV_NEXT_PUBLIC_BASE_URL } from "@/constants";
import { findPublicMapByHostname } from "@/server/repositories/PublicMap";
import PublicMap from "./PublicMap";

export default async function PublicMapPage({ host }: { host: string }) {
  const publicMap = await findPublicMapByHostname(host);
  if (!publicMap) {
    return (
      <div className="h-dvh w-full flex flex-col items-center gap-4 pt-40">
        <h1 className="font-bold text-2xl">Map not found</h1>
        <p>
          Sorry, this map is not available right now.{" "}
          <a
            className="underline"
            href={process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL}
          >
            Visit Mapped
          </a>
        </p>
      </div>
    );
  }
  return (
    <MapProviders mapId={publicMap.mapId} viewId={publicMap.viewId}>
      <PublicMap />
    </MapProviders>
  );
}
