import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import { updateDataSource } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { getPublicUrl } from "@/server/services/urls";
import { batch } from "@/server/utils";
import { DataSourceType } from "../models/DataSource";
import type { DataSourceAdaptor } from "./abstract";
import type { googleOAuthCredentialsSchema } from "../models/DataSource";
import type { EnrichedRecord } from "@/server/mapping/enrich";
import type { ExternalRecord, TaggedRecord } from "@/types";
import type z from "zod";

type GoogleOAuthCredentials = z.infer<typeof googleOAuthCredentialsSchema>;

export class GoogleSheetsAdaptor implements DataSourceAdaptor {
  private dataSourceId: string;
  private spreadsheetId: string;
  private sheetName: string;
  private credentials: GoogleOAuthCredentials;
  private cachedHeaders: string[] | null = null;

  constructor(
    dataSourceId: string,
    spreadsheetId: string,
    sheetName: string,
    credentials: GoogleOAuthCredentials,
  ) {
    this.dataSourceId = dataSourceId;
    this.spreadsheetId = spreadsheetId;
    this.sheetName = sheetName;
    this.credentials = credentials;
  }

  async *extractExternalRecordIdsFromWebhookBody(
    body: Record<string, unknown>,
  ): AsyncGenerator<string> {
    if (!body) {
      throw new Error("Empty Google Sheets webhook body");
    }

    logger.debug(`Google Sheets webhook body: ${JSON.stringify(body)}`);

    if (body.rowCount) {
      // For row count changes, we need to fetch all records to determine what changed
      // This is a limitation of Google Sheets webhooks
      const records = this.fetchAll();
      for await (const record of records) {
        yield record.externalId;
      }
    } else if (body.rowNumber && typeof body.rowNumber === "string") {
      yield body.rowNumber;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (
      this.credentials.expiry_date &&
      this.credentials.expiry_date > Date.now()
    ) {
      return this.credentials.access_token;
    }

    logger.debug("Refreshing Google Sheets access token");

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: this.credentials.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to refresh Google Sheets token: ${response.status}, ${body}`,
      );
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.credentials.access_token = tokenData.access_token;
    this.credentials.expiry_date = Date.now() + tokenData.expires_in * 1000;

    logger.debug("Refreshed Google Sheets access token");

    try {
      await updateDataSource(this.dataSourceId, {
        config: {
          type: DataSourceType.GoogleSheets,
          spreadsheetId: this.spreadsheetId,
          sheetName: this.sheetName,
          oAuthCredentials: this.credentials,
        },
      });
    } catch (error) {
      logger.error("Could not update Google Sheets data source", { error });
    }

    return this.credentials.access_token;
  }

  private async makeGoogleSheetsRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const start = Date.now();
    logger.debug(`Making Google Sheets request: ${url}`);

    const token = await this.refreshAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const end = Date.now();

    logger.debug(
      `Completed Google Sheets request in ${(end - start) / 1000}s: ${url}`,
    );

    return response;
  }

  async getRecordCount(): Promise<number | null> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!A:A`;
      const response = await this.makeGoogleSheetsRequest(url);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { values: string[][] };
      // Subtract 1 for header row
      return data.values ? Math.max(0, data.values.length - 1) : 0;
    } catch (error) {
      logger.warn(
        `Could not get record count for Google Sheets ${this.dataSourceId}`,
        {
          error,
        },
      );
      return null;
    }
  }

  private async getHeaders(): Promise<string[]> {
    if (this.cachedHeaders) {
      return this.cachedHeaders;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!1:1`;
    const response = await this.makeGoogleSheetsRequest(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to get headers: ${response.status}, ${body}`);
    }

