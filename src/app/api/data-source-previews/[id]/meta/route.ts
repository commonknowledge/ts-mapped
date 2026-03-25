import fs from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { ADMIN_USER_EMAIL } from "@/constants";
import { getBaseDir } from "@/server/utils";
import type { NextRequest } from "next/server";

interface MovementLibraryMeta {
  description?: string;
  defaultVisualisation?: {
    displayMode?: "counts" | "values";
    defaultColumn?: string;
  };
}

function metaPath(id: string) {
  return join(getBaseDir(), "public", "data-source-previews", `${id}.json`);
}

export async function GET(
  _request: NextRequest,
  args: { params: Promise<{ id: string }> },
) {
  const { id } = await args.params;
  if (!id) return new NextResponse("Bad Request", { status: 400 });

  const path = metaPath(id);
  if (!fs.existsSync(path)) {
    return NextResponse.json({} satisfies MovementLibraryMeta);
  }

  try {
    const raw = fs.readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as MovementLibraryMeta;
    return NextResponse.json(parsed);
  } catch {
    // If the file is corrupted, don't break the UI.
    return NextResponse.json({} satisfies MovementLibraryMeta);
  }
}

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

  const body = (await request
    .json()
    .catch(() => null)) as MovementLibraryMeta | null;
  if (!body || typeof body !== "object") {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const dir = join(getBaseDir(), "public", "data-source-previews");
  await mkdir(dir, { recursive: true });

  await writeFile(metaPath(id), JSON.stringify(body, null, 2) + "\n", "utf8");

  return NextResponse.json({ ok: true });
}
