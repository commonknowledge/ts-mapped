import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { DesktopOnly } from "@/components/layout/DesktopOnly";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import PrivateMap from "./components/PrivateMap";
import { JotaiProvider } from "./providers/JotaiProvider";
import MapProvider from "./providers/MapProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Map View",
};

export default async function MapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ viewId: string | undefined }>;
}) {
  const serverSession = await getServerSession();
  if (!serverSession.currentUser) {
    return redirect("/");
  }

  const { id } = await params;
  const { viewId } = await searchParams;

  return (
    <JotaiProvider>
      <MapProvider mapId={id} viewId={viewId}>
        <DesktopOnly>
          <div className="with-feeback-widget">
            <PrivateMap />
            <SentryFeedbackWidget />
          </div>
        </DesktopOnly>
      </MapProvider>
    </JotaiProvider>
  );
}
