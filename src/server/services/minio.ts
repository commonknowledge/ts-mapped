import * as Minio from "minio";
import logger from "./logger";

const getClient = () => {
  return new Minio.Client({
    endPoint: process.env.MINIO_DOMAIN || "",
    port: 443,
    useSSL: true,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
};

export const uploadFile = async (
  filename: string,
  buffer: Buffer,
): Promise<string> => {
  try {
    await getClient().putObject("ts-mapped", filename, buffer);
    const url = new URL(
      `ts-mapped/${filename}`,
      `https://${process.env.MINIO_DOMAIN}`,
    ).toString();
    logger.info(`Uploaded file ${filename}: ${url}`);
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

    await getClient().removeObject("ts-mapped", objectName);
    logger.info(`Deleted file ${objectName} from bucket ts-mapped`);
  } catch (error) {
    logger.error(`Could not delete file from MinIO ${url}`, { error });
    throw error;
  }
};
