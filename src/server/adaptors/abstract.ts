import type { ExternalRecordUpdate } from "@/models/DataRecord";
import type { ExternalRecord, TaggedRecord } from "@/types";

export interface WebhookToggleResult {
  action: "created" | "recreated" | "kept" | "removed" | "noop";
  oldWebhookIds: string[];
  newWebhookIds: string[];
  details?: Record<string, unknown>;
}

export interface DataSourceAdaptor {
  extractExternalRecordIdsFromWebhookBody(
    body: unknown,
  ): AsyncGenerator<string>;
  getRecordCount(): Promise<number | null>;
  fetchAll(): AsyncGenerator<ExternalRecord>;
  fetchFirst(): Promise<ExternalRecord | null>;
  fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]>;
  removeDevWebhooks(): Promise<void>;
  toggleWebhook(enable: boolean): Promise<WebhookToggleResult>;
  updateRecords(recordUpdates: ExternalRecordUpdate[]): Promise<void>;
  tagRecords(records: TaggedRecord[]): Promise<void>;
  deleteColumn(columnName: string): Promise<void>;
}
