import z from "zod";
import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import { EnrichedRecord } from "@/server/mapping/enrich";
import logger from "@/server/services/logger";
import { ExternalRecord } from "@/types";
import { DataSourceAdaptor } from "./abstract";

// Action Network webhook payload follows OSDI specification
const ActionNetworkWebhookPayload = z.array(
  z
    .object({
      identifiers: z.array(z.string()).optional(),
      created_date: z.string().optional(),
      modified_date: z.string().optional(),
      // Person-specific fields
      given_name: z.string().optional(),
      family_name: z.string().optional(),
      email_addresses: z
        .array(
          z.object({
            primary: z.boolean().optional(),
            address: z.string(),
            status: z.string().optional(),
          }),
        )
        .optional(),
      phone_numbers: z
        .array(
          z.object({
            primary: z.boolean().optional(),
            number: z.string(),
            number_type: z.string().optional(),
          }),
        )
        .optional(),
      postal_addresses: z
        .array(
          z.object({
            primary: z.boolean().optional(),
            address_lines: z.array(z.string()).optional(),
            locality: z.string().optional(),
            region: z.string().optional(),
            postal_code: z.string().optional(),
            country: z.string().optional(),
          }),
        )
        .optional(),
      // Custom fields and additional data
      custom_fields: z.record(z.unknown()).optional(),
      // OSDI links structure
      _links: z
        .object({
          self: z.object({
            href: z.string(),
          }),
          "osdi:person": z
            .object({
              href: z.string(),
            })
            .optional(),
          // Other potential links
        })
        .optional(),
      // Additional fields that might be present
      languages_spoken: z.array(z.string()).optional(),
      employer: z.string().optional(),
      occupation: z.string().optional(),
      // Catch-all for other fields
    })
    .passthrough(),
);

export class ActionNetworkAdaptor implements DataSourceAdaptor {
  private dataSourceId: string;
  private apiKey: string;
  private baseUrl: string;
  private resourceType: string; // e.g., 'people', 'donations', 'signatures'

  constructor(dataSourceId: string, apiKey: string, resourceType = "people") {
    this.dataSourceId = dataSourceId;
    this.apiKey = apiKey;
    this.baseUrl = "https://actionnetwork.org/api/v2/";
    this.resourceType = resourceType;
  }

  async *extractExternalRecordIdsFromWebhookBody(
    body: unknown,
  ): AsyncGenerator<string> {
    if (!body) {
      throw new Error("Empty Action Network webhook body");
    }

    logger.debug(`Action Network webhook body: ${JSON.stringify(body)}`);

    const parsedPayload = ActionNetworkWebhookPayload.safeParse(body);
    if (!parsedPayload.success) {
      logger.warn(
        `Failed to parse Action Network webhook payload: ${JSON.stringify(body)}`,
      );
      return;
    }

    for (const record of parsedPayload.data) {
      // Extract ID from self link if available
      if (record._links?.self?.href) {
        const urlParts = record._links.self.href.split("/");
        const externalId = urlParts[urlParts.length - 1];
        if (externalId) {
          yield externalId;
        }
      }

      // Fallback to identifiers array if present
      if (record.identifiers && record.identifiers.length > 0) {
        for (const identifier of record.identifiers) {
          yield identifier;
        }
      }
    }
  }

  async getRecordCount(): Promise<number | null> {
    try {
      const url = new URL(`${this.baseUrl}${this.resourceType}`);
      url.searchParams.set("per_page", "1"); // Just get metadata

      const response = await fetch(url.toString(), {
        headers: {
          "OSDI-API-Token": this.apiKey,
          "Content-Type": "application/hal+json",
        },
      });

      if (!response.ok) {
        logger.warn(
          `Could not get record count for Action Network ${this.resourceType}`,
        );
        return null;
      }

      const json = await response.json();
      return json.total_records || json.total_pages
        ? json.total_pages * json.per_page
        : null;
    } catch (error) {
      logger.warn(
        `Error getting record count for Action Network ${this.resourceType}`,
        { error },
      );
      return null;
    }
  }

