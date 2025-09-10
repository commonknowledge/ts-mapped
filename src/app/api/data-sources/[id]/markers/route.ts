import { NextRequest, NextResponse } from "next/server";
import { RecordFilterInput } from "@/__generated__/types";
import { getServerSession } from "@/auth";
import {
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_EXTERNAL_ID_KEY,
  MARKER_ID_KEY,
  MARKER_MATCHED_COLUMN,
  MARKER_MATCHED_KEY,
  MARKER_NAME_KEY,
} from "@/constants";
import { DataRecord } from "@/server/models/DataRecord";
import { DataSource } from "@/server/models/DataSource";
import { streamDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findOrganisationUser } from "@/server/repositories/OrganisationUser";
import { findPublishedPublicMapByDataSourceId } from "@/server/repositories/PublicMap";

/**
 * Replace a GraphQL query so that streams can be used, to avoid
 * out of memory crashes.
 */
export async function GET(
  request: NextRequest,
  args: { params: Promise<{ id: string; filter: string; search: string }> }
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
    request?.nextUrl?.searchParams.get("filter") || "null"
  ) as RecordFilterInput | null;
  const search = request?.nextUrl?.searchParams.get("search") || "";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Start object
      controller.enqueue(
        encoder.encode(
          `{"dataSourceId":"${dataSource.id}","dataSourceName":"${dataSource.name}","markers":{"type":"FeatureCollection","features":[`
        )
      );

      const stream = streamDataRecordsByDataSource(
        dataSource.id,
        filter,
        search
      );
      let row = await stream.next();
      let firstItemWritten = false;
      while (row.value) {
        const dr: DataRecord & { [MARKER_MATCHED_COLUMN]: boolean } = row.value;
        if (dr.geocodeResult?.centralPoint) {
          const centralPoint = dr.geocodeResult.centralPoint;
          const coordinates = [centralPoint.lng, centralPoint.lat];
          const nameColumns = dataSource?.columnRoles.nameColumns;
          const feature = {
            type: "Feature",
            properties: {
              ...dr.json,
              [MARKER_ID_KEY]: dr.id,
              [MARKER_DATA_SOURCE_ID_KEY]: dr.dataSourceId,
              [MARKER_EXTERNAL_ID_KEY]: dr.externalId,
              // If no name column is specified, show the ID as the marker name instead
              [MARKER_NAME_KEY]: nameColumns?.length
                ? nameColumns
                    .map((c) => dr.json[c])
                    .filter(Boolean)
                    .join(", ")
                : dr.externalId,
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

      controller.enqueue(encoder.encode("]}}")); // End object
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
  userId: string | undefined | null
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
    userId
  );
  if (organisationUser) {
    return true;
  }

  return false;
};
