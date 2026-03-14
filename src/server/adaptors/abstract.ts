import type { EnrichedRecord } from "../models/DataRecord";
import type { ExternalRecord, TaggedRecord } from "@/types";

export interface DataSourceAdaptor {
  extractExternalRecordIdsFromWebhookBody(
    body: unknown,
  ): AsyncGenerator<string>;
  getRecordCount(): Promise<number | null>;
  fetchAll(): AsyncGenerator<ExternalRecord>;
  fetchFirst(): Promise<ExternalRecord | null>;
  fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]>;
  removeDevWebhooks(): Promise<void>;
  toggleWebhook(enable: boolean): Promise<void>;
  updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void>;
  tagRecords(records: TaggedRecord[]): Promise<void>;
  deleteColumn(columnName: string): Promise<void>;
}
