import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { getAbsoluteUrl } from "@/lib/app-url";
import logger from "@/server/services/logger";

const redirectUri = getAbsoluteUrl("/data-sources/new");
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri,
});

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const state = request.nextUrl.searchParams.get("state") || "";

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
      state,
    });

    return NextResponse.json({ url });
  } catch (error) {
    logger.error("Error generating OAuth URL", { error });
    return NextResponse.json(
      { error: "Failed to generate OAuth URL" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { redirectSuccessUrl } = body;

    if (!redirectSuccessUrl) {
      return NextResponse.json(
        { error: "Missing redirectUrl" },
        { status: 400 }
      );
    }

    const parsed = new URL(redirectSuccessUrl);
    const code = parsed.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code not found" },
        { status: 400 }
      );
    }

    const { tokens } = await oauth2Client.getToken(code);

    return NextResponse.json(tokens);
  } catch (error) {
    logger.error("Error exchanging code for tokens", { error });
    return NextResponse.json(
      { error: "Failed to retrieve tokens" },
      { status: 500 }
    );
  }
}
