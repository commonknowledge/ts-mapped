import { getServerSession } from "@/auth";
import { redirectToLogin } from "@/auth/redirectToLogin";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import { db } from "@/server/services/database";
import PrivateMap from "./components/PrivateMap";
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
    await redirectToLogin();
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
    <>
      {/* Desktop-only message for small screens */}
      <div className="pointer-events-auto lg:hidden flex h-screen w-full justify-center items-center p-8 text-center z-20 relative bg-white">
        <p className="max-w-[40ch] font-medium text-base">
          Your screen is too small to use this application. Please use a device
          with a larger screen.
        </p>
      </div>
      <div className="hidden lg:contents">
        <PrivateMap viewId={viewId} />
        <SentryFeedbackWidget />
      </div>
    </>
  );
}
