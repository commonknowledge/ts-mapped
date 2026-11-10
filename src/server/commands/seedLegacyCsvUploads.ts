import { randomBytes } from "crypto";
import * as fs from "fs/promises";
import { join } from "path";
import { AreaSetCode } from "@/models/AreaSet";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import {
  isCsvPrivateStorageMigrationApplied,
  setLegacyCsvUrlForSeed,
} from "@/server/repositories/CsvUploadMigration";
import { createDataSource } from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { findUserByEmail } from "@/server/repositories/User";
import logger from "@/server/services/logger";
import {
  PUBLIC_BUCKET,
  getClient,
  getMinioOrigin,
  isLocalMinio,
  isMinioConfigured,
} from "@/server/services/minio";
import { getBaseDir } from "@/server/utils";

// Same naming as the old upload route, including a space to check that
// URL-encoded object names survive the migration
const legacyFilename = (label: string) =>
  `${label}_${new Date().getTime()}_${randomBytes(8).toString("hex")}.csv`;

const assertLocalOnly = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }
  if (!isMinioConfigured()) {
    throw new Error(
      "Set MINIO_DOMAIN=localhost (and the other MINIO_ variables) to the docker compose MinIO first",
    );
  }
  if (!isLocalMinio()) {
    throw new Error(
      `Refusing to seed: MINIO_DOMAIN is ${process.env.MINIO_DOMAIN}, not a local MinIO`,
    );
  }
  if (await isCsvPrivateStorageMigrationApplied()) {
    throw new Error(
      "The csv_private_storage migration has already run. Roll it back with `npm run kysely migrate:down` first.",
    );
  }
};

/**
 * Local testing only: creates CSV data sources in every shape that existed
 * before the csv_private_storage migration, so the migration can be checked
 * end to end.
 *
 * Creates an organisation (with `email` as a member) and:
 *  1. a data source whose CSV is in the public MinIO bucket
 *  2. a data source whose CSV is in the local uploads/ folder, as when MinIO
 *     failed and the upload route fell back to disk
 *  3. a data source using the sample members file that ships with the app
 *  4. a CSV in the public bucket that no data source uses (an orphan)
 */
const seedLegacyCsvUploads = async ({ email }: { email: string }) => {
  await assertLocalOnly();

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error(`No user with email ${email}`);
  }

  const organisation = await upsertOrganisation({
    name: `Legacy CSV seed ${new Date().toISOString()}`,
  });
  await upsertOrganisationUser({
    organisationId: organisation.id,
    userId: user.id,
  });

  const csv = await fs.readFile(
    join(getBaseDir(), "resources", "dataSets", "sampleMembers.csv"),
  );

  // 1. Public MinIO upload, with the URL the old upload route returned
  const publicName = legacyFilename("seed public members");
  await getClient().putObject(PUBLIC_BUCKET, publicName, csv);
  const publicUrl = new URL(
    `${PUBLIC_BUCKET}/${publicName}`,
    getMinioOrigin(),
  ).toString();

  // 2. Local fallback upload
  const localName = legacyFilename("seed_local_members");
  await fs.mkdir(join(getBaseDir(), "uploads"), { recursive: true });
  await fs.writeFile(join(getBaseDir(), "uploads", localName), csv);
  const localUrl = `/api/upload/${localName}`;

  // 3. Sample file, as ensureOrganisationMap used to create it
  const sampleUrl = `file://resources/dataSets/sampleMembers.csv?orgId=${organisation.id}`;

  // 4. Orphan
  const orphanName = legacyFilename("seed orphan");
  await getClient().putObject(PUBLIC_BUCKET, orphanName, csv);

  const sources = [
    { name: "Seed: public MinIO upload", url: publicUrl },
    { name: "Seed: local fallback upload", url: localUrl },
    { name: "Seed: sample members", url: sampleUrl },
  ];
  for (const source of sources) {
    // Created with a valid config, then given the legacy one
    const dataSource = await createDataSource({
      name: source.name,
      organisationId: organisation.id,
      autoEnrich: false,
      autoImport: false,
      config: { type: DataSourceType.CSV, fileKey: "sample/sampleMembers.csv" },
      columnRoles: { nameColumns: ["First name", "Last name"] },
      enrichments: [],
      geocodingConfig: {
        type: GeocodingType.Code,
        areaSetCode: AreaSetCode.PC,
        column: "Postcode",
      },
      columnDefs: [],
      columnMetadata: [],
      public: false,
      recordType: DataSourceRecordType.Members,
    });
    await setLegacyCsvUrlForSeed({
      dataSourceId: dataSource.id,
      url: source.url,
    });
    logger.info(`Created ${source.name} (${dataSource.id}): ${source.url}`);
  }

  logger.info(`Created orphan public CSV: ${orphanName}`);
  logger.info(
    `Seeded organisation "${organisation.name}" (${organisation.id}) for ${email}`,
  );
  logger.info(
    `Anyone can download this without logging in, until the migration and cleanup have run: ${publicUrl}`,
  );
};

export default seedLegacyCsvUploads;
