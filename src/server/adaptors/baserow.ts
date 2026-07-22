import z from "zod";
import {
  DATA_RECORDS_JOB_BATCH_SIZE,
  ENRICHMENT_COLUMN_PREFIX,
} from "@/constants";
import { ColumnType } from "@/models/DataSource";
import logger from "@/server/services/logger";
import { getPublicUrl } from "@/server/services/urls";
import { batch } from "@/server/utils";
import type { DataSourceAdaptor, WebhookToggleResult } from "./abstract";
import type { ExternalRecordUpdate } from "@/models/DataRecord";
import type { ExternalRecord, TaggedRecord } from "@/types";

// Baserow's default page size limit (BASEROW_ROW_PAGE_SIZE_LIMIT)
const PAGE_SIZE = 200;

// Baserow's default batch endpoint limit (BATCH_ROWS_SIZE_LIMIT)
const BATCH_SIZE = 200;

// Baserow access tokens expire after 10 minutes (BASEROW_ACCESS_TOKEN_LIFETIME_MINUTES).
// Refresh a minute early to avoid racing the expiry mid-request.
const ACCESS_TOKEN_TTL_MS = 9 * 60 * 1000;

// Baserow adds these to every serialized row alongside the user's own fields
const ROW_METADATA_KEYS = ["id", "order"];

// Rows are fetched one request at a time, so cap the parallelism
const FETCH_BY_ID_CONCURRENCY = 10;

const WEBHOOK_NAME = "Mapped";

const WEBHOOK_EVENTS = ["rows.created", "rows.updated", "rows.deleted"];

// Field types whose values are objects wrapping the displayed value
const UNWRAPPED_FIELD_TYPES = ["link_row", "multiple_select", "single_select"];

interface BaserowField {
  id: number;
  name: string;
  type: string;
  read_only?: boolean;
}

interface Webhook {
  id: number;
  url: string;
  active: boolean;
}

const TokenAuthResponse = z.object({
  // Older Baserow versions only return `token`
  token: z.string().optional(),
  access_token: z.string().optional(),
});

const WebhookNotification = z.object({
  table_id: z.number(),
  event_type: z.string().optional(),
  // rows.created / rows.updated
  items: z.array(z.object({ id: z.number() })).optional(),
  // rows.deleted
  row_ids: z.array(z.number()).optional(),
});

export class BaserowAdaptor implements DataSourceAdaptor {
  private dataSourceId: string;
  private apiUrl: string;
  private tableId: string;
  private email: string;
  private password: string;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private cachedFields: BaserowField[] | null = null;

  constructor({
    dataSourceId,
    apiUrl,
    tableId,
    email,
    password,
  }: {
    dataSourceId: string;
    apiUrl: string;
    tableId: string;
    email: string;
    password: string;
  }) {
    this.dataSourceId = dataSourceId;
    this.apiUrl = apiUrl.replace(/\/+$/, "");
    this.tableId = tableId;
    this.email = email;
    this.password = password;
  }

  async *extractExternalRecordIdsFromWebhookBody(
    body: unknown,
  ): AsyncGenerator<string> {
    if (!body) {
      throw new Error("Empty Baserow webhook body");
    }

    logger.debug(`Baserow webhook body: ${JSON.stringify(body)}`);

    const notification = WebhookNotification.parse(body);
    if (String(notification.table_id) !== this.tableId) {
      logger.error(
        `Mismatched Baserow webhook tables: Expected ${this.tableId}, got ${notification.table_id}`,
      );
      return;
    }

    for (const item of notification.items || []) {
      yield String(item.id);
    }

    for (const rowId of notification.row_ids || []) {
      yield String(rowId);
    }
  }

