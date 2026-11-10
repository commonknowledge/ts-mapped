import fs from "fs";
import { basename, join } from "path";
import { NextResponse } from "next/server";
import { getBaseDir } from "@/server/utils";
import type { UploadResponseBody } from "@/types";
import type { NextRequest } from "next/server";

/**
 * Local uploads directory static file server, for development without MinIO.
 * Production always uses MinIO, so this route is disabled there.
 */
export async function GET(
  request: NextRequest,
  args: { params: Promise<{ filename: string }> },
): Promise<NextResponse<UploadResponseBody>> {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Only plain file names: never let the path escape the uploads folder
  const { filename } = await args.params;
  if (basename(filename) !== filename || filename.startsWith(".")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const filePath = join(getBaseDir(), "uploads", filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
  });
}
