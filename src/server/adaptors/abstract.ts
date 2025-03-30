export interface DataSourceAdaptor {
  getRecordCount(): Promise<number | null>;
  fetchAll(): AsyncGenerator<ExternalRecord>;
  fetchFirst(): Promise<ExternalRecord | null>;
}

export interface ExternalRecord {
  externalId: string;
  json: Record<string, unknown>;
}