  getURL(): URL {
    return new URL(`${this.baseUrl}${this.resourceType}`);
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const pageData = await this.fetchPage({ page });

        if (
          !pageData._embedded ||
          !pageData._embedded[`osdi:${this.resourceType}`]
        ) {
          break;
        }

        const records = pageData._embedded[`osdi:${this.resourceType}`];

        for (const record of records) {
          const externalId = this.extractIdFromRecord(record);
          if (externalId) {
            yield {
              externalId,
              json: this.normalizeRecord(record),
            };
          }
        }

        // Check if there are more pages
        hasMore = pageData._links?.next?.href ? true : false;
        page++;
      } catch (error) {
        logger.error(
          `Error fetching page ${page} for Action Network ${this.resourceType}`,
          { error },
        );
        break;
      }
    }
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const pageData = await this.fetchPage({ page: 1, limit: 1 });

      if (
        !pageData._embedded ||
        !pageData._embedded[`osdi:${this.resourceType}`]
      ) {
        return null;
      }

      const records = pageData._embedded[`osdi:${this.resourceType}`];
      if (records.length === 0) {
        return null;
      }

      const record = records[0];
      const externalId = this.extractIdFromRecord(record);

      if (!externalId) {
        return null;
      }

      return {
        externalId,
        json: this.normalizeRecord(record),
      };
    } catch (error) {
      logger.warn(
        `Could not get first record for Action Network ${this.resourceType}`,
        { error },
      );
      return null;
    }
  }

  async fetchPage({ page = 1, limit = 25 }: { page?: number; limit?: number }) {
    const url = this.getURL();
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        "OSDI-API-Token": this.apiKey,
        "Content-Type": "application/hal+json",
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `Bad fetch page response: ${response.status}, ${responseText}`,
      );
    }

    const json = await response.json();
    if (typeof json !== "object") {
      throw new Error(`Bad fetch page response body: ${JSON.stringify(json)}`);
    }

    return json;
  }

  async fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    if (externalIds.length > DATA_RECORDS_JOB_BATCH_SIZE) {
      throw new Error("Cannot fetch more than 100 records at once.");
    }

    const results: ExternalRecord[] = [];

    // Action Network doesn't support bulk fetching by ID in a single request,
    // so we need to fetch each record individually
    for (const externalId of externalIds) {
      try {
        const url = new URL(
          `${this.baseUrl}${this.resourceType}/${externalId}`,
        );

        const response = await fetch(url.toString(), {
          headers: {
            "OSDI-API-Token": this.apiKey,
            "Content-Type": "application/hal+json",
          },
        });

        if (response.ok) {
          const record = await response.json();
          results.push({
            externalId,
            json: this.normalizeRecord(record),
          });
        }
      } catch (error) {
        logger.warn(
          `Could not fetch record ${externalId} from Action Network`,
          { error },
        );
      }
    }

    return results;
  }

  async removeDevWebhooks(): Promise<void> {
    // Action Network doesn't allow webhook management via API
    // Webhooks must be managed through the dashboard
    logger.info(
      `Action Network doesn't support webhook management via API. ` +
        `Please remove dev webhooks manually through the Action Network dashboard.`,
    );
  }

  async toggleWebhook(enable: boolean): Promise<void> {
    // Action Network doesn't allow webhook creation/management via API
    // Webhooks must be set up through the dashboard
    logger.info(
      `Action Network doesn't support webhook creation via API. ` +
        `Please ${enable ? "create" : "disable"} webhooks manually through the Action Network dashboard.`,
    );
  }

  async updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void> {
    // Action Network API has limited update capabilities depending on the resource type
    // For people, we can update certain fields

    for (const record of enrichedRecords) {
      try {
        const url = new URL(
          `${this.baseUrl}${this.resourceType}/${record.externalId}`,
        );

        // Build the update payload based on the enriched record
        const updatePayload = this.buildUpdatePayload(record);

        const response = await fetch(url.toString(), {
          method: "PUT",
          headers: {
            "OSDI-API-Token": this.apiKey,
            "Content-Type": "application/hal+json",
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const responseText = await response.text();
          logger.error(
            `Failed to update Action Network record ${record.externalId}: ${response.status}, ${responseText}`,
          );
        }
      } catch (error) {
        logger.error(
          `Error updating Action Network record ${record.externalId}`,
          { error },
        );
      }
    }
  }

  private extractIdFromRecord(record: unknown): string | null {
    // Try to extract ID
    if (!record || typeof record !== "object") {
      return null;
    }

    if (
      "identifiers" in record &&
      Array.isArray(record.identifiers) &&
      record.identifiers.length
    ) {
      return record.identifiers[0];
    }

    // Fallback to self link
    if (
      "_links" in record &&
      record._links &&
      typeof record._links === "object" &&
      "self" in record._links &&
      record._links.self &&
      typeof record._links.self === "object" &&
      "href" in record._links.self &&
      typeof record._links.self.href === "string"
    ) {
      const urlParts = record._links.self.href.split("/");
      return urlParts[urlParts.length - 1];
    }

    return null;
  }

  private normalizeRecord(record: unknown): Record<string, unknown> {
    if (!record || typeof record !== "object") {
      return {};
    }

    // Remove OSDI-specific metadata and flatten the record for easier processing
    const normalized: Record<string, unknown> = {};

    // Copy basic fields
    const fieldsToInclude = [
      "given_name",
      "family_name",
      "email_addresses",
      "phone_numbers",
      "postal_addresses",
      "languages_spoken",
      "employer",
      "occupation",
      "created_date",
      "modified_date",
    ];

    for (const field of fieldsToInclude) {
      if (field in record) {
        normalized[field] = (record as Record<string, unknown>)[field];
      }
    }

    // Include custom fields
    if ("custom_fields" in record && record.custom_fields) {
      Object.assign(normalized, record.custom_fields);
    }

    // Flatten email addresses for easier access
    if (
      "email_addresses" in record &&
      Array.isArray(record.email_addresses) &&
      record.email_addresses.length > 0
    ) {
      const primaryEmail =
        record.email_addresses.find((e) => e.primary) ||
        record.email_addresses[0];
      normalized.primary_email = primaryEmail.address;
    }

    // Flatten phone numbers
    if (
      "phone_numbers" in record &&
      Array.isArray(record.phone_numbers) &&
      record.phone_numbers.length > 0
    ) {
      const primaryPhone =
        record.phone_numbers.find((p) => p.primary) || record.phone_numbers[0];
      normalized.primary_phone = primaryPhone.number;
    }

    return normalized;
  }

  private buildUpdatePayload(record: EnrichedRecord): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    // Map enriched record columns to Action Network fields
    for (const column of record.columns) {
      const fieldName = column.def.name;
      const value = column.value;

      // Map common fields
      switch (fieldName.toLowerCase()) {
        case "given_name":
        case "first_name":
          payload.given_name = value;
          break;
        case "family_name":
        case "last_name":
          payload.family_name = value;
          break;
        case "email":
        case "primary_email":
          payload.email_addresses = [{ address: value, primary: true }];
          break;
        case "phone":
        case "primary_phone":
          payload.phone_numbers = [{ number: value, primary: true }];
          break;
        case "employer":
          payload.employer = value;
          break;
        case "occupation":
          payload.occupation = value;
          break;
        default:
          // Put unknown fields in custom_fields
          if (!payload.custom_fields) {
            payload.custom_fields = {};
          }
          (payload.custom_fields as Record<string, unknown>)[fieldName] = value;
          break;
      }
    }

    return payload;
  }
}
