import { DataSource } from "@/server/models/DataSource";
import { ExternalRecord } from "@/types";
import { DataSourceAdaptor } from "./abstract";
import { WebhookType } from "./types";

export class MailchimpAdaptor implements DataSourceAdaptor {
  async getRecordCount() {
    return null;
  }

  async toggleWebhook(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dataSource: DataSource,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    webhookType: WebhookType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enable: boolean,
  ): Promise<void> {
    throw new Error("Unimplemented");
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

  updateRecords(): Promise<void> {
    throw new Error("Unimplemented.");
  }
}
