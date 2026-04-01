import fs from "fs";
import { describe, expect, test } from "vitest";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { ColumnType } from "@/models/DataSource";
import { ZetkinAdaptor } from "@/server/adaptors/zetkin";
import { getBaseDir } from "@/server/utils";
import type { ProvidedContext } from "vitest";

// Read directly from disk so watch-mode reruns always pick up freshly-written credentials.
const credentialsPath = `${getBaseDir()}/test_credentials.json`;
const testCredentials = JSON.parse(
  fs.readFileSync(credentialsPath, "utf8"),
) as ProvidedContext["credentials"];

const zConfig = testCredentials.zetkin;
const zetkinCredentialsExpired =
  zConfig && zConfig.oAuthCredentials.expiry_date < Date.now();
const hasZetkinCredentials = Boolean(zConfig) && !zetkinCredentialsExpired;

if (!zConfig) {
  console.log(
    "\nSkipping Zetkin tests: no Zetkin credentials found in test_credentials.json.\n" +
      "To run these tests, log in to Zetkin manually via the OAuth flow and copy the\n" +
      'resulting credentials into the "zetkin" key of test_credentials.json.',
  );
} else if (zetkinCredentialsExpired) {
  console.log(
    "\nSkipping Zetkin tests: Zetkin credentials in test_credentials.json have expired.\n" +
      "To run these tests, log in to Zetkin manually via the OAuth flow and update the\n" +
      '"zetkin" key in test_credentials.json with fresh credentials.',
  );
}

