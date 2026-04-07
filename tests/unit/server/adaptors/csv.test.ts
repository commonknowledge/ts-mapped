import { expect, test } from "vitest";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { CSVAdaptor, decodeBuffer } from "@/server/adaptors/csv";

// £ in UTF-8 is C2 A3; in Latin-1 it is A3
const POUND_UTF8 = Buffer.from([0xc2, 0xa3]);
const POUND_LATIN1 = Buffer.from([0xa3]);

test("decodeBuffer passes through plain UTF-8 unchanged", () => {
  const input = Buffer.from("hello £", "utf8");
  const result = decodeBuffer(input);
  expect(result.toString("utf8")).toBe("hello £");
});

test("decodeBuffer strips UTF-8 BOM", () => {
  const bom = Buffer.from([0xef, 0xbb, 0xbf]);
  const input = Buffer.concat([bom, Buffer.from("col1,col2", "utf8")]);
  const result = decodeBuffer(input);
  expect(result.toString("utf8")).toBe("col1,col2");
});

test("decodeBuffer transcodes Latin-1 to UTF-8", () => {
  const input = Buffer.concat([
    Buffer.from("price,"),
    POUND_LATIN1,
    Buffer.from("10"),
  ]);
  const result = decodeBuffer(input);
  expect(result.toString("utf8")).toBe("price,£10");
  expect(result).toEqual(
    Buffer.concat([Buffer.from("price,"), POUND_UTF8, Buffer.from("10")]),
  );
});

test("decodeBuffer transcodes UTF-16 LE (with BOM) to UTF-8", () => {
  const bom = Buffer.from([0xff, 0xfe]);
  // "hi" in UTF-16 LE: h=68 00, i=69 00
  const utf16le = Buffer.from([0x68, 0x00, 0x69, 0x00]);
  const result = decodeBuffer(Buffer.concat([bom, utf16le]));
  expect(result.toString("utf8")).toBe("hi");
});

test("decodeBuffer transcodes UTF-16 BE (with BOM) to UTF-8", () => {
  const bom = Buffer.from([0xfe, 0xff]);
  // "hi" in UTF-16 BE: h=00 68, i=00 69
  const utf16be = Buffer.from([0x00, 0x68, 0x00, 0x69]);
  const result = decodeBuffer(Buffer.concat([bom, utf16be]));
  expect(result.toString("utf8")).toBe("hi");
});

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
