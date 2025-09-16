import type { DataSourceAdaptor } from "./abstract";
import type { ExternalRecord } from "@/types";

export class MailchimpAdaptor implements DataSourceAdaptor {
  async *extractExternalRecordIdsFromWebhookBody(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    body: unknown,
  ): AsyncGenerator<string> {
    throw new Error("Method not implemented.");
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    throw new Error("Method not implemented.");
  }

  async getRecordCount() {
    return null;
  }

  removeDevWebhooks(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  tagRecords(): Promise<void> {
    throw new Error("Unimplemented.");
  }

  async toggleWebhook(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enable: boolean,
  ): Promise<void> {
    throw new Error("Unimplemented");
  }

  updateRecords(): Promise<void> {
    throw new Error("Unimplemented.");
  }
}
