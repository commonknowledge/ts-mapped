import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { JWT_LIFETIME_SECONDS } from "@/constants";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("JWT");
  cookieStore.set("LoggedOut", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: JWT_LIFETIME_SECONDS,
  });
  return NextResponse.json({ success: true });
}
