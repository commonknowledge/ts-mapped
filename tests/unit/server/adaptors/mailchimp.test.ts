import { describe, expect, inject, test } from "vitest";
import { ColumnType } from "@/__generated__/types";
import { MailchimpAdaptor } from "@/server/adaptors/mailchimp";
import logger from "@/server/services/logger";
import { getPublicUrl } from "@/server/services/urls";
import { sleep } from "../../../utils";

const credentials = inject("credentials");

describe("Mailchimp adaptor tests", () => {
  test("Connection succeeds", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );
    const firstRow = await adaptor.fetchFirst();
    expect(firstRow).toHaveProperty("externalId");
  });

  test("extractExternalRecordIdsFromWebhookBody yields external IDs", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    // Test webhook body structure for Mailchimp
    const body = {
      type: "subscribe",
      fired_at: new Date().toISOString(),
      "data[id]": "55502f40dc8b7c769880b10874abc9d0", // MD5 hash format
      "data[email]": "test@example.com",
      "data[list_id]": credentials.mailchimp.listId,
    };

    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      body,
    )) {
      ids.push(id);
    }

    expect(ids).toContain("55502f40dc8b7c769880b10874abc9d0");
  });

  test("getMergeFields returns merge field data", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );
    const mergeFields = await adaptor.getMergeFields();
    expect(Array.isArray(mergeFields)).toBe(true);
    expect(mergeFields.length).toBeGreaterThan(0);
    // Should at least have standard fields like EMAIL, FNAME, LNAME
    const fieldTags = mergeFields.map((field) => field.tag);
    expect(fieldTags).toContain("ADDRESS");
  });

  test("getRecordCount returns member count", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );
    const count = await adaptor.getRecordCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("fetchAll yields records", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );
    const results = [];
    let recordCount = 0;

    for await (const rec of adaptor.fetchAll()) {
      results.push(rec);
      recordCount++;
      // Limit test to avoid long running times
      if (recordCount >= 10) break;
    }

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("externalId");
    expect(results[0]).toHaveProperty("json");
    expect(results[0].json).toHaveProperty("email_address");
    expect(results[0].json).toHaveProperty("status");
  });

  test("fetchFirst returns first member", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );
    const firstRecord = await adaptor.fetchFirst();

    if (firstRecord) {
      expect(firstRecord).toHaveProperty("externalId");
      expect(firstRecord).toHaveProperty("json");
      expect(firstRecord.json).toHaveProperty("email_address");
      expect(firstRecord.json).toHaveProperty("status");
    }
  });

  test("fetchByExternalId returns specific records", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    // Get some records first
    const all = [];
    let count = 0;
    for await (const rec of adaptor.fetchAll()) {
      all.push(rec);
      count++;
      if (count >= 3) break; // Get at least 3 records for testing
    }

    if (all.length === 0) {
      throw new Error("No records in Mailchimp list");
    }

    // Test fetching by external ID
    const externalIds = all.slice(0, 2).map((rec) => rec.externalId);
    const result = await adaptor.fetchByExternalId(externalIds);

    expect(result.length).toBe(externalIds.length);
    expect(result[0]).toHaveProperty("externalId");
    expect(externalIds).toContain(result[0].externalId);
  });

  test("data transformation includes flattened address fields", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    const firstRecord = await adaptor.fetchFirst();

    if (firstRecord) {
      const json = firstRecord.json;

      // Check for standard fields
      expect(json).toHaveProperty("email_address");
      expect(json).toHaveProperty("status");
      expect(json).toHaveProperty("language");
      expect(json).toHaveProperty("vip");
      expect(json).toHaveProperty("tags_count");

      // Address fields should be present (even if empty)
      expect(json).toHaveProperty("address_addr1");
      expect(json).toHaveProperty("address_city");
      expect(json).toHaveProperty("address_state");
      expect(json).toHaveProperty("address_zip");
      expect(json).toHaveProperty("address_country");
    }
  });

  test("webhooks management", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    // Enable webhook
    await adaptor.toggleWebhook(true);

    let result = await adaptor.listWebhooks(await getPublicUrl());
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Verify webhook structure
    const webhook = result[0];
    expect(webhook).toHaveProperty("id");
    expect(webhook).toHaveProperty("url");
    expect(webhook).toHaveProperty("events");
    expect(webhook.events).toHaveProperty("subscribe");
    expect(webhook.events).toHaveProperty("unsubscribe");
    expect(webhook.events).toHaveProperty("profile");

    // Disable webhook
    await adaptor.toggleWebhook(false);

    result = await adaptor.listWebhooks(await getPublicUrl());
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test("removeDevWebhooks cleans up development webhooks", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    // This should run without error even if no ngrok webhooks exist
    await expect(adaptor.removeDevWebhooks()).resolves.not.toThrow();

    // Verify no ngrok webhooks remain
    const ngrokWebhooks = await adaptor.listWebhooks("ngrok");
    expect(ngrokWebhooks.length).toBe(0);
  });

  test("updateRecords updates member merge fields", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    // Get a member to update
    const all = [];
    for await (const rec of adaptor.fetchAll()) {
      all.push(rec);
      break; // Just get the first one
    }

    if (all.length === 0) {
      throw new Error("No members in Mailchimp list");
    }

    const testValue = "test-value-" + Date.now();
    const enrichedRecords = [
      {
        externalRecord: all[0],
        columns: [
          {
            def: { name: "MPD_V3_TST", type: ColumnType.String },
            value: testValue,
          },
        ],
      },
    ];

    await adaptor.updateRecords(enrichedRecords);

    // Wait a moment for Mailchimp batch processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    while (true) {
      // Fetch the updated record
      const updatedRecords = await adaptor.fetchByExternalId([
        all[0].externalId,
      ]);
      expect(updatedRecords.length).toBe(1);

      try {
        expect(updatedRecords[0].json.MPD_V3_TST).toBe(testValue);
        break;
      } catch {
        logger.warn("Mailchimp member not updated yet, sleeping for 5 seconds");
        await sleep(5000);
      }
    }
  });

  test("batch size limits are respected", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    // Create array with more than allowed batch size
    const tooManyIds = Array(101)
      .fill(0)
      .map((_, i) => `fake-id-${i}`);

    await expect(adaptor.fetchByExternalId(tooManyIds)).rejects.toThrow(
      "Cannot fetch more than 100 records at once",
    );
  });

  test("error handling for invalid webhook body", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    try {
      const generator = adaptor.extractExternalRecordIdsFromWebhookBody(null);
      await generator.next(); // This should throw
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(String(error)).toContain("Empty Mailchimp webhook body");
    }

    try {
      const generator = adaptor.extractExternalRecordIdsFromWebhookBody({});
      await generator.next(); // This should throw during validation
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("webhook body validation filters incorrect list IDs", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    const bodyWithWrongListId = {
      type: "subscribe",
      fired_at: new Date().toISOString(),
      "data[id]": "test123456789abcdef",
      "data[email]": "test@example.com",
      "data[list_id]": "wrong-list-id",
    };

    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      bodyWithWrongListId,
    )) {
      ids.push(id);
    }

    // Should not yield any IDs for wrong list
    expect(ids).toHaveLength(0);
  });

  test("tagRecords updates a record", async () => {
    const adaptor = new MailchimpAdaptor(
      "test-data-source",
      credentials.mailchimp.apiKey,
      credentials.mailchimp.listId,
    );

    // Get a record first
    const firstRecord = await adaptor.fetchFirst();
    if (!firstRecord) {
      throw new Error("No records found in Mailchimp");
    }

    const taggedRecords = [
      {
        externalId: firstRecord.externalId,
        json: firstRecord.json,
        tag: {
          name: "My View",
          present: true,
        },
      },
    ];

    await adaptor.tagRecords(taggedRecords);

    while (true) {
      try {
        const updatedRecords = await adaptor.fetchByExternalId([
          firstRecord.externalId,
        ]);

        expect(updatedRecords[0].json["My View"]).toBe(true);
        break;
      } catch {
        logger.warn("Mailchimp member not tagged yet, sleeping for 5 seconds");
        await sleep(5000);
      }
    }

    taggedRecords[0].tag.present = false;
    await adaptor.tagRecords(taggedRecords);

    while (true) {
      try {
        const updatedRecords = await adaptor.fetchByExternalId([
          firstRecord.externalId,
        ]);

        expect(updatedRecords[0].json["My View"]).toBeFalsy();
        break;
      } catch {
        logger.warn(
          "Mailchimp member not untagged yet, sleeping for 5 seconds",
        );
        await sleep(5000);
      }
    }
  });
}, 30000);
