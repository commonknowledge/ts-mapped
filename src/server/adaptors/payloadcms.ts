import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import logger from "@/server/services/logger";
import type { DataSourceAdaptor } from "./abstract";
import type { EnrichedRecord } from "@/server/mapping/enrich";
import type { ExternalRecord, TaggedRecord } from "@/types";

/**
 * PayloadCMS Data Source Adaptor
 * 
 * Implements integration with PayloadCMS REST API
 * Documentation: https://payloadcms.com/docs/rest-api/overview
 * Authentication: https://payloadcms.com/docs/authentication/api-keys#api-key-only-auth
 */
export class PayloadCMSAdaptor implements DataSourceAdaptor {
  private apiBaseUrl: string;
  private apiKey: string;
  private collectionName: string;

  constructor(apiBaseUrl: string, apiKey: string, collectionName: string) {
    // Ensure the base URL doesn't have a trailing slash
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.collectionName = collectionName;
  }

  /**
   * Get the base URL for the collection API endpoint
   */
  private getCollectionURL(): URL {
    return new URL(`${this.apiBaseUrl}/api/${this.collectionName}`);
  }

  /**
   * Get common headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `${this.collectionName} API-Key ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * PayloadCMS doesn't have a built-in webhook system like Airtable,
   * so this method is not applicable
   */
  async *extractExternalRecordIdsFromWebhookBody(
    body: unknown,
  ): AsyncGenerator<string> {
    logger.warn(
      "PayloadCMS does not support webhooks through this adaptor. Consider using auto-import instead.",
    );
    // No-op: PayloadCMS doesn't have a standard webhook system
  }

  /**
   * Get the total count of records in the collection
   */
  async getRecordCount(): Promise<number | null> {
    try {
      const url = this.getCollectionURL();
      url.searchParams.set("limit", "1");
      url.searchParams.set("page", "1");

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const responseText = await response.text();
        logger.error(
          `Bad get record count response: ${response.status}, ${responseText}`,
        );
        return null;
      }

      const json = (await response.json()) as {
        totalDocs?: number;
      };

      return json.totalDocs ?? null;
    } catch (error) {
      logger.error("Error getting record count from PayloadCMS", { error });
      return null;
    }
  }

  /**
   * Fetch all records from the collection using pagination
   */
  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const url = this.getCollectionURL();
        url.searchParams.set("limit", "100");
        url.searchParams.set("page", String(page));
        url.searchParams.set("depth", "0"); // Don't populate relationships

        const response = await fetch(url, {
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          const responseText = await response.text();
          throw new Error(
            `Bad fetch all response: ${response.status}, ${responseText}`,
          );
        }

        const json = (await response.json()) as {
          docs: Array<{ id: string; [key: string]: unknown }>;
          hasNextPage: boolean;
        };

        if (!Array.isArray(json.docs)) {
          throw new Error(`Invalid response format: docs is not an array`);
        }

        for (const doc of json.docs) {
          if (doc.id) {
            // Create a copy without the id field for the json property
            const { id, ...fields } = doc;
            yield {
              externalId: String(id),
              json: fields,
            };
          }
        }

        hasNextPage = json.hasNextPage ?? false;
        page++;
      } catch (error) {
        logger.error(`Error fetching page ${page} from PayloadCMS`, { error });
        throw error;
      }
    }
  }

  /**
   * Fetch the first record from the collection
   */
  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const url = this.getCollectionURL();
      url.searchParams.set("limit", "1");
      url.searchParams.set("page", "1");
      url.searchParams.set("depth", "0"); // Don't populate relationships

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Bad fetch first response: ${response.status}, ${responseText}`,
        );
      }

      const json = (await response.json()) as {
        docs: Array<{ id: string; [key: string]: unknown }>;
      };

      if (!Array.isArray(json.docs) || json.docs.length === 0) {
        return null;
      }

      const doc = json.docs[0];
      const { id, ...fields } = doc;

      return {
        externalId: String(id),
        json: fields,
      };
    } catch (error) {
      logger.error("Error fetching first record from PayloadCMS", { error });
      return null;
    }
  }

  /**
   * Fetch specific records by their external IDs
   */
  async fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    if (externalIds.length > DATA_RECORDS_JOB_BATCH_SIZE) {
      throw new Error(
        `Cannot fetch more than ${DATA_RECORDS_JOB_BATCH_SIZE} records at once.`,
      );
    }

    const results: ExternalRecord[] = [];

    // PayloadCMS doesn't support batch fetching in a single request,
    // so we need to fetch each record individually
    for (const externalId of externalIds) {
      try {
        const url = new URL(`${this.apiBaseUrl}/api/${this.collectionName}/${externalId}`);

        const response = await fetch(url, {
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          logger.warn(
            `Failed to fetch record ${externalId}: ${response.status}`,
          );
          continue;
        }

        const doc = (await response.json()) as {
          id: string;
          [key: string]: unknown;
        };

        const { id, ...fields } = doc;
        results.push({
          externalId: String(id),
          json: fields,
        });
      } catch (error) {
        logger.error(`Error fetching record ${externalId} from PayloadCMS`, {
          error,
        });
      }
    }

    return results;
  }

  /**
   * PayloadCMS doesn't have a concept of dev webhooks
   */
  async removeDevWebhooks(): Promise<void> {
    // No-op: PayloadCMS doesn't have webhooks in the standard API
  }

  /**
   * PayloadCMS doesn't support webhooks through the standard REST API
   */
  async toggleWebhook(enable: boolean): Promise<void> {
    if (enable) {
      logger.warn(
        "PayloadCMS does not support webhooks through the REST API. Consider enabling auto-import for this data source.",
      );
    }
    // No-op: PayloadCMS doesn't have webhooks in the standard API
  }

  /**
   * Update records in PayloadCMS with enriched data
   */
  async updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void> {
    for (const record of enrichedRecords) {
      try {
        const url = new URL(
          `${this.apiBaseUrl}/api/${this.collectionName}/${record.externalRecord.externalId}`,
        );

        const fields: Record<string, unknown> = {};
        for (const column of record.columns) {
          fields[column.def.name] = column.value;
        }

        const response = await fetch(url, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(fields),
        });

        if (!response.ok) {
          const responseText = await response.text();
          logger.error(
            `Failed to update record ${record.externalRecord.externalId}: ${response.status}, ${responseText}`,
          );
        }
      } catch (error) {
        logger.error(
          `Error updating record ${record.externalRecord.externalId} in PayloadCMS`,
          { error },
        );
      }
    }
  }

  /**
   * Tag records in PayloadCMS with boolean fields
   */
  async tagRecords(taggedRecords: TaggedRecord[]): Promise<void> {
    if (!taggedRecords.length) {
      return;
    }

    for (const record of taggedRecords) {
      try {
        const url = new URL(
          `${this.apiBaseUrl}/api/${this.collectionName}/${record.externalId}`,
        );

        const response = await fetch(url, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify({
            [record.tag.name]: record.tag.present,
          }),
        });

        if (!response.ok) {
          const responseText = await response.text();
          logger.error(
            `Failed to tag record ${record.externalId}: ${response.status}, ${responseText}`,
          );
        }
      } catch (error) {
        logger.error(
          `Error tagging record ${record.externalId} in PayloadCMS`,
          { error },
        );
      }
    }
  }
}
