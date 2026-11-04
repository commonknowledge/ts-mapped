import EditColumnMetadataModal from "../../../components/EditColumnMetadataModal/EditColumnMetadataModal";
import PrivateMapOverlay from "../components/PrivateMapOverlay";
import SharedMap from "../components/SharedMap";
import MapJotaiProvider from "../providers/MapJotaiProvider";
import LightEditorSetup from "./components/LightEditorSetup";
import LightInspectorProvider from "./components/LightInspectorProvider";
import LightNavbar from "./components/LightNavbar";
import LightSidebar from "./components/LightSidebar";
import LightTour from "./components/LightTour";
import LightVisualisationData from "./components/LightVisualisationData";

// The light editor: the classic editor's providers, map, hooks, flyouts and
// inspector, in a lighter shell
export default function LightMapEditor({
  id,
  viewId,
}: {
  id: string;
  viewId?: string;
}) {
  return (
    <MapJotaiProvider mapId={id} viewId={viewId}>
      <LightEditorSetup />
      {/* Lighter frame for the shared inspector panel, at a fixed width so it
          doesn't resize with each area's content (overrides its inline
          min/max widths) */}
      <div className="relative h-screen w-full [&_#inspector-panel]:rounded-xl [&_#inspector-panel]:border [&_#inspector-panel]:border-neutral-200 [&_#inspector-panel]:shadow-[0_8px_30px_rgba(21,33,59,0.08)] [&_#inspector-panel:not([data-wide])]:w-[360px]! [&_#inspector-panel:not([data-wide])]:min-w-[360px]! [&_#inspector-panel:not([data-wide])]:max-w-[360px]!">
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
              <LightInspectorProvider>
                <PrivateMapOverlay
                  controlPanel={<LightSidebar />}
                  visualisationPanelOptions={{
                    title: "Data visualisation",
                    header: <LightVisualisationData />,
                    inlineColumnDetails: true,
                  }}
                />
              </LightInspectorProvider>
            </div>
          </div>
        </div>
        <LightTour />
      </div>
      <EditColumnMetadataModal />
    </MapJotaiProvider>
  );
}
