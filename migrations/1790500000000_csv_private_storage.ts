/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from "crypto";
import * as fs from "fs/promises";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { sql } from "kysely";
import * as Minio from "minio";
import type { Kysely } from "kysely";

/**
 * Moves uploaded CSVs out of the public bucket and into private storage.
 *
 * CSV data source configs used to hold a `url` that the server fetched with
 * no credentials, so uploaded CSVs (often membership lists) were readable by
 * anyone with the link. They now hold a `fileKey` that the server reads from
 * a private bucket with MinIO credentials.
 *
 * For each CSV data source this copies the file into private storage, then
 * rewrites the config. The public copies are NOT deleted here: once the
 * migration is verified, delete them with
 * `npm run cmd -- deleteLegacyPublicCsvs`. The csv_upload_migration table
 * records what was moved, so that command (and `down`) know what to do.
 *
 * Everything this needs is inlined, because migrations must stay frozen in
 * time while app code changes.
 *
 * Before running in production, create the private bucket (see
 * MINIO_PRIVATE_BUCKET, default "ts-mapped-private") with no public access.
 *
 * Outside Render it only copies or deletes files in a local MinIO, so that a
 * local run with .env pointing at the production MinIO can't change files
 * there. A database with no uploaded CSVs (such as a new or test database)
 * migrates anywhere.
 */

const PUBLIC_BUCKET = "ts-mapped";
const SAMPLE_FILE_NAMES = ["sampleMembers.csv", "ge2024.csv"];
const LOCAL_PRIVATE_DIR = "private-uploads";

const getBaseDir = () => dirname(dirname(fileURLToPath(import.meta.url)));

const isMinioConfigured = () => Boolean(process.env.MINIO_DOMAIN);

const LOCAL_MINIO_HOSTS = ["localhost", "127.0.0.1"];

const assertMinioIsLocalOrOnRender = () => {
  const isLocalMinio = LOCAL_MINIO_HOSTS.includes(
    process.env.MINIO_DOMAIN || "",
  );
  // Render sets RENDER=true on every service, including during deploys
  const isOnRender = process.env.RENDER === "true";
  if (!isMinioConfigured() || isLocalMinio || isOnRender) {
    return;
  }
  throw new Error(
    `Refusing to move CSVs: MINIO_DOMAIN is ${process.env.MINIO_DOMAIN}, which is not a local MinIO, and this is not running on Render. Point the MINIO_ variables in .env at a local MinIO (docker compose --profile minio up -d), then run the migration again.`,
  );
};

const getPrivateBucket = () =>
  process.env.MINIO_PRIVATE_BUCKET || "ts-mapped-private";

const getMinioClient = () =>
  new Minio.Client({
    endPoint: process.env.MINIO_DOMAIN || "",
    port: Number(process.env.MINIO_PORT) || 443,
    useSSL: process.env.MINIO_USE_SSL !== "false",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });

