import fs from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { getBaseDir } from "@/server/utils";
import { UploadResponseBody } from "@/types";

/**
 * Local uploads directory static file server.
 * In production, MinIO should be used.
 */
export async function GET(
  request: NextRequest,
  args: { params: Promise<{ filename: string }> },
): Promise<NextResponse<UploadResponseBody>> {
  const { filename } = await args.params;
  const filePath = join(getBaseDir(), "uploads", filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
  });
}
