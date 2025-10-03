import { NextResponse } from "next/server";
import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import { getDataSourceAdaptor } from "@/server/adaptors";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { enqueue } from "@/server/services/queue";
import { batchAsync } from "@/server/utils";
import type { NextRequest } from "next/server";

const handler = async (
  dataSourceId: string,
  body: Record<string, unknown>,
): Promise<NextResponse> => {
  logger.info(`Handling webhook for ${dataSourceId}: ${JSON.stringify(body)}`);

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    return new NextResponse("Not found", { status: 404 });
  }

  const adaptor = getDataSourceAdaptor(dataSource);
  if (!adaptor) {
    logger.error(
      `Could not get data source adaptor for source ${dataSourceId}, type ${dataSource.config.type}`,
    );
    return new NextResponse("Error", { status: 500 });
  }

  logger.info(
    `Processing ${dataSource.config.type} webhook for data source: ${dataSourceId}`,
  );

  const externalRecordIds =
    adaptor.extractExternalRecordIdsFromWebhookBody(body);
  const batches = batchAsync(externalRecordIds, DATA_RECORDS_JOB_BATCH_SIZE);

  for await (const batch of batches) {
    await db
      .updateTable("dataRecord")
      .where("externalId", "in", batch)
      .where("dataSourceId", "=", dataSourceId)
      .set({
        needsEnrich: dataSource.autoEnrich,
        needsImport: dataSource.autoImport,
      })
      .execute();
  }

  if (dataSource.autoImport) {
    await enqueue("importDataRecords", dataSourceId, {
      dataSourceId,
    });
  }

  if (dataSource.autoEnrich) {
    await enqueue("enrichDataRecords", dataSourceId, {
      dataSourceId,
    });
  }

  return new NextResponse("OK");
};

export async function GET(
  request: NextRequest,
  args: { params: Promise<{ id: string }> },
) {
  try {
    logger.info(`Received webhook: ${request.nextUrl.toString()}`);
    const realParams = await args.params;
    const body = Object.fromEntries(request.nextUrl.searchParams.entries());
    return handler(realParams.id, body);
  } catch (error) {
    logger.error("Webhook GET route failed", { error });
    // Don't return 500, because then service providers may stop sending webhooks
    return new NextResponse("OK");
  }
}

export async function POST(
  request: NextRequest,
  args: { params: Promise<{ id: string }> },
) {
  try {
    const realParams = await args.params;
    const body = await request.text();
    logger.info(`Received webhook: ${request.nextUrl.toString()}, ${body}`);
    const payload = getPayload(body);
    return handler(realParams.id, payload);
  } catch (error) {
    logger.error("Webhook POST route failed", { error });
    // Don't return 500, because then service providers may stop sending webhooks
    return new NextResponse("OK");
  }
}

const getPayload = (body: string): Record<string, unknown> => {
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {}

  try {
    const params = new URLSearchParams(body);
    const result: Record<string, unknown> = {};

    for (const [key, value] of params.entries()) {
      result[key] = value;
    }

    return result;
  } catch {}

  logger.warn("Could not get webhook payload from body:", body);
  return {};
};
