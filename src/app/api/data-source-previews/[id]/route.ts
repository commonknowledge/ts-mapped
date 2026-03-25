import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { ADMIN_USER_EMAIL, MAX_FILE_SIZE } from "@/constants";
import { getBaseDir } from "@/server/utils";
import type { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  args: { params: Promise<{ id: string }> },
) {
  const { currentUser } = await getServerSession();
  if (!currentUser || currentUser.email !== ADMIN_USER_EMAIL) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await args.params;
  if (!id) return new NextResponse("Bad Request", { status: 400 });

  const data = await request.formData();
  const file: unknown = data.get("file");
  if (!(file instanceof File)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return new NextResponse("File too large", { status: 413 });
  }

  // Keep it simple/deterministic for the modal: `{id}.jpg` or `{id}.png`
  const extension =
    file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "";
  if (!extension) {
    return new NextResponse("Only JPEG or PNG images are supported", {
      status: 415,
    });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = join(getBaseDir(), "public", "data-source-previews");
  await mkdir(dir, { recursive: true });

  const filePath = join(dir, `${id}.${extension}`);
  await writeFile(filePath, buffer);

  return NextResponse.json({
    url: `/data-source-previews/${id}.${extension}`,
  });
}
