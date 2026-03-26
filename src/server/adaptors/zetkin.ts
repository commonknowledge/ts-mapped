import Z from "zetkin";
import {
  DATA_RECORDS_JOB_BATCH_SIZE,
  ENRICHMENT_COLUMN_PREFIX,
} from "@/constants";
import logger from "@/server/services/logger";
import type { DataSourceAdaptor } from "./abstract";
import type { ZetkinOAuthCredentials } from "@/models/DataSource";
import type { ExternalRecord } from "@/types";

interface ZetkinPerson {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  alt_phone?: string;
  street_address?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  gender?: string;
  co_address?: string;
  ext_id?: string;
  [key: string]: unknown;
}

export class ZetkinAdaptor implements DataSourceAdaptor {
  private orgId: string;
  private z: typeof Z;

  constructor(orgId: string, oAuthCredentials: ZetkinOAuthCredentials) {
    this.orgId = orgId;
    this.z = Z.construct();
    this.z.configure({
      clientId: process.env.ZETKIN_CLIENT_ID ?? "",
      clientSecret: process.env.ZETKIN_CLIENT_SECRET ?? "",
      scopes: ["level2"]
    });
    this.z.setTokenData(oAuthCredentials);
  }

  async *extractExternalRecordIdsFromWebhookBody(): AsyncGenerator<string> {
    // Zetkin does not support webhooks
  }

  async getRecordCount(): Promise<number | null> {
    return null;
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.z
        .resource(`/orgs/${this.orgId}/people`)
        .get(page, perPage);

      const people = response.data?.data as ZetkinPerson[] | undefined;
      if (!people || people.length === 0) break;

      for (const person of people) {
        yield {
          externalId: String(person.id),
          json: this.normalizeRecord(person),
        };
      }

      if (people.length < perPage) break;
      page++;
    }
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const response = await this.z
        .resource(`/orgs/${this.orgId}/people`)
        .get(1, 1);

      console.log('r', response)
      

      const people = response.data?.data as ZetkinPerson[] | undefined;
      if (!people || people.length === 0) return null;

      return {
        externalId: String(people[0].id),
        json: this.normalizeRecord(people[0]),
      };
    } catch (error) {
      logger.warn("Could not get first record for Zetkin", { error });
      return null;
    }
  }

  async fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    if (externalIds.length > DATA_RECORDS_JOB_BATCH_SIZE) {
      throw new Error("Cannot fetch more than 100 records at once.");
    }

    const results: ExternalRecord[] = [];

    for (const externalId of externalIds) {
      try {
        const response = await this.z
          .resource(`/orgs/${this.orgId}/people`, externalId)
          .get();

        const person = response.data?.data as ZetkinPerson | undefined;
        if (person) {
          results.push({
            externalId,
            json: this.normalizeRecord(person),
          });
        }
      } catch (error) {
        logger.warn(`Could not fetch record ${externalId} from Zetkin`, {
          error,
        });
      }
    }

    return results;
  }

  async removeDevWebhooks(): Promise<void> {
    // Zetkin does not support webhooks
  }

  async toggleWebhook(): Promise<void> {
    logger.debug("Cannot toggle webhooks for Zetkin data source");
  }

  async updateRecords(): Promise<void> {
    throw new Error("Zetkin does not support updating records.");
  }

  async tagRecords(): Promise<void> {
    throw new Error("Zetkin does not support tagging records.");
  }

  deleteColumn(columnName: string): Promise<void> {
    if (!columnName.startsWith(ENRICHMENT_COLUMN_PREFIX)) {
      throw new Error(
        `Refusing to delete column "${columnName}": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
      );
    }
    throw new Error("Zetkin does not support deleting fields.");
  }

  private normalizeRecord(person: ZetkinPerson): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    const fields = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "alt_phone",
      "street_address",
      "city",
      "zip_code",
      "country",
      "gender",
      "co_address",
      "ext_id",
    ] as const;

    for (const field of fields) {
      if (person[field] !== undefined && person[field] !== null) {
        normalized[field] = person[field];
      }
    }

    normalized.name = [person.first_name, person.last_name]
      .filter(Boolean)
      .join(" ");

    return normalized;
  }
}
