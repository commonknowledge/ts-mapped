import { expect, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import { createDataSource } from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { serverDataSourceSerializer } from "@/utils/superjson";

test("server data source serializer", async () => {
  const org = await upsertOrganisation({ name: "Test Superjson Org" });

  // Use a real data source in the test to be 100% sure
  const dataSource = await createDataSource({
    name: "Test Superjson Source",
    autoEnrich: false,
    autoImport: false,
    recordType: DataSourceRecordType.Data,
    config: {
      type: DataSourceType.CSV,
      url: "https://example.com/superjson.csv",
    },
    columnDefs: [],
    columnRoles: { nameColumns: [] },
    enrichments: [],
    geocodingConfig: {
      type: GeocodingType.None,
    },
    organisationId: org.id,
    public: false,
  });

  expect(dataSource.id).toBeTruthy();

  expect(serverDataSourceSerializer.serialize(dataSource).config).toStrictEqual(
    { type: DataSourceType.CSV },
  );

  expect(
    serverDataSourceSerializer.serialize({
      ...dataSource,
      config: { ...dataSource.config, __SERIALIZE_CREDENTIALS: true },
    }).config,
  ).toStrictEqual({
    type: DataSourceType.CSV,
    url: "https://example.com/superjson.csv",
  });
});