  /**
   * Baserow has no OAuth flow, and its database tokens are rejected by the
   * field and webhook endpoints, so sign in as a user to get a JWT. Access
   * tokens are short-lived, and refresh tokens expire after 7 days without
   * being rotated, so there is nothing worth persisting between calls.
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const response = await fetch(`${this.apiUrl}/api/user/token-auth/`, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad Baserow token auth response: ${response.status}, ${responseText}`,
      );
    }

    const json = TokenAuthResponse.parse(await response.json());
    const accessToken = json.access_token || json.token;
    if (!accessToken) {
      throw Error("Baserow token auth response contained no access token");
    }

    this.accessToken = accessToken;
    this.accessTokenExpiresAt = Date.now() + ACCESS_TOKEN_TTL_MS;

    return accessToken;
  }

  private async request(
    path: string,
    init: RequestInit = {},
    retryOnUnauthorized = true,
  ): Promise<unknown> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `JWT ${token}`,
        "Content-type": "application/json",
      },
    });

    // The token may have been invalidated server-side (e.g. a password change
    // elsewhere, or a clock skew) before our cached expiry ran out.
    if (response.status === 401 && retryOnUnauthorized) {
      this.accessToken = null;
      return this.request(path, init, false);
    }

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad Baserow response for ${path}: ${response.status}, ${responseText}`,
      );
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async getFields(): Promise<BaserowField[]> {
    if (this.cachedFields) {
      return this.cachedFields;
    }

    const json = await this.request(
      `/api/database/fields/table/${this.tableId}/`,
    );
    if (!Array.isArray(json)) {
      throw Error(`Bad Baserow fields response body: ${JSON.stringify(json)}`);
    }

    const fields = json.map((f) => {
      const field = f as BaserowField;
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        read_only: field.read_only,
      };
    });
    this.cachedFields = fields;

    return fields;
  }

  async getFieldNames(): Promise<string[]> {
    const fields = await this.getFields();
    return fields.map((field) => field.name);
  }

  /**
   * Baserow serializes several field types as objects wrapping the value that
   * the user actually sees in the grid:
   *
   * - link_row:         [{ id, value }] — value is the linked row's primary field
   * - multiple_select:  [{ id, value, color }]
   * - single_select:    { id, value, color }
   *
   * Imported as-is they become ColumnType.Object, which cannot be filtered,
   * used as a choropleth column or geocoded, so the values are unwrapped to
   * the strings and string arrays that Airtable already returns for the
   * equivalent field types.
   *
   * The field schema is used rather than sniffing for `{ id, value }`-shaped
   * values, so that field types added by Baserow in future are passed through
   * untouched instead of being silently rewritten. A schema failure degrades
   * to the raw values rather than breaking the import.
   */
  private async getUnwrappableFieldTypes(): Promise<Map<string, string>> {
    const fieldTypes = new Map<string, string>();
    try {
      for (const field of await this.getFields()) {
        if (UNWRAPPED_FIELD_TYPES.includes(field.type)) {
          fieldTypes.set(field.name, field.type);
        }
      }
    } catch (error) {
      logger.warn(
        `Could not fetch Baserow schema for wrapped fields: table ${this.tableId}`,
        { error },
      );
    }
    return fieldTypes;
  }

  /** Unwrap the field types listed above; anything that isn't shaped as
   *  expected (including nulls, i.e. an unset single select) is kept as-is. */
  private async unwrapFieldValues(
    json: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const fieldTypes = await this.getUnwrappableFieldTypes();
    if (!fieldTypes.size) {
      return json;
    }
    const unwrapped = { ...json };
    for (const [fieldName, fieldType] of fieldTypes) {
      const value = unwrapped[fieldName];
      if (fieldType === "single_select") {
        unwrapped[fieldName] = unwrapValue(value);
      } else if (Array.isArray(value)) {
        unwrapped[fieldName] = value.map(unwrapValue);
      }
    }
    return unwrapped;
  }

  private async toExternalRecord(
    row: Record<string, unknown> | null,
  ): Promise<ExternalRecord | null> {
    const record = stripRowMetadata(row);
    if (!record) {
      return null;
    }
    return { ...record, json: await this.unwrapFieldValues(record.json) };
  }

  async createField(name: string, type: ColumnType): Promise<void> {
    const body: {
      name: string;
      type: string;
      description: string;
      number_decimal_places?: number;
      number_negative?: boolean;
    } = {
      name,
      type: "text",
      description: "Managed by Mapped",
    };

    switch (type) {
      case ColumnType.Number:
        body.type = "number";
        body.number_decimal_places = 8;
        body.number_negative = true;
        break;
      case ColumnType.Boolean:
        body.type = "boolean";
        break;
    }

    const created = (await this.request(
      `/api/database/fields/table/${this.tableId}/`,
      { method: "POST", body: JSON.stringify(body) },
    )) as BaserowField;

    logger.info(`Created Baserow field "${name}" (${type})`);

    this.cachedFields?.push({
      id: created.id,
      name: created.name,
      type: created.type,
    });
  }

  async getRecordCount(): Promise<number | null> {
    try {
      const page = await this.fetchPage({ page: 1, size: 1 });
      return page.count;
    } catch (error) {
      logger.warn(
        `Could not get record count for Baserow table ${this.tableId}`,
        { error },
      );
      return null;
    }
  }

