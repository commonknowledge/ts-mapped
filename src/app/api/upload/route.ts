import { randomBytes } from "crypto";
import { writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import logger from "@/server/services/logger";
import { uploadFile } from "@/server/services/minio";
import { getBaseDir } from "@/server/utils";
import { UploadResponseBody } from "@/types";

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

  const filenameParts = file.name.split(".");
  const extension = filenameParts.pop();
  const randomString = randomBytes(8).toString("hex"); // Add random string to prevent attackers guessing files
  const filename = `${filenameParts.join(".")}_${new Date().getTime()}_${randomString}.${extension}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filePath = join(getBaseDir(), "uploads", filename);

  await writeFile(filePath, buffer);

  // Backup URL in case MinIO is not set up (e.g. in local development)
  let url = `/api/upload/${filename}`;

  try {
    url = await uploadFile(filename, buffer);
    logger.info(`Uploaded file ${filename}: ${url}`);
  } catch (error) {
    logger.error(`Could not upload file ${filename}`, { error });
  }

  return NextResponse.json({ url });
}
