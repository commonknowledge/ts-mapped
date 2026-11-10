import * as fs from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  LOCAL_PRIVATE_DIR,
  assertMinioIsLocalOrOnRender,
  copyCsvFileToOrganisation,
  createCsvFileKey,
  deletePrivateFile,
  privateFileExists,
  readPrivateFile,
  uploadPrivateFile,
} from "@/server/services/minio";
import { getBaseDir } from "@/server/utils";

// Tests that check the local folder fallback turn MinIO off, so they also
// pass when the tests are run against a local MinIO

describe("private CSV storage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("stores, reads and deletes a file by key", async () => {
    vi.stubEnv("MINIO_DOMAIN", "");
    const key = createCsvFileKey(uuidv4());
    await uploadPrivateFile(key, Buffer.from("a,b\n1,2\n"));

    expect(await privateFileExists(key)).toBe(true);
    expect((await readPrivateFile(key)).toString()).toBe("a,b\n1,2\n");
    // Kept out of uploads/, which the local file route serves
    await expect(
      fs.access(join(getBaseDir(), LOCAL_PRIVATE_DIR, key)),
    ).resolves.toBeUndefined();

    await deletePrivateFile(key);
    expect(await privateFileExists(key)).toBe(false);
  });

  test("keys are scoped to the organisation and unguessable", () => {
    const organisationId = uuidv4();
    const key = createCsvFileKey(organisationId);
    expect(key).toMatch(new RegExp(`^${organisationId}/[0-9a-f]{32}\\.csv$`));
    expect(createCsvFileKey(organisationId)).not.toBe(key);
  });

  test.each([
    "../.env",
    "../../etc/passwd",
    "file://.env",
    "/etc/passwd",
    "sample/../../.env",
    "sample/other.csv",
    "https://example.com/members.csv",
    `${uuidv4()}/../../../.env`,
    `${uuidv4()}/not-hex.csv`,
  ])("refuses to read the key %s", async (key) => {
    await expect(readPrivateFile(key)).rejects.toThrow("Invalid file key");
    await expect(uploadPrivateFile(key, Buffer.from(""))).rejects.toThrow(
      "Invalid file key",
    );
    await expect(deletePrivateFile(key)).rejects.toThrow("Invalid file key");
  });

  test("reads sample files that ship with the app", async () => {
    const buffer = await readPrivateFile("sample/sampleMembers.csv");
    expect(buffer.toString()).toMatch(/^Postcode,Country,First name/);
  });

  test("never overwrites or deletes sample files", async () => {
    await expect(
      uploadPrivateFile("sample/sampleMembers.csv", Buffer.from("x")),
    ).rejects.toThrow("Cannot overwrite sample file");

    await deletePrivateFile("sample/sampleMembers.csv");
    expect(await privateFileExists("sample/sampleMembers.csv")).toBe(true);
  });

  test("copies a file to another organisation under a new key", async () => {
    const key = createCsvFileKey(uuidv4());
    await uploadPrivateFile(key, Buffer.from("x,y\n"));
    const targetOrganisationId = uuidv4();

    const newKey = await copyCsvFileToOrganisation({
      fileKey: key,
      organisationId: targetOrganisationId,
    });

    expect(newKey).not.toBe(key);
    expect(newKey.startsWith(`${targetOrganisationId}/`)).toBe(true);
    expect((await readPrivateFile(newKey)).toString()).toBe("x,y\n");

    // Deleting one copy leaves the other
    await deletePrivateFile(key);
    expect(await privateFileExists(newKey)).toBe(true);
    await deletePrivateFile(newKey);
  });

  test("sample files are shared, not copied", async () => {
    expect(
      await copyCsvFileToOrganisation({
        fileKey: "sample/ge2024.csv",
        organisationId: uuidv4(),
      }),
    ).toBe("sample/ge2024.csv");
  });

  test("refuses to fall back to local disk in production", async () => {
    vi.stubEnv("MINIO_DOMAIN", "");
    vi.stubEnv("NODE_ENV", "production");
    const key = createCsvFileKey(uuidv4());
    await expect(uploadPrivateFile(key, Buffer.from("x"))).rejects.toThrow(
      "MinIO must be configured",
    );
    await expect(readPrivateFile(key)).rejects.toThrow(
      "MinIO must be configured",
    );
  });
});

describe("assertMinioIsLocalOrOnRender", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("refuses a remote MinIO when not on Render", () => {
    vi.stubEnv("MINIO_DOMAIN", "minio.example.com");
    vi.stubEnv("RENDER", "");
    expect(() => assertMinioIsLocalOrOnRender("test")).toThrow(
      "Refusing to test",
    );
  });

  test("allows a remote MinIO on Render", () => {
    vi.stubEnv("MINIO_DOMAIN", "minio.example.com");
    vi.stubEnv("RENDER", "true");
    expect(() => assertMinioIsLocalOrOnRender("test")).not.toThrow();
  });

  test.each(["localhost", "127.0.0.1", ""])(
    "allows MINIO_DOMAIN=%s anywhere",
    (domain) => {
      vi.stubEnv("MINIO_DOMAIN", domain);
      vi.stubEnv("RENDER", "");
      expect(() => assertMinioIsLocalOrOnRender("test")).not.toThrow();
    },
  );
});
