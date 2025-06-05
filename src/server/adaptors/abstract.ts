import { EnrichedRecord } from "@/server/mapping/enrich";
import { DataSource } from "@/server/models/DataSource";
import { ExternalRecord } from "@/types";
import { WebhookType } from "./types";

export interface DataSourceAdaptor {
  getRecordCount(): Promise<number | null>;
  fetchAll(): AsyncGenerator<ExternalRecord>;
  fetchFirst(): Promise<ExternalRecord | null>;
  toggleWebhook(
    dataSource: DataSource,
    webhookType: WebhookType,
    enable: boolean,
  ): Promise<void>;
  updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void>;
}
