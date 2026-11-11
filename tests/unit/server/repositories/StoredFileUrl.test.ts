import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import rewriteStoredFileUrls from "@/server/commands/rewriteStoredFileUrls";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { createMap, deleteMap } from "@/server/repositories/Map";
import {
  deleteOrganisation,
  upsertOrganisation,
} from "@/server/repositories/Organisation";
import { replaceStoredFileOrigin } from "@/server/repositories/StoredFileUrl";
import { db } from "@/server/services/database";
import { createCsvFileKey } from "@/server/services/minio";

const cleanups: (() => Promise<unknown>)[] = [];

afterAll(async () => {
  for (const cleanup of cleanups.reverse()) {
    await cleanup();
  }
});

// Unique origins, so rows left by other tests never match
const makeOrigins = () => {
  const id = uuidv4();
  return {
    from: `https://old-${id}.example.com`,
    to: `https://new-${id}.example.com`,
  };
};

const setUp = async (from: string) => {
  const organisation = await upsertOrganisation({
    name: `Stored file URL org ${uuidv4()}`,
  });
  cleanups.push(() => deleteOrganisation(organisation.id));
  await db
    .updateTable("organisation")
    .set({ avatarUrl: `${from}/ts-mapped/avatar%20one.png` })
    .where("id", "=", organisation.id)
    .execute();

  const map = await createMap(organisation.id, "Stored file URL map");
  cleanups.push(() => deleteMap(map.id));
  await db
    .updateTable("map")
    .set({ imageUrl: `${from}/ts-mapped/thumb.png` })
    .where("id", "=", map.id)
    .execute();

  // Mentions the old origin, but isn't a URL on it: never changed
  const otherMap = await createMap(organisation.id, "Other map");
  cleanups.push(() => deleteMap(otherMap.id));
  await db
    .updateTable("map")
    .set({ imageUrl: `https://elsewhere.example.com/?ref=${from}/x.png` })
    .where("id", "=", otherMap.id)
    .execute();

  const dataSource = await createDataSource({
    name: "Stored file URL data source",
    organisationId: organisation.id,
    autoEnrich: false,
    autoImport: false,
    config: {
      type: DataSourceType.CSV,
      fileKey: createCsvFileKey(organisation.id),
    },
    columnDefs: [],
    columnMetadata: [],
    columnRoles: { nameColumns: [] },
    enrichments: [],
    geocodingConfig: { type: GeocodingType.None },
    public: false,
    recordType: DataSourceRecordType.Data,
  });
  cleanups.push(() => deleteDataSource(dataSource.id));
  await db
    .updateTable("dataSource")
    .set({
      defaultInspectorConfig: {
        items: [],
        screenshotUrl: `${from}/ts-mapped/screenshot.png`,
      },
    })
    .where("id", "=", dataSource.id)
    .execute();

  return { organisation, map, otherMap, dataSource };
};

const findValues = async (ids: {
  organisationId: string;
  mapId: string;
  otherMapId: string;
  dataSourceId: string;
}) => {
  const organisation = await db
    .selectFrom("organisation")
    .select("avatarUrl")
    .where("id", "=", ids.organisationId)
    .executeTakeFirstOrThrow();
  const map = await db
    .selectFrom("map")
    .select("imageUrl")
    .where("id", "=", ids.mapId)
    .executeTakeFirstOrThrow();
  const otherMap = await db
    .selectFrom("map")
    .select("imageUrl")
    .where("id", "=", ids.otherMapId)
    .executeTakeFirstOrThrow();
  const dataSource = await db
    .selectFrom("dataSource")
    .select("defaultInspectorConfig")
    .where("id", "=", ids.dataSourceId)
    .executeTakeFirstOrThrow();
  return {
    avatarUrl: organisation.avatarUrl,
    imageUrl: map.imageUrl,
    otherImageUrl: otherMap.imageUrl,
    screenshotUrl: dataSource.defaultInspectorConfig?.screenshotUrl,
  };
};

describe("replaceStoredFileOrigin", () => {
  test("counts without changing, then rewrites, then has nothing left", async () => {
    const { from, to } = makeOrigins();
    const { organisation, map, otherMap, dataSource } = await setUp(from);
    const ids = {
      organisationId: organisation.id,
      mapId: map.id,
      otherMapId: otherMap.id,
      dataSourceId: dataSource.id,
    };
    const before = await findValues(ids);

    const dryRun = await replaceStoredFileOrigin({ from, to, confirm: false });
    const countOf = (
      counts: typeof dryRun,
      column: (typeof dryRun)[number]["column"],
    ) => counts.find((c) => c.column === column)?.count;
    expect(countOf(dryRun, "map.imageUrl")).toBe(1);
    expect(countOf(dryRun, "organisation.avatarUrl")).toBe(1);
    expect(countOf(dryRun, "dataSource.defaultInspectorConfig")).toBe(1);
    expect(await findValues(ids)).toEqual(before);

    await replaceStoredFileOrigin({ from, to, confirm: true });
    expect(await findValues(ids)).toEqual({
      avatarUrl: `${to}/ts-mapped/avatar%20one.png`,
      imageUrl: `${to}/ts-mapped/thumb.png`,
      otherImageUrl: before.otherImageUrl,
      screenshotUrl: `${to}/ts-mapped/screenshot.png`,
    });

    // Safe to run again
    const again = await replaceStoredFileOrigin({ from, to, confirm: false });
    for (const { count } of again) {
      expect(count).toBe(0);
    }
  });
});

describe("rewriteStoredFileUrls", () => {
  test.each([
    ["http://old.example.com", "https://new.example.com"],
    ["https://old.example.com/ts-mapped", "https://new.example.com"],
    ["not a url", "https://new.example.com"],
    ["https://same.example.com", "https://same.example.com/"],
  ])("refuses --from %s --to %s", async (from, to) => {
    await expect(
      rewriteStoredFileUrls({ from, to, confirm: true }),
    ).rejects.toThrow();
  });
});
