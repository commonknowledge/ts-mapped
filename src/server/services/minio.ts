import { randomBytes } from "crypto";
import * as fs from "fs/promises";
import { dirname, join } from "path";
import * as Minio from "minio";
import { LOCAL_MINIO_HOSTS } from "@/constants";
import { CSV_FILE_KEY_REGEX } from "@/models/DataSource";
import { getBaseDir } from "@/server/utils";
import logger from "./logger";

// Images (map thumbnails, avatars, screenshots) that are shown publicly
export const PUBLIC_BUCKET = "ts-mapped";

// Files that must never be publicly readable, such as uploaded CSVs
export const getPrivateBucket = () =>
  process.env.MINIO_PRIVATE_BUCKET || "ts-mapped-private";

// Used for private files when MinIO is not configured (local development and
// tests). Kept outside uploads/ so the local file route can never serve it.
export const LOCAL_PRIVATE_DIR = "private-uploads";

export const isMinioConfigured = () => Boolean(process.env.MINIO_DOMAIN);

export const isLocalMinio = () =>
  LOCAL_MINIO_HOSTS.includes(process.env.MINIO_DOMAIN || "");

/**
 * Refuses to run a command that changes stored files against a MinIO that
 * isn't on this machine, unless it is running on Render (which always sets
 * RENDER=true). Stops a local run whose .env points at the production MinIO
 * from copying or deleting files there.
 */
export const assertMinioIsLocalOrOnRender = (action: string) => {
  const isOnRender = process.env.RENDER === "true";
  if (!isMinioConfigured() || isLocalMinio() || isOnRender) {
    return;
  }
  throw new Error(
    `Refusing to ${action}: MINIO_DOMAIN is ${process.env.MINIO_DOMAIN}, which is not a local MinIO, and this is not running on Render. Point the MINIO_ variables in .env at a local MinIO (docker compose --profile minio up -d).`,
  );
};

const getMinioPort = () => Number(process.env.MINIO_PORT) || 443;

const getMinioUseSSL = () => process.env.MINIO_USE_SSL !== "false";

export const getMinioOrigin = () => {
  const protocol = getMinioUseSSL() ? "https" : "http";
  const port = getMinioPort();
  const defaultPort = getMinioUseSSL() ? 443 : 80;
  const portSuffix = port === defaultPort ? "" : `:${port}`;
  return `${protocol}://${process.env.MINIO_DOMAIN}${portSuffix}`;
};

