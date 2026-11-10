import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { MAX_FILE_SIZE } from "@/constants";
import logger from "@/server/services/logger";
import { isMinioConfigured, uploadFile } from "@/server/services/minio";
import { getBaseDir } from "@/server/utils";
import type { UploadResponseBody } from "@/types";
import type { NextRequest } from "next/server";

/**
 * Uploads a publicly readable image (map thumbnails, avatars, screenshots).
 * Anyone with the returned URL can read the file, so only images are
 * accepted here. CSVs go through /api/csv-upload into private storage.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<UploadResponseBody>> {
  const { currentUser } = await getServerSession();
  if (!currentUser) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const data = await request.formData();
  const file: unknown = data.get("file");
  if (!(file instanceof File)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return new NextResponse("Only images can be uploaded", { status: 415 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return new NextResponse("File too large", { status: 413 });
  }

  const filenameParts = file.name.split(".");
  const extension = filenameParts.pop();
  const randomString = randomBytes(8).toString("hex"); // Add random string to prevent attackers guessing files
  const filename = `${filenameParts.join(".")}_${new Date().getTime()}_${randomString}.${extension}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (isMinioConfigured()) {
    try {
      const url = await uploadFile(filename, buffer);
      return NextResponse.json({ url });
    } catch (error) {
      logger.error(`Could not upload file ${filename}`, { error });
      return new NextResponse("Upload failed", { status: 500 });
    }
  }

  // Local development without MinIO: serve the file from the uploads folder
  if (process.env.NODE_ENV === "production") {
    logger.error("MinIO is not configured, refusing to store upload on disk");
    return new NextResponse("Upload failed", { status: 500 });
  }
  const uploadsDir = join(getBaseDir(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(join(uploadsDir, filename), buffer);
  return NextResponse.json({ url: `/api/upload/${filename}` });
}
