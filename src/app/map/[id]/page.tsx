import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { DesktopOnly } from "@/components/layout/DesktopOnly";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import PrivateMap from "./components/PrivateMap";
import { MapStoreProvider } from "./providers/MapStoreProvider";
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
      <DesktopOnly>
        <div className="with-feeback-widget">
          <PrivateMap />
          <SentryFeedbackWidget />
        </div>
      </DesktopOnly>
    </MapStoreProvider>
  );
}
