import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { DesktopOnly } from "@/components/layout/DesktopOnly";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import { MapEffects } from "./components/MapEffects";
import PrivateMap from "./components/PrivateMap";
import { PrivateMapEffects } from "./components/PrivateMapEffects";
import { MapStoreProvider } from "./providers/MapStoreProvider";
import { PublicMapStoreProvider } from "./view/[viewIdOrHost]/publish/providers/PublicMapStoreProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Map View",
};

export default async function MapPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ viewId: string | undefined }>;
}) {
  const serverSession = await getServerSession();
  if (!serverSession.currentUser) redirect("/");
  const { viewId } = await searchParams;

  return (
    <MapStoreProvider viewId={viewId}>
      {/*  have to wrap to provide dummy store, for components/hooks that may need a public map */}
      <PublicMapStoreProvider editable={false}>
        <MapEffects />
        <PrivateMapEffects />
        <DesktopOnly>
          <div className="with-feeback-widget">
            <PrivateMap />
            <SentryFeedbackWidget />
          </div>
        </DesktopOnly>
      </PublicMapStoreProvider>
    </MapStoreProvider>
  );
}
