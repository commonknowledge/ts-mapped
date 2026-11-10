import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { MAX_FILE_SIZE } from "@/constants";
import { findOrganisationForUser } from "@/server/repositories/Organisation";
import logger from "@/server/services/logger";
import { createCsvFileKey, uploadPrivateFile } from "@/server/services/minio";
import type { CSVUploadResponseBody } from "@/types";
import type { NextRequest } from "next/server";

/**
 * Stores a CSV in private storage for a new data source. The file is only
 * ever read back by the server, so no URL is returned: just the key to put in
 * the data source config. The key starts with the organisation ID, and the
 * data source create procedure checks it matches.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<CSVUploadResponseBody>> {
  const { currentUser } = await getServerSession();
  if (!currentUser) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const data = await request.formData();
  const file: unknown = data.get("file");
  const organisationId: unknown = data.get("organisationId");
  if (!(file instanceof File) || typeof organisationId !== "string") {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const organisation = await findOrganisationForUser(
    organisationId,
    currentUser.id,
  );
  if (!organisation) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return new NextResponse("File too large", { status: 413 });
  }

  const fileKey = createCsvFileKey(organisation.id);
  try {
    await uploadPrivateFile(fileKey, Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    logger.error("Could not store uploaded CSV", { error });
    return new NextResponse("Upload failed", { status: 500 });
  }

  return NextResponse.json({ fileKey });
}
