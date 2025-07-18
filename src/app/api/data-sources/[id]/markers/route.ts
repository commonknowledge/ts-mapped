import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { DataRecord } from "@/server/models/DataRecord";
import { streamDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";

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
  // TODO: fine-grained access control
  if (!currentUser) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const dataSource = await findDataSourceById(realParams.id);
  if (!dataSource) {
    return new NextResponse("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Start object
      controller.enqueue(
        encoder.encode(
          `{"dataSourceId":"${dataSource.id}","dataSourceName":"${dataSource.name}","markers":{"type":"FeatureCollection","features":[`,
        ),
      );

      const stream = streamDataRecordsByDataSource(dataSource.id);
      let row = await stream.next();
      let firstItemWritten = false;
      while (row.value) {
        const dr: DataRecord = row.value;
        if (dr.geocodeResult?.centralPoint) {
          const centralPoint = dr.geocodeResult.centralPoint;
          const coordinates = [centralPoint.lng, centralPoint.lat];
          const nameColumn = dataSource?.columnRoles.nameColumn;
          const feature = {
            type: "Feature",
            properties: {
              ...dr.json,
              [MARKER_ID_KEY]: dr.externalId,
              // If no name column is specified, show the ID as the marker name instead
              [MARKER_NAME_KEY]: nameColumn
                ? dr.json[nameColumn]
                : dr.externalId,
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
