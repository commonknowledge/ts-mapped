import z from "zod";
import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import { EnrichedRecord } from "@/server/mapping/enrich";
import logger from "@/server/services/logger";
import { ExternalRecord, TaggedRecord } from "@/types";
import { DataSourceAdaptor } from "./abstract";

const ActionNetworkWebhookPayload = z.array(
  z
    .object({
      "osdi:signature": z.object({
        identifiers: z.array(z.string()).optional(),
        created_date: z.string().optional(),
        modified_date: z.string().optional(),
        comments: z.string().optional(),
        person: z.object({
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
          custom_fields: z.record(z.unknown()).optional(),
          languages_spoken: z.array(z.string()).optional(),
          employer: z.string().optional(),
          occupation: z.string().optional(),
        }),
        "action_network:referrer_data": z.record(z.unknown()).optional(),
        add_tags: z.array(z.string()).optional(),
        _links: z
          .object({
            self: z.object({
              href: z.string(),
            }),
            "osdi:petition": z
              .object({
                href: z.string(),
              })
              .optional(),
            "osdi:person": z
              .object({
                href: z.string(),
              })
              .optional(),
            // Other potential links
          })
          .passthrough()
          .optional(),
      }),
      "action_network:sponsor": z
        .object({
          title: z.string().optional(),
          url: z.string().optional(),
        })
        .optional(),
      idempotency_key: z.string().optional(),
    })
    .passthrough(),
);

