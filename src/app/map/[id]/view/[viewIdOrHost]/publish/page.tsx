import { notFound } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { createCaller } from "@/services/trpc/server";
import { JotaiProvider } from "../../../providers/JotaiProvider";
import MapProvider from "../../../providers/MapProvider";
import PublicMap from "./components/PublicMap";
import PublicFiltersProvider from "./providers/PublicFiltersProvider";
import PublicMapProvider from "./providers/PublicMapProvider";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string; viewIdOrHost: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { viewIdOrHost } = await params;
  const queryClient = await createCaller();

  const map = await queryClient.publicMap.getPublished({
    host: decodeURIComponent(viewIdOrHost),
  });

  const OGImage = map?.imageUrl || "/og_image.png";

  return {
    title: Boolean(map?.name) ? `${map?.name} - Mapped` : "Mapped",
    description: map?.description || "",
    openGraph: {
      images: [OGImage],
    },
  };
}

export default async function PublicMapAdminPage({
  params,
}: {
  params: Promise<{ id: string; viewIdOrHost: string }>;
}) {
  const { id: mapIdOrPublic, viewIdOrHost } = await params;
  const isPublicRoute = mapIdOrPublic === "public";
  const queryClient = await createCaller();

  let publicMap = null;
  if (isPublicRoute) {
    publicMap = await queryClient.publicMap.getPublished({
      host: decodeURIComponent(viewIdOrHost),
    });
  } else {
    publicMap = await queryClient.publicMap.getEditable({
      viewId: viewIdOrHost,
    });
  }

  if (!publicMap) {
    if (isPublicRoute) {
      notFound();
    } else {
      publicMap = {
        id: uuidv4(),
        mapId: mapIdOrPublic,
        viewId: viewIdOrHost,
        host: "",
        colorScheme: "red",
        name: "My Public Map",
        description: "",
        descriptionLong: "",
        descriptionLink: "",
        imageUrl: "",
        published: false,
        dataSourceConfigs: [],
        createdAt: new Date(),
      };
    }
  }

  return (
    <JotaiProvider>
      <MapProvider mapId={publicMap.mapId} viewId={publicMap.viewId}>
        <PublicMapProvider publicMap={publicMap} editable={!isPublicRoute}>
          <PublicFiltersProvider>
            <PublicMap />
          </PublicFiltersProvider>
        </PublicMapProvider>
      </MapProvider>
    </JotaiProvider>
  );
}
