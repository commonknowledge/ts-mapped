import { expect, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import { createDataSource } from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { createCsvFileKey } from "@/server/services/minio";
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
      fileKey: createCsvFileKey(org.id),
    },
    columnDefs: [],
    columnMetadata: [],
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
    fileKey:
      dataSource.config.type === DataSourceType.CSV
        ? dataSource.config.fileKey
        : null,
  });
});
