import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.email || !body.password) {
    return new NextResponse("Unauthorized", { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.set("JWT", sign({ id: "fake" }, process.env.JWT_SECRET || "", { expiresIn: 24 * 60 * 60 }));
  return new NextResponse();
}
