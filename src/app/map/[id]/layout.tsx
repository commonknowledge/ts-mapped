import SharedMap from "./components/SharedMap";
import MapJotaiProvider from "./providers/MapJotaiProvider";
import type { ReactNode } from "react";

export default async function MapLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;

  return (
    <MapJotaiProvider mapId={id}>
      <div className="relative h-screen w-full">
        {/* Map layer — persists across route transitions */}
        <SharedMap />
        {/* Page chrome layer — rendered on top of the map.
            pointer-events-none so the map remains interactive;
            individual page elements opt back in with pointer-events-auto. */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {children}
        </div>
      </div>
    </MapJotaiProvider>
  );
}
