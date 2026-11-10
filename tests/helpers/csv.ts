import * as fs from "fs/promises";
import { join } from "path";
import { DataSourceType } from "@/models/DataSource";
import { createCsvFileKey, uploadPrivateFile } from "@/server/services/minio";
import { getBaseDir } from "@/server/utils";
import type { CSVConfig } from "@/models/DataSource";

/**
 * Stores a CSV from tests/resources in private storage, as the upload route
 * would, and returns a data source config that points at it. Each call
 * stores a new copy, so configs are unique within an organisation.
 */
export const storeTestCsv = async ({
  fixture,
  organisationId,
}: {
  fixture: string;
  organisationId: string;
}) => {
  const buffer = await fs.readFile(
    join(getBaseDir(), "tests", "resources", fixture),
  );
  const fileKey = createCsvFileKey(organisationId);
  await uploadPrivateFile(fileKey, buffer);
  const config: CSVConfig = { type: DataSourceType.CSV, fileKey };
  return config;
};
