import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { DesktopOnly } from "@/components/layout/DesktopOnly";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import { MapEffects } from "./components/MapEffects";
import PrivateMap from "./components/PrivateMap";
import { PrivateMapEffects } from "./components/PrivateMapEffects";
import { MapStoreProvider } from "./providers/MapStoreProvider";
import { PrivateMapStoreProvider } from "./providers/PrivateMapStoreProvider";
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
      <PrivateMapStoreProvider>
        <MapEffects />
        <PrivateMapEffects />
        <DesktopOnly>
          <div className="with-feeback-widget">
            <PrivateMap />
            <SentryFeedbackWidget />
          </div>
        </DesktopOnly>
      </PrivateMapStoreProvider>
    </MapStoreProvider>
  );
}
