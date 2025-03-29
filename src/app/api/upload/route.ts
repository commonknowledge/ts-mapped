import { writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filenameParts = file.name.split(".");
  const extension = filenameParts.pop();
  const filename = `${filenameParts.join(".")}_${new Date().getTime()}.${extension}`;
  const filePath = join(getBaseDir(), "resources", "dataSets", filename);

  await writeFile(filePath, buffer);

  return NextResponse.json({ filename: filename });
}
