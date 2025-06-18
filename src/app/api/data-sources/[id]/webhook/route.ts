import { NextRequest, NextResponse } from "next/server";
import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import { getDataSourceAdaptor } from "@/server/adaptors";
import { findDataSourceById } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { enqueue } from "@/server/services/queue";
import { batchAsync } from "@/server/utils";

const handler = async (
  dataSourceId: string,
  body: Record<string, unknown>,
): Promise<NextResponse> => {
  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    return new NextResponse("Not found", { status: 404 });
  }

  logger.info(
    `Webhook received: ${dataSource.config.type} (${dataSourceId}), ${JSON.stringify(body)}`,
  );

  const adaptor = getDataSourceAdaptor(dataSource.config);
  if (!adaptor) {
    logger.error(
      `Could not get data source adaptor for source ${dataSourceId}, type ${dataSource.config.type}`,
    );
    return new NextResponse("Error", { status: 500 });
  }

  try {
    const externalRecordIds =
      adaptor.extractExternalRecordIdsFromWebhookBody(body);
    const batches = batchAsync(externalRecordIds, DATA_RECORDS_JOB_BATCH_SIZE);

    for await (const batch of batches) {
      if (dataSource.autoImport) {
        await enqueue("importDataRecords", {
          dataSourceId,
          externalRecordIds: batch,
        });
      }

      if (dataSource.autoEnrich) {
        await enqueue("enrichDataRecords", {
          dataSourceId,
          externalRecordIds: batch,
        });
      }
    }

    return new NextResponse("OK");
  } catch (error) {
    logger.error("Webhook API route failed", { error });
    return new NextResponse("Error", { status: 500 });
  }
};

export async function GET(
  request: NextRequest,
  args: { params: Promise<{ id: string }> },
) {
  const realParams = await args.params;
  const body = Object.fromEntries(request.nextUrl.searchParams.entries());
  return handler(realParams.id, body);
}

export async function POST(
  request: NextRequest,
  args: { params: Promise<{ id: string }> },
) {
  const realParams = await args.params;
  const body = await request.json();
  return handler(realParams.id, body);
}