const readObject = async (bucket: string, key: string) => {
  const stream = await getMinioClient().getObject(bucket, key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

const writePrivateFile = async (key: string, buffer: Buffer) => {
  if (isMinioConfigured()) {
    await getMinioClient().putObject(getPrivateBucket(), key, buffer);
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("MinIO must be configured to store private files");
  }
  const path = join(getBaseDir(), LOCAL_PRIVATE_DIR, key);
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, buffer);
};

const deletePrivateFile = async (key: string) => {
  if (isMinioConfigured()) {
    await getMinioClient().removeObject(getPrivateBucket(), key);
    return;
  }
  await fs.rm(join(getBaseDir(), LOCAL_PRIVATE_DIR, key), { force: true });
};

type LegacySource =
  | { kind: "sample"; fileKey: string }
  | { kind: "public"; object: string }
  | { kind: "local"; filename: string };

/**
 * Works out where a legacy CSV URL's file lives, or returns null if it isn't
 * a URL the app could have created (those need a human to look at them).
 */
const resolveLegacyUrl = (url: string): LegacySource | null => {
  if (url.startsWith("file://")) {
    const path = url.replace(/^file:\/\//, "").split("?")[0];
    const name = basename(path);
    const isSample =
      path === `resources/dataSets/${name}` && SAMPLE_FILE_NAMES.includes(name);
    return isSample ? { kind: "sample", fileKey: `sample/${name}` } : null;
  }

  if (url.startsWith("/api/upload/")) {
    const filename = decodeURIComponent(url.replace(/^\/api\/upload\//, ""));
    const isPlainName =
      basename(filename) === filename && !filename.startsWith(".");
    return isPlainName ? { kind: "local", filename } : null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const isMinioHost = parsed.hostname === process.env.MINIO_DOMAIN;
  const prefix = `/${PUBLIC_BUCKET}/`;
  if (!isMinioHost || !parsed.pathname.startsWith(prefix)) {
    return null;
  }
  const object = decodeURIComponent(parsed.pathname.slice(prefix.length));
  return object ? { kind: "public", object } : null;
};

const readLegacyFile = async (
  source: Exclude<LegacySource, { kind: "sample" }>,
) => {
  if (source.kind === "local") {
    return fs.readFile(join(getBaseDir(), "uploads", source.filename));
  }
  if (!isMinioConfigured()) {
    throw new Error("MinIO is not configured, so public uploads can't be read");
  }
  return readObject(PUBLIC_BUCKET, source.object);
};

export async function up(db: Kysely<any>): Promise<void> {
  const { rows } = await sql<{
    id: string;
    organisationId: string;
    config: { type: string; url: string };
  }>`
    SELECT id, organisation_id, config
    FROM data_source
    WHERE config->>'type' = 'csv' AND config ? 'url'
    ORDER BY created_at
  `.execute(db);

  const resolved = rows.map((row) => ({
    row,
    source: resolveLegacyUrl(row.config.url),
  }));

  const unresolvable = resolved.filter(({ source }) => !source);
  if (unresolvable.length) {
    const list = unresolvable
      .map(({ row }) => `${row.id}: ${row.config.url}`)
      .join("\n");
    throw new Error(
      `Can't move these CSV data sources to private storage, because their URL wasn't created by Mapped. Fix or delete them, then run the migration again:\n${list}`,
    );
  }

  const hasUploads = resolved.some(
    ({ source }) => source && source.kind !== "sample",
  );
  if (hasUploads) {
    assertMinioIsLocalOrOnRender();
  }

  // Every check above runs before anything changes
  await sql`
    CREATE TABLE csv_upload_migration (
      data_source_id uuid PRIMARY KEY,
      legacy_url text NOT NULL,
      legacy_public_object text,
      legacy_local_file text,
      file_key text NOT NULL,
      migrated_at timestamp NOT NULL DEFAULT now(),
      legacy_deleted_at timestamp
    )
  `.execute(db);

  // Copy every file first, so that a failure leaves the database untouched.
  // If anything fails, remove the copies already made so that no stray
  // copies of member data are left behind.
  const copiedKeys: string[] = [];
  const moves: {
    dataSourceId: string;
    url: string;
    fileKey: string;
    publicObject: string | null;
    localFile: string | null;
  }[] = [];
  try {
    for (const { row, source } of resolved) {
      if (!source) continue;
      if (source.kind === "sample") {
        moves.push({
          dataSourceId: row.id,
          url: row.config.url,
          fileKey: source.fileKey,
          publicObject: null,
          localFile: null,
        });
        continue;
      }
      const fileKey = `${row.organisationId}/${randomBytes(16).toString("hex")}.csv`;
      const buffer = await readLegacyFile(source);
      await writePrivateFile(fileKey, buffer);
      copiedKeys.push(fileKey);
      moves.push({
        dataSourceId: row.id,
        url: row.config.url,
        fileKey,
        publicObject: source.kind === "public" ? source.object : null,
        localFile: source.kind === "local" ? source.filename : null,
      });
    }
  } catch (error) {
    for (const key of copiedKeys) {
      await deletePrivateFile(key).catch(() => undefined);
    }
    throw error;
  }

  for (const move of moves) {
    const config = { type: "csv", fileKey: move.fileKey };
    await sql`
      UPDATE data_source
      SET config = ${JSON.stringify(config)}::jsonb
      WHERE id = ${move.dataSourceId}
    `.execute(db);
    await sql`
      INSERT INTO csv_upload_migration
        (data_source_id, legacy_url, legacy_public_object, legacy_local_file, file_key)
      VALUES
        (${move.dataSourceId}, ${move.url}, ${move.publicObject}, ${move.localFile}, ${move.fileKey})
    `.execute(db);
  }
}

/**
 * Puts the legacy URLs back. Only possible until the public copies have been
 * deleted with deleteLegacyPublicCsvs. Data sources deleted since the
 * migration are skipped.
 */
export async function down(db: Kysely<any>): Promise<void> {
  const { rows } = await sql<{
    dataSourceId: string;
    legacyUrl: string;
    fileKey: string;
    legacyDeletedAt: Date | null;
  }>`
    SELECT data_source_id, legacy_url, file_key, legacy_deleted_at
    FROM csv_upload_migration
  `.execute(db);

  if (rows.some((row) => row.legacyDeletedAt)) {
    throw new Error(
      "The public copies of the CSVs have been deleted, so the old URLs no longer work. Restore from a backup instead.",
    );
  }

  const hasUploads = rows.some((row) => !row.fileKey.startsWith("sample/"));
  if (hasUploads) {
    assertMinioIsLocalOrOnRender();
  }

  for (const row of rows) {
    const config = { type: "csv", url: row.legacyUrl };
    await sql`
      UPDATE data_source
      SET config = ${JSON.stringify(config)}::jsonb
      WHERE id = ${row.dataSourceId}
    `.execute(db);
  }

  await sql`DROP TABLE csv_upload_migration`.execute(db);

  // Remove the private copies last, once the database no longer refers to them
  for (const row of rows) {
    if (!row.fileKey.startsWith("sample/")) {
      await deletePrivateFile(row.fileKey);
    }
  }
}
