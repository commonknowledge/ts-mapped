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

function sanitizeFilenameForHeader(filename: string): {
  ascii: string;
  rfc5987: string;
} {
  // Remove CR/LF and other control characters
  let safe = filename.replace(/[\r\n]+/g, " ").replace(/[\x00-\x1F\x7F]/g, " ");
  // Replace double quotes to avoid breaking the header value
  safe = safe.replace(/"/g, "'");
  // Collapse multiple spaces
  safe = safe.replace(/\s+/g, " ").trim();

  // ASCII-only fallback for legacy user agents
  let ascii = safe.replace(/[^\x20-\x7E]+/g, "");
  if (!ascii) {
    ascii = "download.csv";
  }

  // RFC 5987 encoding for full UTF-8 filename
  const rfc5987 = "UTF-8''" + encodeURIComponent(safe);

  return { ascii, rfc5987 };
}

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
  // Build a stable column order from columnDefs + enrichments, deduped
  const seenColumns = new Set<string>();
  const allColumns: string[] = [];
  for (const col of dataSource.columnDefs ?? []) {
    if (!seenColumns.has(col.name)) {
      seenColumns.add(col.name);
      allColumns.push(col.name);
    }
  }
  for (const colName of enrichmentColNames) {
    if (!seenColumns.has(colName)) {
      seenColumns.add(colName);
      allColumns.push(colName);
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Write header row
        const headerCsv = stringify([allColumns]);
        controller.enqueue(encoder.encode(headerCsv));

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
            rowData[col.def.externalName] = col.value;
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

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  const rawFilename = `${dataSource.name} - enriched.csv`;
  const { ascii: safeFilename, rfc5987 } =
    sanitizeFilenameForHeader(rawFilename);
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=${rfc5987}`,
    },
  });
}
