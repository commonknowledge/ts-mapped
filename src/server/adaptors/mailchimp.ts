import { DataSourceAdaptor, ExternalRecord } from "./abstract";

export class MailchimpAdaptor implements DataSourceAdaptor {
  async getRecordCount() {
    return null;
  }

  async *fetchAll(): AsyncGenerator<{
    externalId: string;
    json: Record<string, unknown>;
  }> {
    throw new Error("Unimplemented");
  }

  async fetchFirst(): Promise<ExternalRecord> {
    throw new Error("Unimplemented");
  }
}
