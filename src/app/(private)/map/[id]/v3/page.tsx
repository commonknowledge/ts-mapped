import { redirect } from "next/navigation";
import EditColumnMetadataModal from "../../../components/EditColumnMetadataModal/EditColumnMetadataModal";
import PrivateMapOverlay from "../components/PrivateMapOverlay";
import SharedMap from "../components/SharedMap";
import MapJotaiProvider from "../providers/MapJotaiProvider";
import LightEditorSetup from "./components/LightEditorSetup";
import LightNavbar from "./components/LightNavbar";
import LightSidebar from "./components/LightSidebar";
import LightVisualisationData from "./components/LightVisualisationData";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Map View (v3 prototype)",
};

// Prototype of a lighter editor shell. It reuses the classic editor's
// providers, map, hooks, flyouts and inspector; only the chrome is new.
export default async function LightMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; viewId?: string }>;
}) {
  const { id } = await params;
  const { mode, viewId } = await searchParams;

  // Publish mode has its own editor, so hand over to the classic route
  if (mode === "publish") {
    const query = new URLSearchParams({ mode });
    if (viewId) {
      query.set("viewId", viewId);
    }
    redirect(`/map/${id}?${query}`);
  }

  return (
    <MapJotaiProvider mapId={id} viewId={viewId}>
      <LightEditorSetup />
      {/* Lighter frame for the shared inspector panel */}
      <div className="relative h-screen w-full [&_#inspector-panel]:rounded-xl [&_#inspector-panel]:border [&_#inspector-panel]:border-neutral-200 [&_#inspector-panel]:shadow-[0_8px_30px_rgba(21,33,59,0.08)]">
        <SharedMap />
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
          <LightNavbar />
          <div className="flex-1 min-h-0">
            <div className="pointer-events-auto lg:hidden flex h-full w-full justify-center items-center p-8 text-center z-20 relative bg-white">
              <p className="max-w-[40ch] font-medium text-base">
                Your screen is too small to use this application. Please use a
                device with a larger screen.
              </p>
            </div>
            <div className="hidden lg:contents">
              <PrivateMapOverlay
                controlPanel={<LightSidebar />}
                visualisationPanelOptions={{
                  title: "Data visualisation",
                  header: <LightVisualisationData />,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <EditColumnMetadataModal />
    </MapJotaiProvider>
  );
}
