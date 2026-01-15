import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { DesktopOnly } from "@/components/layout/DesktopOnly";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import { db } from "@/server/services/database";
import PrivateMap from "./components/PrivateMap";
import MapJotaiProvider from "./providers/MapJotaiProvider";
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

  // Log current view data (development only)
  if (process.env.NODE_ENV === "development") {
    try {
      const mapData = await db
        .selectFrom("mapView")
        .where("mapId", "=", id)
        .selectAll()
        .execute();

      if (mapData && mapData.length > 0) {
        const currentView = viewId
          ? mapData.find((v) => v.id === viewId) || mapData[0]
          : mapData[0];

        console.log("=== Current Map View Data ===");
        console.log("View ID:", currentView.id);
        console.log("View Name:", currentView.name);
        console.log("View Config:", currentView.config);
        console.log("Inspector Config:", currentView.inspectorConfig);
        console.log("Data Source Views:", currentView.dataSourceViews);
        console.log("==============================");
      }
    } catch (error) {
      console.error("Error fetching view data:", error);
    }
  }

  return (
    <MapJotaiProvider mapId={id} viewId={viewId}>
      <DesktopOnly>
        <div className="with-feedback-widget">
          <PrivateMap />
          <SentryFeedbackWidget />
        </div>
      </DesktopOnly>
    </MapJotaiProvider>
  );
}
