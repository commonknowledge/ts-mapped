import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { DesktopOnly } from "@/components/layout/DesktopOnly";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import PrivateMap from "./components/PrivateMap";
import ChoroplethProvider from "./providers/ChoroplethProvider";
import InspectorProvider from "./providers/InspectorProvider";
import MapProvider from "./providers/MapProvider";
import MarkerAndTurfProvider from "./providers/MarkerAndTurfProvider";
import { TableStoreProvider } from "./stores/useTableStore";
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
    <TableStoreProvider>
      <MapProvider mapId={id} viewId={viewId}>
        <InspectorProvider>
          <ChoroplethProvider>
            <MarkerAndTurfProvider>
              <DesktopOnly>
                <div className="with-feeback-widget">
                  <PrivateMap />
                  <SentryFeedbackWidget />
                </div>
              </DesktopOnly>
            </MarkerAndTurfProvider>
          </ChoroplethProvider>
        </InspectorProvider>
      </MapProvider>
    </TableStoreProvider>
  );
}
