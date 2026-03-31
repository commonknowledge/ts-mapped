import Z from "zetkin";
import {
  DATA_RECORDS_JOB_BATCH_SIZE,
  ENRICHMENT_COLUMN_PREFIX,
} from "@/constants";
import { DataSourceType } from "@/models/DataSource";
import { updateDataSource } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { slugify } from "@/utils/text";
import type { DataSourceAdaptor } from "./abstract";
import type { EnrichedRecord } from "@/models/DataRecord";
import type { ZetkinOAuthCredentials } from "@/models/DataSource";
import type { ExternalRecord, TaggedRecord } from "@/types";

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

interface ZetkinCustomField {
  id: number;
  slug: string;
  title: string;
}

interface ZetkinTag {
  id: number;
  title: string;
}

export class ZetkinAdaptor implements DataSourceAdaptor {
  credentials: ZetkinOAuthCredentials;

  private dataSourceId: string;
  private orgId: string;
  private z: typeof Z;
  private cachedFields: ZetkinCustomField[] | null = null;
  private cachedTags: ZetkinTag[] | null = null;

  constructor(
    dataSourceId: string,
    orgId: string,
    oAuthCredentials: ZetkinOAuthCredentials,
  ) {
    this.dataSourceId = dataSourceId;
    this.orgId = orgId;
    this.credentials = oAuthCredentials;
    this.z = Z.construct();
    this.z.configure({
      clientId: process.env.ZETKIN_CLIENT_ID ?? "",
      clientSecret: process.env.ZETKIN_CLIENT_SECRET ?? "",
      scopes: ["level2"],
    });
    this.z.setTokenData(oAuthCredentials);
  }

  private async refreshAccessToken(): Promise<void> {
    if (
      this.credentials.expiry_date &&
      this.credentials.expiry_date > Date.now()
    ) {
      return;
    }

    if (!this.credentials.refresh_token) {
      logger.warn(
        `No refresh token available for Zetkin data source ${this.dataSourceId}`,
      );
      return;
    }

    logger.debug("Refreshing Zetkin access token");

    await this.z.refresh();

    const newTokenData = this.z.getTokenData() as Record<string, unknown>;
    const expiresIn = Number(newTokenData.expires_in);

    this.credentials = {
      access_token: String(newTokenData.access_token),
      token_type: String(newTokenData.token_type),
      refresh_token: newTokenData.refresh_token
        ? String(newTokenData.refresh_token)
        : this.credentials.refresh_token,
      expiry_date: Date.now() + expiresIn * 1000,
    };

    logger.debug("Refreshed Zetkin access token");

    try {
      await updateDataSource(this.dataSourceId, {
        config: {
          type: DataSourceType.Zetkin,
          orgId: this.orgId,
          oAuthCredentials: this.credentials,
        },
      });
    } catch (error) {
      logger.error("Could not persist refreshed Zetkin credentials", { error });
    }
  }

  private async getCustomFields(): Promise<ZetkinCustomField[]> {
    if (this.cachedFields) return this.cachedFields;

    const response = await this.z
      .resource(`/orgs/${this.orgId}/people/fields`)
      .get();

    this.cachedFields =
      (response.data?.data as ZetkinCustomField[] | undefined) ?? [];
    return this.cachedFields;
  }

  private normalizeRecord(person: ZetkinPerson): ZetkinPerson {
    if (!this.cachedFields) return person;

    const slugToTitle = new Map(
      this.cachedFields
        .filter((f) => f.slug !== f.title)
        .map((f) => [f.slug, f.title]),
    );

    return Object.fromEntries(
      Object.entries(person).map(([key, value]) => [
        slugToTitle.get(key) ?? key,
        value,
      ]),
    ) as ZetkinPerson;
  }

  async *extractExternalRecordIdsFromWebhookBody(): AsyncGenerator<string> {
    // Zetkin does not support webhooks
  }