  async fetchPage({
    page,
    size = PAGE_SIZE,
  }: {
    page: number;
    size?: number;
  }): Promise<{ count: number; results: Record<string, unknown>[] }> {
    const params = new URLSearchParams({
      user_field_names: "true",
      page: String(page),
      size: String(size),
    });

    const json = await this.request(
      `/api/database/rows/table/${this.tableId}/?${params}`,
    );

    if (
      !json ||
      typeof json !== "object" ||
      !("results" in json) ||
      !Array.isArray(json.results)
    ) {
      throw Error(`Bad Baserow rows response body: ${JSON.stringify(json)}`);
    }

    return {
      count: "count" in json ? Number(json.count) : json.results.length,
      results: json.results as Record<string, unknown>[],
    };
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    let page = 1;
    let fetched = 0;
    let count = 0;

    do {
      const pageData = await this.fetchPage({ page });
      count = pageData.count;
      fetched += pageData.results.length;

      if (!pageData.results.length) {
        return;
      }

      for (const row of pageData.results) {
        const record = await this.toExternalRecord(row);
        // Baserow creates empty placeholder rows with every new table
        if (record && !isEmptyRecord(record.json)) {
          yield record;
        }
      }

      page++;
    } while (fetched < count);
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const pageData = await this.fetchPage({ page: 1 });
      for (const row of pageData.results) {
        const record = await this.toExternalRecord(row);
        // Return the first non-empty row
        if (record && !isEmptyRecord(record.json)) {
          return record;
        }
      }
    } catch (error) {
      logger.warn(
        `Could not get first record for Baserow table ${this.tableId}`,
        { error },
      );
    }
    return null;
  }

  /**
   * Baserow cannot filter rows by id, so each row is fetched individually.
   */
  async fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    if (externalIds.length > DATA_RECORDS_JOB_BATCH_SIZE) {
      // If this error happens it means jobs that fetch data by record ID
      // are too large and should be split into smaller batches
      throw new Error("Cannot fetch more than 100 records at once.");
    }

    const records: ExternalRecord[] = [];

    for (const idBatch of batch(externalIds, FETCH_BY_ID_CONCURRENCY)) {
      const batchRecords = await Promise.all(
        idBatch.map((externalId) => this.fetchRow(externalId)),
      );
      for (const record of batchRecords) {
        if (record) {
          records.push(record);
        }
      }
    }

    return records;
  }

  private async fetchRow(externalId: string): Promise<ExternalRecord | null> {
    try {
      const json = await this.request(
        `/api/database/rows/table/${this.tableId}/${externalId}/?user_field_names=true`,
      );
      return await this.toExternalRecord(json as Record<string, unknown>);
    } catch (error) {
      // The row may have been deleted between the webhook and this fetch
      logger.warn(
        `Could not fetch Baserow row ${externalId} in table ${this.tableId}`,
        { error },
      );
      return null;
    }
  }

  async listWebhooks(urlContains: string): Promise<Webhook[]> {
    const json = await this.request(
      `/api/database/webhooks/table/${this.tableId}/`,
    );

    if (!Array.isArray(json)) {
      throw Error(
        `Bad Baserow webhooks response body: ${JSON.stringify(json)}`,
      );
    }

    return json
      .map((w) => w as Webhook)
      .filter((webhook) => webhook.url.includes(urlContains));
  }

  async removeDevWebhooks(): Promise<void> {
    const webhooks = await this.listWebhooks("ngrok");
    await this.removeWebhooks(webhooks);
  }

  async toggleWebhook(enable: boolean): Promise<WebhookToggleResult> {
    const publicUrl = await getPublicUrl();
    const webhooks = await this.listWebhooks(publicUrl);
    const oldWebhookIds = webhooks.map((webhook) => String(webhook.id));

    // Remove webhooks on user request
    if (!enable) {
      logger.info(
        `Removing Baserow webhooks for data source ${this.dataSourceId}`,
      );
      await this.removeWebhooks(webhooks);
      return {
        action: oldWebhookIds.length ? "removed" : "noop",
        oldWebhookIds,
        newWebhookIds: [],
      };
    }

    // Baserow webhooks do not expire, but they are deactivated after repeated
    // delivery failures, so only keep one that is still active.
    if (webhooks.length === 1 && webhooks[0].active) {
      logger.info(
        `Baserow webhook exists for data source ${this.dataSourceId}`,
      );
      return {
        action: "kept",
        oldWebhookIds: [],
        newWebhookIds: [String(webhooks[0].id)],
      };
    }

    // Cleanup deactivated or duplicate webhooks
    await this.removeWebhooks(webhooks);

    const notificationUrl = await getPublicUrl(
      `/api/data-sources/${this.dataSourceId}/webhook`,
    );

    logger.info(
      `Baserow notification URL for data source ${this.dataSourceId}: ${notificationUrl}`,
    );

    const created = (await this.request(
      `/api/database/webhooks/table/${this.tableId}/`,
      {
        method: "POST",
        body: JSON.stringify({
          name: WEBHOOK_NAME,
          url: notificationUrl,
          request_method: "POST",
          include_all_events: false,
          events: WEBHOOK_EVENTS,
          headers: {},
          use_user_field_names: true,
        }),
      },
    )) as { id: number };

    return {
      action: oldWebhookIds.length ? "recreated" : "created",
      oldWebhookIds,
      newWebhookIds: created.id ? [String(created.id)] : [],
    };
  }

  async removeWebhooks(webhooks: Webhook[]): Promise<void> {
    for (const webhook of webhooks) {
      logger.info(
        `Removing Baserow webhook for data source ${this.dataSourceId}: ${webhook.id}`,
      );
      await this.request(`/api/database/webhooks/${webhook.id}/`, {
        method: "DELETE",
      });
    }
  }

  async updateRecords(recordUpdates: ExternalRecordUpdate[]): Promise<void> {
    if (!recordUpdates.length) {
      return;
    }

    // Map used here to be able to remove the existing fields below
    const newFields = new Map<string, ColumnType>();
    for (const record of recordUpdates) {
      for (const column of record.columns) {
        newFields.set(column.def.name, column.def.type);
      }
    }

    const existingFields = await this.getFieldNames();
    for (const fieldName of existingFields) {
      newFields.delete(fieldName);
    }

    for (const [field, type] of newFields) {
      await this.createField(field, type);
    }

    for (const recordBatch of batch(recordUpdates, BATCH_SIZE)) {
      const items = recordBatch.map((record) => {
        const fields: Record<string, unknown> = {};
        for (const column of record.columns) {
          fields[column.def.name] = column.value;
        }
        return { id: Number(record.externalRecord.externalId), ...fields };
      });

      await this.batchUpdateRows(items);
    }
  }

  async tagRecords(taggedRecords: TaggedRecord[]): Promise<void> {
    if (!taggedRecords.length) {
      return;
    }

    // Assume same tag applied to all records
    const fieldName = taggedRecords[0].tag.name;

    const existingFields = await this.getFieldNames();
    logger.debug(
      `Baserow tagRecords: field="${fieldName}", existingFields=${JSON.stringify(existingFields)}`,
    );
    if (!existingFields.includes(fieldName)) {
      logger.info(`Creating new Baserow field: "${fieldName}"`);
      await this.createField(fieldName, ColumnType.Boolean);
    } else {
      logger.info(
        `Baserow field "${fieldName}" already exists, skipping creation`,
      );
    }

    for (const recordBatch of batch(taggedRecords, BATCH_SIZE)) {
      const items = recordBatch.map((record) => ({
        id: Number(record.externalId),
        [fieldName]: record.tag.present,
      }));

      logger.debug(
        `Baserow batch update ${items.length} records for field "${fieldName}"`,
      );
      await this.batchUpdateRows(items);
    }
  }

  private async batchUpdateRows(
    items: Record<string, unknown>[],
  ): Promise<void> {
    await this.request(
      `/api/database/rows/table/${this.tableId}/batch/?user_field_names=true`,
      { method: "PATCH", body: JSON.stringify({ items }) },
    );
  }

  async deleteColumn(columnName: string): Promise<void> {
    if (!columnName.startsWith(ENRICHMENT_COLUMN_PREFIX)) {
      throw new Error(
        `Refusing to delete column "${columnName}": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
      );
    }

    const fields = await this.getFields();
    const field = fields.find((f) => f.name === columnName);
    if (!field) {
      logger.warn(
        `Baserow field "${columnName}" not found in table ${this.tableId}, skipping deletion`,
      );
      return;
    }

    await this.request(`/api/database/fields/${field.id}/`, {
      method: "DELETE",
    });

    this.cachedFields =
      this.cachedFields?.filter((f) => f.id !== field.id) || null;
  }
}

const unwrapValue = (value: unknown) =>
  value && typeof value === "object" && "value" in value
    ? (value as { value: unknown }).value
    : value;

const stripRowMetadata = (
  row: Record<string, unknown> | null,
): ExternalRecord | null => {
  if (!row || typeof row !== "object" || !("id" in row)) {
    return null;
  }

  const json: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    if (!ROW_METADATA_KEYS.includes(key)) {
      json[key] = row[key];
    }
  }

  return { externalId: String(row.id), json };
};

// Baserow populates new tables with empty placeholder rows, which look like
// `{ "Name": "", "Notes": null, "Active": false }`.
const isEmptyRecord = (o: Record<string, unknown>) => {
  for (const k of Object.keys(o)) {
    const value = o[k];
    if (Array.isArray(value)) {
      if (value.length) {
        return false;
      }
      continue;
    }
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      value !== false
    ) {
      return false;
    }
  }
  return true;
};
