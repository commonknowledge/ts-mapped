import { expect, test } from "vitest";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { CSVAdaptor } from "@/server/adaptors/csv";

test("deleteColumn rejects non-enrichment columns", () => {
  const adaptor = new CSVAdaptor("/api/upload/test.csv");

  expect(() => adaptor.deleteColumn("NotPrefixed")).toThrow(
    `Refusing to delete column "NotPrefixed": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
  );
});

test("deleteColumn throws not updatable for enrichment columns", () => {
  const adaptor = new CSVAdaptor("/api/upload/test.csv");

  expect(() => adaptor.deleteColumn("Mapped: SomeField")).toThrow(
    "CSVs are not updatable.",
  );
});
