import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import {
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_ID_KEY,
  MARKER_MATCHED_COLUMN,
  MARKER_MATCHED_KEY,
  MARKER_NAME_KEY,
} from "@/constants";
import { streamDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findOrganisationUser } from "@/server/repositories/OrganisationUser";
import { findPublishedPublicMapByDataSourceId } from "@/server/repositories/PublicMap";
import { buildName } from "@/utils/text";
import type { DataRecord } from "@/server/models/DataRecord";
import type { DataSource } from "@/server/models/DataSource";
import type { RecordFilterInput } from "@/server/models/MapView";
import type { PointFeature } from "@/types";
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
          const feature: PointFeature = {
            type: "Feature",
            properties: {
              ...dr.json,
              [MARKER_ID_KEY]: dr.id,
              [MARKER_DATA_SOURCE_ID_KEY]: dr.dataSourceId,
              // If no name column is specified, show the ID as the marker name instead
              [MARKER_NAME_KEY]: buildName(dataSource, dr),
              [MARKER_MATCHED_KEY]: dr[MARKER_MATCHED_COLUMN],
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

const checkAccess = async (
  dataSource: DataSource,
  userId: string | undefined | null,
): Promise<boolean> => {
  if (dataSource.public) {
    return true;
  }

  const publicMap = await findPublishedPublicMapByDataSourceId(dataSource.id);
  if (publicMap) {
    return true;
  }

  if (!userId) {
    return false;
  }

  const organisationUser = await findOrganisationUser(
    dataSource.organisationId,
    userId,
  );
  if (organisationUser) {
    return true;
  }

  return false;
};