    const data = (await response.json()) as { values: string[][] };
    this.cachedHeaders = data.values?.[0];
    return this.cachedHeaders || [];
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}`;
    const response = await this.makeGoogleSheetsRequest(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to fetch all records: ${response.status}, ${body}`,
      );
    }

    const data = (await response.json()) as { values: string[][] };
    const rows = data.values || [];
    logger.debug(`Google Sheets data received: ${rows.length} rows`);
    if (rows.length === 0) {
      return;
    }

    const headers = rows[0];

    // Skip header row, start from index 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const json: Record<string, unknown> = {};

      // Map row values to headers
      for (let j = 0; j < headers.length; j++) {
        if (row[j] !== undefined && row[j] !== "") {
          json[headers[j]] = row[j];
        }
      }

      // Only yield non-empty rows
      if (Object.keys(json).length > 0) {
        yield {
          externalId: String(i + 1), // Row number (1-based)
          json,
        };
      }
    }
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!1:2`;
      const response = await this.makeGoogleSheetsRequest(url);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { values: string[][] };
      const rows = data.values || [];

      if (rows.length < 2) {
        return null;
      }

      const headers = rows[0];
      const firstDataRow = rows[1];
      const json: Record<string, unknown> = {};

      // Map row values to headers
      for (let j = 0; j < headers.length; j++) {
        if (firstDataRow[j] !== undefined && firstDataRow[j] !== "") {
          json[headers[j]] = firstDataRow[j];
        }
      }

      return Object.keys(json).length > 0
        ? {
            externalId: "2", // Second row (first data row)
            json,
          }
        : null;
    } catch (error) {
      logger.warn(
        `Could not get first record for Google Sheets ${this.dataSourceId}`,
        {
          error,
        },
      );
      return null;
    }
  }

  async fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    if (externalIds.length > DATA_RECORDS_JOB_BATCH_SIZE) {
      throw new Error("Cannot fetch more than 100 records at once.");
    }

    const records: ExternalRecord[] = [];
    const headers = await this.getHeaders();

    // Batch requests for efficiency
    const ranges = externalIds.map((id) => `${this.sheetName}!${id}:${id}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values:batchGet?ranges=${ranges.join("&ranges=")}`;

    const response = await this.makeGoogleSheetsRequest(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to fetch records by ID: ${response.status}, ${body}`,
      );
    }

    const data = (await response.json()) as {
      valueRanges: { values: string[][] }[];
    };
    const valueRanges = data.valueRanges || [];

    for (let i = 0; i < valueRanges.length; i++) {
      const valueRange = valueRanges[i];
      const externalId = externalIds[i];

      if (valueRange.values && valueRange.values.length > 0) {
        const row = valueRange.values[0];
        const json: Record<string, unknown> = {};

        // Map row values to headers
        for (let j = 0; j < headers.length; j++) {
          if (row[j] !== undefined && row[j] !== "") {
            json[headers[j]] = row[j];
          }
        }

        if (Object.keys(json).length > 0) {
          records.push({
            externalId,
            json,
          });
        }
      }
    }

    return records;
  }

  async removeDevWebhooks(): Promise<void> {
    logger.info(`Removing dev webhooks for data source ${this.dataSourceId}`);

    const sheets = await this.listSheets();
    const webhookSheets = sheets.filter((s) =>
      s.properties.title.includes("ngrok"),
    );
    for (const sheet of webhookSheets) {
      await this.deleteSheet(sheet.properties.title);
    }

    logger.info(`Removed dev webhooks for data source ${this.dataSourceId}`);
  }

  async toggleWebhook(enable: boolean): Promise<void> {
    const notificationUrl = await getPublicUrl(
      `/api/data-sources/${this.dataSourceId}/webhook`,
    );

    // Shorten identifying URL as sheet names must be <= 100 characters
    const notificationDomain = new URL(notificationUrl).hostname;
    const webhookSheetName = `Mapped Webhook: ${notificationDomain}/${this.dataSourceId}`;

    if (!enable) {
      await this.deleteSheet(webhookSheetName);
      return;
    }

    await this.ensureSheet(webhookSheetName);
    await this.prepareWebhookSheet(webhookSheetName, notificationUrl);
  }

  public async listSheets(): Promise<
    { properties: { sheetId: string; title: string } }[]
  > {
    const spreadsheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`;
    const res = await this.makeGoogleSheetsRequest(spreadsheetUrl, {
      method: "GET",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Failed to fetch spreadsheet metadata: ${res.status}, ${body}`,
      );
    }

    const data = (await res.json()) as {
      sheets: { properties: { sheetId: string; title: string } }[];
    };
    return data.sheets || [];
  }

  private async ensureSheet(title: string): Promise<void> {
    const sheets = await this.listSheets();
    const sheetExists = sheets.some(
      (sheet) => sheet.properties.title === title,
    );

    if (sheetExists) {
      return;
    }

    const createSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`;
    const response = await this.makeGoogleSheetsRequest(createSheetUrl, {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title, hidden: true },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to create sheet: ${response.status}, ${body}`);
    }
  }

  private async deleteSheet(title: string): Promise<void> {
    const sheets = await this.listSheets();
    const sheet = sheets.find((sheet) => sheet.properties.title === title);

    if (!sheet) {
      return; // Sheet doesn't exist
    }

    const sheetId = sheet.properties.sheetId;

    const deleteSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`;
    const response = await this.makeGoogleSheetsRequest(deleteSheetUrl, {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            deleteSheet: {
              sheetId,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to delete sheet: ${response.status}, ${body}`);
    }
  }

  private async prepareWebhookSheet(
    webhookSheetTitle: string,
    notificationUrl: string,
  ): Promise<void> {
    // Step 1: Get total number of rows in the main sheet
    const sheetRange = `${this.sheetName}!A:A`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(sheetRange)}`;
    const readResponse = await this.makeGoogleSheetsRequest(url, {
      method: "GET",
    });

    if (!readResponse.ok) {
      const body = await readResponse.text();
      throw new Error(
        `Failed to read row count from main sheet: ${readResponse.status}, ${body}`,
      );
    }

    const { values } = (await readResponse.json()) as { values: string[][] };
    const numRows = values?.length || 0;

    if (numRows === 0) {
      return;
    }

    // Step 2: Construct formula rows
    // First cell is a row count (surprisingly complicated!)
    const countUpdateUrl = `${notificationUrl}?rowCount=`;

    const formulaRows: string[][] = [
      [
        `=MAX(FILTER(ROW(${this.sheetName}!A1:Z), BYROW(${this.sheetName}!A1:Z, LAMBDA(row, COUNTA(row))) > 0))`,
        `=IMPORTDATA("${countUpdateUrl}" & A1)`,
      ],
    ];

    // Skip header row
    for (let i = 1; i < numRows; i++) {
      const rowNum = i + 1;
      const urlWithParam = `${notificationUrl}?rowNumber=${rowNum}&unused=`;
      // IMPORTDATA triggers a GET request
      const formula = `=LEFT(JOIN(",", ${this.sheetName}!${rowNum}:${rowNum}), 2000)`;
      formulaRows.push([
        formula,
        `=IMPORTDATA("${urlWithParam}" & A${rowNum})`,
      ]);
    }

    // Step 3: Write formulas into webhook sheet
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values:batchUpdate`;
    const range = `${webhookSheetTitle}!A1:B${numRows}`;

    const updateResponse = await this.makeGoogleSheetsRequest(updateUrl, {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range,
            values: formulaRows,
          },
        ],
      }),
    });

    if (!updateResponse.ok) {
      const body = await updateResponse.text();
      throw new Error(
        `Failed to write webhook formulas: ${updateResponse.status}, ${body}`,
      );
    }
  }

  async updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void> {
    const headers = await this.getHeaders();
    const batches = batch(enrichedRecords, 100); // Google Sheets allows larger batches

    // Collect all new columns we need to add
    const newColumns = new Set<string>();
    for (const record of enrichedRecords) {
      for (const column of record.columns) {
        if (!headers.includes(column.def.name)) {
          newColumns.add(column.def.name);
        }
      }
    }

    // Add new columns to the sheet
    if (newColumns.size > 0) {
      const newHeaders = [...headers, ...Array.from(newColumns)];
      const headerRange = `${this.sheetName}!1:1`;
      const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${headerRange}?valueInputOption=USER_ENTERED`;

      const headerResponse = await this.makeGoogleSheetsRequest(headerUrl, {
        method: "PUT",
        body: JSON.stringify({
          values: [newHeaders],
        }),
      });

      if (!headerResponse.ok) {
        const body = await headerResponse.text();
        throw new Error(
          `Failed to update headers: ${headerResponse.status}, ${body}`,
        );
      }

      this.cachedHeaders = newHeaders;
    }

    const updatedHeaders = this.cachedHeaders || headers;

    // Update records in batches
    for (const batch of batches) {
      const updates = [];
      for (const record of batch) {
        for (const column of record.columns) {
          const columnIndex = updatedHeaders.indexOf(column.def.name);
          if (columnIndex !== -1) {
            const columnLetter = indexToLetter(columnIndex);
            const externalId = record.externalRecord.externalId;
            updates.push({
              range: `${this.sheetName}!${columnLetter}${externalId}:${externalId}`,
              values: [[column.value]],
            });
          }
        }
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values:batchUpdate`;
      const response = await this.makeGoogleSheetsRequest(url, {
        method: "POST",
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data: updates,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Failed to update records: ${response.status}, ${body}`,
        );
      }
    }
  }

  async tagRecords(taggedRecords: TaggedRecord[]): Promise<void> {
    const headers = await this.getHeaders();
    const batches = batch(taggedRecords, 100);

    // Assume same tag applied to all records
    const fieldName = taggedRecords[0].tag.name;
    if (!headers.includes(fieldName)) {
      const newHeaders = [...headers, fieldName];
      const headerRange = `${this.sheetName}!1:1`;
      const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${headerRange}?valueInputOption=USER_ENTERED`;

      const headerResponse = await this.makeGoogleSheetsRequest(headerUrl, {
        method: "PUT",
        body: JSON.stringify({
          values: [newHeaders],
        }),
      });

      if (!headerResponse.ok) {
        const body = await headerResponse.text();
        throw new Error(
          `Failed to update headers: ${headerResponse.status}, ${body}`,
        );
      }

      this.cachedHeaders = newHeaders;
    }

    const updatedHeaders = this.cachedHeaders || headers;

    // Update records in batches
    for (const batch of batches) {
      const updates = [];
      for (const record of batch) {
        const columnIndex = updatedHeaders.indexOf(fieldName);
        if (columnIndex !== -1) {
          const columnLetter = indexToLetter(columnIndex);
          const externalId = record.externalId;
          updates.push({
            range: `${this.sheetName}!${columnLetter}${externalId}:${externalId}`,
            values: [[record.tag.present ? "true" : "false"]],
          });
        }
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values:batchUpdate`;
      const response = await this.makeGoogleSheetsRequest(url, {
        method: "POST",
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data: updates,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Failed to update records: ${response.status}, ${body}`,
        );
      }
    }
  }

  async deleteColumn(columnName: string, rowCount: number): Promise<void> {
    const headers = await this.getHeaders();

    const headerIndex = headers.findIndex((h) => h === columnName);
    if (headerIndex === -1) {
      return;
    }

    const headerLetter = indexToLetter(headerIndex);

    const headerRange = `${this.sheetName}!${headerLetter}:${headerLetter}`;
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${headerRange}?valueInputOption=USER_ENTERED`;

    const headerResponse = await this.makeGoogleSheetsRequest(headerUrl, {
      method: "PUT",
      body: JSON.stringify({
        values: Array.from({ length: rowCount }).fill([""]),
      }),
    });

    if (!headerResponse.ok) {
      const body = await headerResponse.text();
      throw new Error(
        `Failed to update headers: ${headerResponse.status}, ${body}`,
      );
    }

    this.cachedHeaders = headers.filter((h) => h !== columnName);
  }
}

function indexToLetter(index: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  while (index >= 0) {
    result = alphabet[index % 26] + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
}
