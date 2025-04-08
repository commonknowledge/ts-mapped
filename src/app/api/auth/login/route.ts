import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { findUserByEmailAndPassword } from "@/server/repositories/User";
import logger from "@/server/services/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  if (!body.email || !body.password) {
    return new NextResponse("Unauthorized", { status: 403 });
  }
  try {
    const user = await findUserByEmailAndPassword({
      email: body.email,
      password: body.password,
    });
    if (!user) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set(
      "JWT",
      sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "", {
        expiresIn: 24 * 60 * 60,
      }),
    );
    return new NextResponse();
  } catch (error) {
    logger.warn(`Failed to log in user`, { error });
    return new NextResponse("Error", { status: 500 });
  }
}
