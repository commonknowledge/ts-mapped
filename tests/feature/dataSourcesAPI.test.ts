import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { beforeAll, describe, expect, it } from "vitest";
import { GET } from "@/app/api/rest/data-sources/route";
import {
  ColumnType,
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import { createDataSource } from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertUser } from "@/server/repositories/User";
import { db } from "@/server/services/database";

describe("Data sources REST API", () => {
  const testPassword = "testPassword123";
  let testUser: Awaited<ReturnType<typeof upsertUser>>;
  let organisationOne: Awaited<ReturnType<typeof upsertOrganisation>>;
  let organisationTwo: Awaited<ReturnType<typeof upsertOrganisation>>;
  let organisationThree: Awaited<ReturnType<typeof upsertOrganisation>>;
  let dataSourceOne: Awaited<ReturnType<typeof createDataSource>>;
  let dataSourceTwo: Awaited<ReturnType<typeof createDataSource>>;
  let dataSourceThree: Awaited<ReturnType<typeof createDataSource>>;

  beforeAll(async () => {
    testUser = await upsertUser({
      email: `test-data-sources-${uuidv4()}@example.com`,
      password: testPassword,
      name: "Test User",
      avatarUrl: null,
    });

    organisationOne = await upsertOrganisation({
      name: `Test Organisation One ${uuidv4()}`,
    });
    organisationTwo = await upsertOrganisation({
      name: `Test Organisation Two ${uuidv4()}`,
    });
    organisationThree = await upsertOrganisation({
      name: `Test Organisation Three ${uuidv4()}`,
    });

    await db
      .insertInto("organisationUser")
      .values([
        { organisationId: organisationOne.id, userId: testUser.id },
        { organisationId: organisationTwo.id, userId: testUser.id },
      ])
      .execute();

    dataSourceOne = await createDataSource({
      name: `Org1 Data Source ${uuidv4()}`,
      recordType: DataSourceRecordType.Locations,
      autoEnrich: false,
      autoImport: false,
      public: false,
      config: { type: DataSourceType.CSV, url: "https://example.com/org1.csv" },
      columnDefs: [{ name: "name", type: ColumnType.String }],
      columnMetadata: [],
      columnRoles: { nameColumns: ["name"] },
      geocodingConfig: { type: GeocodingType.None },
      enrichments: [],
      organisationId: organisationOne.id,
    });

    dataSourceTwo = await createDataSource({
      name: `Org2 Data Source ${uuidv4()}`,
      recordType: DataSourceRecordType.Locations,
      autoEnrich: false,
      autoImport: false,
      public: false,
      config: { type: DataSourceType.CSV, url: "https://example.com/org2.csv" },
      columnDefs: [{ name: "name", type: ColumnType.String }],
      columnMetadata: [],
      columnRoles: { nameColumns: ["name"] },
      geocodingConfig: { type: GeocodingType.None },
      enrichments: [],
      organisationId: organisationTwo.id,
    });

    dataSourceThree = await createDataSource({
      name: `Org3 Data Source ${uuidv4()}`,
      recordType: DataSourceRecordType.Locations,
      autoEnrich: false,
      autoImport: false,
      public: false,
      config: { type: DataSourceType.CSV, url: "https://example.com/org3.csv" },
      columnDefs: [{ name: "name", type: ColumnType.String }],
      columnMetadata: [],
      columnRoles: { nameColumns: ["name"] },
      geocodingConfig: { type: GeocodingType.None },
      enrichments: [],
      organisationId: organisationThree.id,
    });
  });

  it("should return 401 without authentication", async () => {
    const response = await GET(createNextRequest({ url: endpointUrl() }));
    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid credentials", async () => {
    const response = await GET(
      createNextRequest({
        url: endpointUrl(),
        credentials: { email: testUser.email, password: "wrong-password" },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return readable data sources across all user organisations", async () => {
    const response = await GET(
      createNextRequest({
        url: endpointUrl(),
        credentials: { email: testUser.email, password: testPassword },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      id: string;
      name: string;
      organisation: { id: string; name: string };
    }[];

    expect(body).toEqual(
      expect.arrayContaining([
        {
          id: dataSourceOne.id,
          name: dataSourceOne.name,
          organisation: {
            id: organisationOne.id,
            name: organisationOne.name,
          },
        },
        {
          id: dataSourceTwo.id,
          name: dataSourceTwo.name,
          organisation: {
            id: organisationTwo.id,
            name: organisationTwo.name,
          },
        },
      ]),
    );
    expect(body.find((item) => item.id === dataSourceThree.id)).toBeUndefined();
  });
});

const endpointUrl = () => "http://localhost:3000/api/rest/data-sources";

const createNextRequest = ({
  url,
  credentials,
}: {
  url: string;
  credentials?: { email: string; password: string } | null | undefined;
}) => {
  const authorization = credentials
    ? Buffer.from(`${credentials.email}:${credentials.password}`).toString(
        "base64",
      )
    : "";
  return new NextRequest(url, {
    headers: authorization ? { Authorization: `Basic ${authorization}` } : {},
  });
};
