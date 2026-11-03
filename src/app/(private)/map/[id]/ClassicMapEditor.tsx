import { createCaller } from "@/services/trpc/server";
import EditColumnMetadataModal from "../../components/EditColumnMetadataModal/EditColumnMetadataModal";
import MapNavbar from "./components/MapNavbar";
import PrivateMapOverlay from "./components/PrivateMapOverlay";
import SharedMap from "./components/SharedMap";
import MapJotaiProvider from "./providers/MapJotaiProvider";
import EditablePublicMapOverlay from "./publish/components/EditablePublicMapOverlay";

// The classic map editor, and the publish editor (?mode=publish), which the
// light editor still hands over to
export default async function ClassicMapEditor({
  id,
  viewId,
  isPublishMode,
}: {
  id: string;
  viewId?: string;
  isPublishMode: boolean;
}) {
  // Log current view data (development only)
  if (process.env.NODE_ENV === "development") {
    try {
      const caller = await createCaller();
      const mapData = await caller.map.byId({ mapId: id });

      if (mapData.views.length > 0) {
        const currentView =
          mapData.views.find((v) => v.id === viewId) || mapData.views[0];

        console.log("=== Current Map View Data ===");
        console.log("View ID:", currentView.id);
        console.log("View Name:", currentView.name);
        console.log("View Config:", currentView.config);
        console.log("Data Source Views:", currentView.dataSourceViews);
        console.log("==============================");
      }
    } catch (error) {
      console.error("Error fetching view data:", error);
    }
  }

  return (
    <MapJotaiProvider mapId={id} viewId={viewId}>
      <div className="relative h-screen w-full">
        <SharedMap />
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
          <MapNavbar />
          <div className="flex-1 min-h-0">
            {/* Desktop-only message for small screens */}
            <div className="pointer-events-auto lg:hidden flex h-screen w-full justify-center items-center p-8 text-center z-20 relative bg-white">
              <p className="max-w-[40ch] font-medium text-base">
                Your screen is too small to use this application. Please use a
                device with a larger screen.
              </p>
            </div>
            <div className="hidden lg:contents">
              {isPublishMode ? (
                <EditablePublicMapOverlay />
              ) : (
                <PrivateMapOverlay />
              )}
            </div>
          </div>
        </div>
      </div>
      <EditColumnMetadataModal />
    </MapJotaiProvider>
  );
}
