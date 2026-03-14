import { stringify } from "csv-stringify/sync";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { enrichRecord } from "@/server/mapping/enrich";
import { DataSourceType } from "@/server/models/DataSource";
import { streamOrderedDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findOrganisationUser } from "@/server/repositories/OrganisationUser";
import { enrichmentColumnName } from "@/utils/dataRecord";
import type { DataRecord } from "@/server/models/DataRecord";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  args: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await args.params;
  const { currentUser } = await getServerSession();
  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dataSource = await findDataSourceById(id);
  if (!dataSource) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (dataSource.config.type !== DataSourceType.CSV) {
    return new NextResponse(
      "Only CSV data sources support enriched CSV download",
      { status: 400 },
    );
  }

  const organisationUser = await findOrganisationUser(
    dataSource.organisationId,
    currentUser.id,
  );
  if (!organisationUser) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (dataSource.enrichments.length === 0) {
    return new NextResponse("No enrichments configured", { status: 400 });
  }

  const enrichmentColNames = dataSource.enrichments.map((e) =>
    enrichmentColumnName(e.name),
  );

  const encoder = new TextEncoder();
  let headerWritten = false;
  let allColumns: string[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const recordStream = streamOrderedDataRecordsByDataSource(
          dataSource.id,
        );
        let row = await recordStream.next();

        while (row.value) {
          const record: DataRecord = row.value;
          const enrichedRecord = await enrichRecord(
            { externalId: record.externalId, json: record.json },
            dataSource,
          );

          // Build the full row: original columns + enrichment columns
          const rowData: Record<string, unknown> = { ...record.json };
          for (const col of enrichedRecord.columns) {
            rowData[col.def.name] = col.value;
          }

          // Write header row on the first record
          if (!headerWritten) {
            const originalColumns = Object.keys(record.json);
            allColumns = [...originalColumns, ...enrichmentColNames];
            const headerCsv = stringify([allColumns]);
            controller.enqueue(encoder.encode(headerCsv));
            headerWritten = true;
          }

          // Write data row using column order from header
          const values = allColumns.map((col) => {
            const val = rowData[col];
            if (val === null || val === undefined) return "";
            if (typeof val === "object") return JSON.stringify(val);
            return String(val);
          });
          const rowCsv = stringify([values]);
          controller.enqueue(encoder.encode(rowCsv));

          row = await recordStream.next();
        }

        // Handle empty data source
        if (!headerWritten) {
          const enrichmentHeaders = enrichmentColNames;
          const headerCsv = stringify([enrichmentHeaders]);
          controller.enqueue(encoder.encode(headerCsv));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  const filename = `${dataSource.name} - enriched.csv`;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