export class ActionNetworkAdaptor implements DataSourceAdaptor {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://actionnetwork.org/api/v2/people";
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
      const identifiers = record["osdi:signature"].identifiers;
      if (identifiers && identifiers[0]) {
        logger.debug(
          `Received Action Network person from webhook: ${identifiers}`,
        );
        yield identifiers[0].replace(/^action_network:/, "");
      } else {
        const personLink = record["osdi:signature"]._links?.["osdi:person"];
        if (personLink) {
          const urlParts = personLink.href.split("/");
          const externalId = urlParts[urlParts.length - 1];
          if (externalId) {
            logger.debug(
              `Received Action Network person from webhook: ${identifiers}`,
            );
            yield externalId.replace(/^action_network:/, "");
          }
        }
      }
    }
  }

  async getRecordCount(): Promise<number | null> {
    return null;
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const pageData = await this.fetchPage({ page });

        if (!pageData._embedded || !pageData._embedded[`osdi:people`]) {
          break;
        }

        const records = pageData._embedded[`osdi:people`];

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
        logger.error(`Error fetching page ${page} for Action Network`, {
          error,
        });
        break;
      }
    }
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const pageData = await this.fetchPage({ page: 1, limit: 1 });

      if (!pageData._embedded || !pageData._embedded[`osdi:people`]) {
        return null;
      }

      const records = pageData._embedded[`osdi:people`];
      if (records.length === 0) {
        return null;
      }

      for (const record of records) {
        const externalId = this.extractIdFromRecord(record);
        const json = this.normalizeRecord(record);
        if (externalId && Object.keys(json).length) {
          return { externalId, json };
        }
      }

      return null;
    } catch (error) {
      logger.warn(`Could not get first record for Action Network`, { error });
      return null;
    }
  }

  async fetchPage({ page = 1, limit = 25 }: { page?: number; limit?: number }) {
    const url = new URL(this.baseUrl);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        "OSDI-API-Token": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `Bad fetch page response: ${response.status}, ${responseText}`,
      );
    }

    const json = (await response.json()) as {
      _embedded: { "osdi:people": ExternalRecord[] };
      _links: { next: { href: string } };
    };
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
        const url = new URL(`${this.baseUrl}/${externalId}`);

        const response = await fetch(url.toString(), {
          headers: {
            "OSDI-API-Token": this.apiKey,
            "Content-Type": "application/json",
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
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async toggleWebhook(enable: boolean): Promise<void> {
    logger.debug("Cannot toggle webhooks for Action Network data source");
  }

  async updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void> {
    // Action Network API has limited update capabilities depending on the resource type
    // For people, we can update certain fields

    for (const record of enrichedRecords) {
      try {
        const url = new URL(this.baseUrl);

        // Build the update payload based on the enriched record
        const customFields: Record<string, unknown> = {};
        for (const column of record.columns) {
          customFields[column.def.name] = column.value;
        }

        const updatePayload = {
          person: {
            email_addresses: [
              {
                address: record.externalRecord.json.primary_email,
              },
            ],
            custom_fields: customFields,
          },
        };

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "OSDI-API-Token": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const responseText = await response.text();
          logger.error(
            `Failed to update Action Network record ${record.externalRecord.externalId}: ${response.status}, ${responseText}`,
          );
        }
      } catch (error) {
        logger.error(
          `Error updating Action Network record ${record.externalRecord.externalId}`,
          { error },
        );
      }
    }
  }

  async tagRecords(records: TaggedRecord[]): Promise<void> {
    for (const record of records) {
      try {
        const url = new URL(this.baseUrl);

        const updatePayload = {
          person: {
            email_addresses: [
              {
                address: record.json.primary_email,
              },
            ],
            custom_fields: {
              [record.tag.name]: record.tag.present ? "true" : "false",
            },
          },
        };

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "OSDI-API-Token": this.apiKey,
            "Content-Type": "application/json",
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

  private extractIdFromRecord(input: unknown): string | null {
    // Try to extract ID

    const schema = z.object({
      identifiers: z.array(z.string()),
      _links: z.object({ self: z.object({ href: z.string() }) }),
    });
    const parsedRecord = schema.safeParse(input);
    if (!parsedRecord.success) {
      return null;
    }
    const record = parsedRecord.data;

    if (
      "identifiers" in record &&
      Array.isArray(record.identifiers) &&
      record.identifiers.length
    ) {
      return record.identifiers[0]?.replace(/^action_network:/, "");
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
      return urlParts[urlParts.length - 1].replace(/^action_network:/, "");
    }

    return null;
  }

  private normalizeRecord(input: unknown): Record<string, unknown> {
    const recordSchema = z
      .object({
        given_name: z.string(),
        family_name: z.string(),
        employer: z.string(),
        occupation: z.string(),
        created_date: z.string(),
        modified_date: z.string(),
        email_addresses: z.array(
          z.object({ address: z.string(), primary: z.boolean() }).partial(),
        ),
        phone_numbers: z.array(
          z.object({ number: z.string(), primary: z.boolean() }).partial(),
        ),
        postal_addresses: z.array(
          z.object({ postal_code: z.string(), primary: z.boolean() }).partial(),
        ),
        custom_fields: z.record(z.unknown()),
        languages_spoken: z.array(z.string()),
      })
      .partial();
    const parsedRecord = recordSchema.safeParse(input);
    if (!parsedRecord.success) {
      logger.warn("Error parsing Action Network record", {
        error: parsedRecord.error,
      });
      return {};
    }
    const record = parsedRecord.data;

    // Remove OSDI-specific metadata and flatten the record for easier processing
    const normalized: Record<string, unknown> = {};

    // Copy basic fields
    const fieldsToInclude = [
      "given_name",
      "family_name",
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

    // Add full name field
    normalized.name = [normalized.given_name, normalized.family_name]
      .filter(Boolean)
      .join(" ");

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

    // Always include a postcode record for better UX
    normalized.postcode = "";
    if (
      "postal_addresses" in record &&
      Array.isArray(record.postal_addresses) &&
      record.postal_addresses.length > 0
    ) {
      const primaryAddress = record.postal_addresses.find((a) => a.primary);
      if (primaryAddress && primaryAddress.postal_code) {
        normalized.postcode = primaryAddress.postal_code;
      } else {
        const postcodeAddress = record.postal_addresses.find(
          (a) => a.postal_code,
        );
        if (postcodeAddress) {
          normalized.postcode = postcodeAddress.postal_code;
        }
      }
    }

    if (
      "languages_spoken" in record &&
      Array.isArray(record.languages_spoken)
    ) {
      normalized.languages_spoken = record.languages_spoken
        .filter(Boolean)
        .join(", ");
    }

    return normalized;
  }
}
