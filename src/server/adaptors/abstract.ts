import { EnrichedRecord } from "@/server/mapping/enrich";
import { ExternalRecord } from "@/types";

export interface DataSourceAdaptor {
  getRecordCount(): Promise<number | null>;
  fetchAll(): AsyncGenerator<ExternalRecord>;
  fetchFirst(): Promise<ExternalRecord | null>;
  updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void>;
}