describe.skipIf(!hasZetkinCredentials)(
  "Zetkin adaptor tests",
  () => {
    const zetkin = zConfig || {
      orgId: "",
      oAuthCredentials: {
        access_token: "",
        token_type: "",
        refresh_token: "",
        expiry_date: Date.now(),
      },
    };

    test("Connection succeeds", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );
      const firstRow = await adaptor.fetchFirst();
      expect(firstRow).toHaveProperty("externalId");
      expect(firstRow).toHaveProperty("json");
    });

    test("fetchAll yields records", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const results = [];
      let count = 0;
      for await (const rec of adaptor.fetchAll()) {
        results.push(rec);
        count++;
        if (count >= 5) break;
      }

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("externalId");
      expect(results[0]).toHaveProperty("json");
      expect(results[0].json).toHaveProperty("first_name");
    });

    test("fetchFirst returns first data record", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const firstRecord = await adaptor.fetchFirst();

      if (firstRecord) {
        expect(firstRecord).toHaveProperty("externalId");
        expect(firstRecord).toHaveProperty("json");
        expect(typeof firstRecord.json).toBe("object");
        expect(firstRecord.json).toHaveProperty("first_name");
      }
    });

    test("fetchByExternalId returns records", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const firstRecord = await adaptor.fetchFirst();
      if (!firstRecord) {
        throw new Error("No records found in Zetkin");
      }

      const result = await adaptor.fetchByExternalId([firstRecord.externalId]);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty("externalId", firstRecord.externalId);
      expect(result[0]).toHaveProperty("json");
    });

    test("fetchByExternalId handles multiple IDs", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const records = [];
      let count = 0;
      for await (const rec of adaptor.fetchAll()) {
        records.push(rec);
        count++;
        if (count >= 3) break;
      }

      if (records.length < 2) {
        throw new Error("Need at least 2 records for this test");
      }

      const externalIds = records.slice(0, 2).map((r) => r.externalId);
      const result = await adaptor.fetchByExternalId(externalIds);
      expect(result.length).toBe(2);
      expect(result.map((r) => r.externalId)).toEqual(
        expect.arrayContaining(externalIds),
      );
    });

    test("fetchByExternalId respects batch size limit", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const tooManyIds = Array.from({ length: 101 }, (_, i) => `id-${i}`);

      await expect(adaptor.fetchByExternalId(tooManyIds)).rejects.toThrow(
        "Cannot fetch more than 100 records at once.",
      );
    });

    test("getRecordCount returns null", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const count = await adaptor.getRecordCount();
      expect(count).toBeNull();
    });

    test("updateRecords skips non-enrichment columns", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const firstRecord = await adaptor.fetchFirst();
      if (!firstRecord) {
        throw new Error("No records found in Zetkin");
      }

      const originalExtId = firstRecord.json.ext_id;

      // Should not throw, and should not modify ext_id (not an enrichment column)
      await adaptor.updateRecords([
        {
          externalRecord: firstRecord,
          columns: [
            {
              def: { name: "ext_id", type: ColumnType.String },
              value: "should-not-be-set",
            },
          ],
        },
      ]);

      const [refetched] = await adaptor.fetchByExternalId([
        firstRecord.externalId,
      ]);
      expect(refetched.json.ext_id).toBe(originalExtId);
    });

    test("deleteColumn rejects non-enrichment columns", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      await expect(adaptor.deleteColumn("NotPrefixed")).rejects.toThrow(
        `Refusing to delete column "NotPrefixed": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
      );
    });

    test("updateRecords patches person fields", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const firstRecord = await adaptor.fetchFirst();
      if (!firstRecord) {
        throw new Error("No records found in Zetkin");
      }

      const fieldName = `${ENRICHMENT_COLUMN_PREFIX}test`;
      const testValue = `mapped-test-${Date.now()}`;

      await adaptor.updateRecords([
        {
          externalRecord: firstRecord,
          columns: [
            {
              def: { name: fieldName, type: ColumnType.String },
              value: testValue,
            },
          ],
        },
      ]);

      const [updated] = await adaptor.fetchByExternalId([
        firstRecord.externalId,
      ]);
      expect(updated.json[fieldName]).toBe(testValue);
    });

    test("tagRecords adds a tag to a person", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const firstRecord = await adaptor.fetchFirst();
      if (!firstRecord) {
        throw new Error("No records found in Zetkin");
      }

      const tagName = `Mapped: test tag ${Date.now()}`;

      await adaptor.tagRecords([
        {
          externalId: firstRecord.externalId,
          json: firstRecord.json,
          tag: { name: tagName, present: true },
        },
      ]);

      // Verify tag was added by re-tagging with the same name (idempotent — should not throw)
      await adaptor.tagRecords([
        {
          externalId: firstRecord.externalId,
          json: firstRecord.json,
          tag: { name: tagName, present: true },
        },
      ]);
    });

    test("tagRecords removes a tag from a person", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const firstRecord = await adaptor.fetchFirst();
      if (!firstRecord) {
        throw new Error("No records found in Zetkin");
      }

      const tagName = `Mapped: removable tag ${Date.now()}`;

      // Add first, then remove
      await adaptor.tagRecords([
        {
          externalId: firstRecord.externalId,
          json: firstRecord.json,
          tag: { name: tagName, present: true },
        },
      ]);

      await adaptor.tagRecords([
        {
          externalId: firstRecord.externalId,
          json: firstRecord.json,
          tag: { name: tagName, present: false },
        },
      ]);
    });

    test("deleteColumn deletes an enrichment field", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      const fieldName = `${ENRICHMENT_COLUMN_PREFIX}delete-test-${Date.now()}`;

      // Create the field first via updateRecords
      const firstRecord = await adaptor.fetchFirst();
      if (!firstRecord) {
        throw new Error("No records found in Zetkin");
      }
      await adaptor.updateRecords([
        {
          externalRecord: firstRecord,
          columns: [
            {
              def: { name: fieldName, type: ColumnType.String },
              value: "to-be-deleted",
            },
          ],
        },
      ]);

      // Delete it
      await adaptor.deleteColumn(fieldName);

      // Field should no longer appear on fetched records
      const [refetched] = await adaptor.fetchByExternalId([
        firstRecord.externalId,
      ]);
      expect(refetched.json[fieldName]).toBeUndefined();
    });

    test("deleteColumn is a no-op when field does not exist in Zetkin", async () => {
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        zetkin.oAuthCredentials,
      );

      // Should not throw for a non-existent enrichment field
      await expect(
        adaptor.deleteColumn(`${ENRICHMENT_COLUMN_PREFIX}nonexistent-field`),
      ).resolves.toBeUndefined();
    });

    test("refreshAccessToken acquires new access_token and refresh_token", async () => {
      const expiredCredentials = {
        ...zetkin.oAuthCredentials,
        expiry_date: Date.now() - 1,
      };
      const adaptor = new ZetkinAdaptor(
        "test-data-source-id",
        zetkin.orgId,
        expiredCredentials,
      );

      await adaptor.fetchFirst();

      const refreshed = adaptor.credentials;
      expect(refreshed.access_token).not.toBe(expiredCredentials.access_token);
      expect(refreshed.refresh_token).toBeDefined();
      expect(refreshed.refresh_token).not.toBe(
        expiredCredentials.refresh_token,
      );

      testCredentials.zetkin = {
        orgId: zetkin.orgId,
        oAuthCredentials: refreshed,
      };
      fs.writeFileSync(
        credentialsPath,
        JSON.stringify(testCredentials, null, 2),
      );
    });
  },
  60000,
);