export const getClient = () => {
  return new Minio.Client({
    endPoint: process.env.MINIO_DOMAIN || "",
    port: getMinioPort(),
    useSSL: getMinioUseSSL(),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
};

export const uploadFile = async (
  filename: string,
  buffer: Buffer,
): Promise<string> => {
  try {
    await getClient().putObject(PUBLIC_BUCKET, filename, buffer);
    const url = new URL(
      `${PUBLIC_BUCKET}/${filename}`,
      getMinioOrigin(),
    ).toString();
    logger.info(`Uploaded file to MinIO ${filename}: ${url}`);
    return url;
  } catch (error) {
    logger.error(`Could not upload file to MinIO ${filename}`, { error });
    throw error;
  }
};

export const deleteFile = async (url: string): Promise<void> => {
  try {
    const minioUrl = process.env.MINIO_URL || "";
    const parsedUrl = new URL(url);

    // Ensure the URL belongs to your Minio endpoint
    if (!parsedUrl.origin.includes(minioUrl)) {
      throw new Error(`Invalid URL: ${url} does not match expected Minio URL`);
    }

    // Extract the object name from the pathname (remove leading /ts-mapped/)
    const objectName = decodeURIComponent(
      parsedUrl.pathname.replace(/^\/+ts\-mapped\/+/, ""),
    );

    await getClient().removeObject(PUBLIC_BUCKET, objectName);
    logger.info(`Deleted file ${objectName} from bucket ${PUBLIC_BUCKET}`);
  } catch (error) {
    logger.error(`Could not delete file from MinIO ${url}`, { error });
    throw error;
  }
};

/**
 * Private storage for uploaded CSVs. Files are only ever read by the server
 * with MinIO credentials, so they are never reachable by URL.
 *
 * Every key is checked against CSV_FILE_KEY_REGEX before touching storage,
 * so a key can't point outside it (e.g. with `..`).
 */
const assertValidKey = (key: string) => {
  if (!CSV_FILE_KEY_REGEX.test(key)) {
    throw new Error(`Invalid file key: ${key}`);
  }
};

export const createCsvFileKey = (organisationId: string) =>
  `${organisationId}/${randomBytes(16).toString("hex")}.csv`;

const isSampleKey = (key: string) => key.startsWith("sample/");

const getSampleFilePath = (key: string) =>
  join(getBaseDir(), "resources", "dataSets", key.replace(/^sample\//, ""));

const getLocalPrivatePath = (key: string) =>
  join(getBaseDir(), LOCAL_PRIVATE_DIR, key);

const assertMinioAllowedToBeMissing = () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("MinIO must be configured to store private files");
  }
};

export const uploadPrivateFile = async (
  key: string,
  buffer: Buffer,
): Promise<void> => {
  assertValidKey(key);
  if (isSampleKey(key)) {
    throw new Error(`Cannot overwrite sample file ${key}`);
  }
  if (!isMinioConfigured()) {
    assertMinioAllowedToBeMissing();
    const path = getLocalPrivatePath(key);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, buffer);
    return;
  }
  await getClient().putObject(getPrivateBucket(), key, buffer);
  logger.info(`Uploaded private file ${key}`);
};

const streamToBuffer = async (
  stream: AsyncIterable<Buffer | string>,
): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

export const readPrivateFile = async (key: string): Promise<Buffer> => {
  assertValidKey(key);
  if (isSampleKey(key)) {
    return fs.readFile(getSampleFilePath(key));
  }
  if (!isMinioConfigured()) {
    assertMinioAllowedToBeMissing();
    return fs.readFile(getLocalPrivatePath(key));
  }
  const stream = await getClient().getObject(getPrivateBucket(), key);
  return streamToBuffer(stream);
};

export const deletePrivateFile = async (key: string): Promise<void> => {
  assertValidKey(key);
  if (isSampleKey(key)) {
    // Sample files ship with the app and are shared by every organisation
    return;
  }
  if (!isMinioConfigured()) {
    assertMinioAllowedToBeMissing();
    await fs.rm(getLocalPrivatePath(key), { force: true });
    return;
  }
  await getClient().removeObject(getPrivateBucket(), key);
  logger.info(`Deleted private file ${key}`);
};

/**
 * Gives an organisation its own copy of a CSV, e.g. when copying a map's
 * data sources to another organisation. Sample files are shared, so they
 * keep their key.
 */
export const copyCsvFileToOrganisation = async ({
  fileKey,
  organisationId,
}: {
  fileKey: string;
  organisationId: string;
}): Promise<string> => {
  if (isSampleKey(fileKey)) {
    return fileKey;
  }
  const newKey = createCsvFileKey(organisationId);
  await uploadPrivateFile(newKey, await readPrivateFile(fileKey));
  return newKey;
};

export const privateFileExists = async (key: string): Promise<boolean> => {
  assertValidKey(key);
  if (isSampleKey(key)) {
    return fs.access(getSampleFilePath(key)).then(
      () => true,
      () => false,
    );
  }
  if (!isMinioConfigured()) {
    return fs.access(getLocalPrivatePath(key)).then(
      () => true,
      () => false,
    );
  }
  try {
    await getClient().statObject(getPrivateBucket(), key);
    return true;
  } catch {
    return false;
  }
};

export const listPublicObjectNames = async (): Promise<string[]> => {
  const names: string[] = [];
  const stream = getClient().listObjects(PUBLIC_BUCKET, "", true);
  for await (const item of stream) {
    if (item.name) {
      names.push(item.name);
    }
  }
  return names;
};

export const deletePublicObject = async (name: string): Promise<void> => {
  await getClient().removeObject(PUBLIC_BUCKET, name);
  logger.info(`Deleted ${name} from bucket ${PUBLIC_BUCKET}`);
};
