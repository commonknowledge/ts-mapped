import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { MARKER_MATCHED_COLUMN } from "@/constants";
import { streamDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findOrganisationForUser } from "@/server/repositories/Organisation";
import { findPublicMapByViewId } from "@/server/repositories/PublicMap";
import { canReadDataSource } from "@/server/utils/auth";
import { buildName, buildPublicMapName } from "@/utils/dataRecord";
import type { DataRecord } from "@/models/DataRecord";
import type { RecordFilterInput } from "@/models/MapView";
import type { PublicMapDataSourceConfig } from "@/models/PublicMap";
import type { MarkerFeatureWithoutDataSourceId } from "@/types";
import type { NextRequest } from "next/server";

/**
 * Replace a GraphQL query so that streams can be used, to avoid
 * out of memory crashes.
 */
export async function GET(
  request: NextRequest,
  args: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const realParams = await args.params;
  const { currentUser } = await getServerSession();
  const dataSource = await findDataSourceById(realParams.id);
  if (!dataSource) {
    return new NextResponse("Not found", { status: 404 });
  }

  const canRead = await checkAccess(dataSource, currentUser?.id);
  if (!canRead) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filter = JSON.parse(
    request?.nextUrl?.searchParams.get("filter") || "null",
  ) as RecordFilterInput | null;
  const search = request?.nextUrl?.searchParams.get("search") || "";

  // On the public map (and its editor preview), marker labels should use the
  // public map config's "Listing Title" rather than the data source's own
  // nameColumns. The columns are read from the server-loaded config (never from
  // client-supplied params) so anonymous requests can't surface non-public columns.
  const publicMapDataSourceConfig = await resolvePublicMapDataSourceConfig({
    dataSourceId: dataSource.id,
    organisationId: dataSource.organisationId,
    publicMapViewId:
      request?.nextUrl?.searchParams.get("publicMapViewId") || null,
    userId: currentUser?.id,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Start array
      controller.enqueue(encoder.encode(`[`));

      const stream = streamDataRecordsByDataSource(
        dataSource.id,
        filter,
        search,
      );
      let row = await stream.next();
      let firstItemWritten = false;
      while (row.value) {
        const dr: DataRecord & { [MARKER_MATCHED_COLUMN]: boolean } = row.value;
        if (dr.geocodeResult?.centralPoint) {
          const centralPoint = dr.geocodeResult.centralPoint;
          const coordinates = [centralPoint.lng, centralPoint.lat] as [
            number,
            number,
          ];
          const feature: MarkerFeatureWithoutDataSourceId = {
            type: "Feature",
            // Minimal properties to support large numbers of markers (1000+)
            properties: {
              id: dr.id,
              name: publicMapDataSourceConfig
                ? buildPublicMapName(publicMapDataSourceConfig, dr)
                : buildName(dataSource, dr),
              matched: dr[MARKER_MATCHED_COLUMN],
            },
            geometry: {
              type: "Point",
              coordinates,
            },
          };

          // Prepend comma for items apart from the first one
          // Use prepend instead of append so no need to know when an item is last
          const chunk = `${firstItemWritten ? "," : ""}${JSON.stringify(feature)}`;
          controller.enqueue(encoder.encode(chunk));
          firstItemWritten = true;
        }
        row = await stream.next();
      }

      controller.enqueue(encoder.encode("]")); // End array
      controller.close();
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const checkAccess = canReadDataSource;

/**
 * Resolve the public map data source config to use for marker labels.
 * Returns null when there is no public map context (normal private map),
 * in which case the caller falls back to `buildName`.
 *
 * Org members editing the map see the unsaved draft config (live preview);
 * everyone else (the public site) sees the live published config.
 */
async function resolvePublicMapDataSourceConfig({
  dataSourceId,
  organisationId,
  publicMapViewId,
  userId,
}: {
  dataSourceId: string;
  organisationId: string;
  publicMapViewId: string | null;
  userId: string | null | undefined;
}): Promise<PublicMapDataSourceConfig | null> {
  if (!publicMapViewId) {
    return null;
  }

  const publicMap = await findPublicMapByViewId(publicMapViewId);
  if (!publicMap) {
    return null;
  }

  let useDraft = false;
  if (userId && publicMap.draft) {
    const organisation = await findOrganisationForUser(organisationId, userId);
    useDraft = Boolean(organisation);
  }

  const configs =
    useDraft && publicMap.draft
      ? publicMap.draft.dataSourceConfigs
      : publicMap.dataSourceConfigs;

  return configs.find((c) => c.dataSourceId === dataSourceId) || null;
}
