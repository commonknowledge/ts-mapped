export interface DataSourceAdaptor {
  getRecordCount(): Promise<number | null>;
  fetchAll(): AsyncGenerator<{ externalId: string, json: Record<string, unknown> }>
}