  async getRecordCount(): Promise<number | null> {
    return null;
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    await this.refreshAccessToken();
    await this.getCustomFields();

    let page = 0;
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
      await this.refreshAccessToken();
      await this.getCustomFields();

      const response = await this.z
        .resource(`/orgs/${this.orgId}/people`)
        .get(1, 1);

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

    await this.refreshAccessToken();
    await this.getCustomFields();

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

  async updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void> {
    await this.refreshAccessToken();

    const newFieldNames = new Set<string>();
    for (const { columns } of enrichedRecords) {
      for (const { def } of columns) {
        if (def.name.startsWith(ENRICHMENT_COLUMN_PREFIX)) {
          newFieldNames.add(def.name);
        }
      }
    }

    await this.ensureCustomFieldsExist(newFieldNames);

    for (const { externalRecord, columns } of enrichedRecords) {
      const body: Record<string, unknown> = {};
      for (const { def, value } of columns) {
        if (!def.name.startsWith(ENRICHMENT_COLUMN_PREFIX)) {
          logger.warn(
            `Skipping column "${def.name}": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be updated.`,
          );
          continue;
        }
        body[slugify(def.name)] = value;
      }

      if (Object.keys(body).length === 0) continue;

      try {
        await this.z
          .resource(`/orgs/${this.orgId}/people`, externalRecord.externalId)
          .patch(body);
      } catch (error) {
        logger.warn(
          `Could not update record ${externalRecord.externalId} in Zetkin`,
          { error },
        );
      }
    }
  }

  private async ensureCustomFieldsExist(
    fieldNames: Set<string>,
  ): Promise<void> {
    if (fieldNames.size === 0) return;

    const fields = await this.getCustomFields();
    const existingSlugs = new Set(fields.map((f) => f.slug));

    for (const fieldName of fieldNames) {
      const slug = slugify(fieldName);
      if (existingSlugs.has(slug)) continue;

      const createResponse = await this.z
        .resource(`/orgs/${this.orgId}/people/fields`)
        .post({ slug, title: fieldName, type: "text" });

      const created = createResponse.data?.data as ZetkinCustomField;
      this.cachedFields?.push(created);

      logger.info(`Created Zetkin custom field "${fieldName}" (slug: ${slug})`);
    }
  }

  async tagRecords(records: TaggedRecord[]): Promise<void> {
    await this.refreshAccessToken();

    for (const record of records) {
      try {
        const tag = await this.findOrCreateTag(record.tag.name);
        const method = record.tag.present ? "put" : "del";
        await this.z
          .resource(
            `/orgs/${this.orgId}/people`,
            record.externalId,
            "tags",
            String(tag.id),
          )
          [method]();
      } catch (error) {
        logger.warn(
          `Could not ${record.tag.present ? "add" : "remove"} tag "${record.tag.name}" on record ${record.externalId} in Zetkin`,
          { error },
        );
      }
    }
  }

  private async getTags(): Promise<ZetkinTag[]> {
    if (this.cachedTags) return this.cachedTags;

    const response = await this.z
      .resource(`/orgs/${this.orgId}/people/tags`)
      .get();

    this.cachedTags = (response.data?.data as ZetkinTag[] | undefined) ?? [];
    return this.cachedTags;
  }

  private async findOrCreateTag(title: string): Promise<ZetkinTag> {
    const tags = await this.getTags();
    const existing = tags.find(
      (t) => t.title.toLowerCase() === title.toLowerCase(),
    );
    if (existing) return existing;

    const response = await this.z
      .resource(`/orgs/${this.orgId}/people/tags`)
      .post({ title });

    const created = response.data?.data as ZetkinTag;
    this.cachedTags?.push(created);
    return created;
  }

  async deleteColumn(columnName: string): Promise<void> {
    if (!columnName.startsWith(ENRICHMENT_COLUMN_PREFIX)) {
      throw new Error(
        `Refusing to delete column "${columnName}": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
      );
    }

    await this.refreshAccessToken();

    const fields = await this.getCustomFields();
    const slug = slugify(columnName);
    const field = fields.find((f) => f.slug === slug);

    if (!field) {
      logger.warn(
        `Could not delete column "${columnName}": field not found in Zetkin`,
      );
      return;
    }

    await this.z
      .resource(`/orgs/${this.orgId}/people/fields`, String(field.id))
      .del();

    this.cachedFields =
      this.cachedFields?.filter((f) => f.id !== field.id) ?? null;

    logger.info(
      `Deleted Zetkin custom field "${columnName}" (id: ${field.id})`,
    );
  }
}
