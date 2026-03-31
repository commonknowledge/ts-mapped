import { TRPCError } from "@trpc/server";
import { OAuth2Client } from "google-auth-library";
import Z from "zetkin";
import z from "zod";
import { googleOAuthCredentialsSchema } from "@/models/DataSource";
import { oAuthStateSchema } from "@/models/OAuth";
import { getAbsoluteUrl } from "@/utils/appUrl";
import { publicProcedure, router } from "../index";
import type { ZetkinOAuthCredentials } from "@/models/DataSource";

const redirectUri = getAbsoluteUrl("/data-sources/new");

// Google

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri,
});

const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Zetkin

function createZetkinClient(overrideRedirectUri?: string) {
  const zetkin = Z.construct();
  zetkin.configure({
    clientId: process.env.ZETKIN_CLIENT_ID ?? "",
    clientSecret: process.env.ZETKIN_CLIENT_SECRET ?? "",
    redirectUri: overrideRedirectUri ?? redirectUri,
  });
  return zetkin;
}

export const oauthRouter = router({
  // Google Sheets
  googleGetOAuthURL: publicProcedure
    .input(oAuthStateSchema)
    .query(({ input }) => {
      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: GOOGLE_SCOPES,
        state: JSON.stringify(input),
      });
      return { url };
    }),

  googleExchangeOAuthCode: publicProcedure
    .input(z.object({ redirectSuccessUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      const parsed = new URL(input.redirectSuccessUrl);
      const code = parsed.searchParams.get("code");

      if (!code) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Authorization code not found",
        });
      }

      const {
        tokens: { access_token, expiry_date, refresh_token },
      } = await oauth2Client.getToken(code);
      if (!access_token || !expiry_date || !refresh_token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Authorization failed",
        });
      }
      return { access_token, expiry_date, refresh_token };
    }),

  googleGetSheets: publicProcedure
    .input(
      z.object({
        oAuthCredentials: googleOAuthCredentialsSchema,
        spreadsheetId: z.string().nonempty(),
      }),
    )
    .query(async ({ input }) => {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${input.oAuthCredentials.access_token}`,
          },
        },
      );

      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to fetch sheet names",
        });
      }

      const data = (await response.json()) as {
        sheets: { properties: { title: string } }[];
      };
      return (data.sheets || []).map((sheet) => sheet.properties.title);
    }),

  // Zetkin
  zetkinGetOAuthURL: publicProcedure.query(() => {
    const zetkin = createZetkinClient();
    const url = zetkin.getLoginUrl(redirectUri, ["level2"]) as string;
    return { url };
  }),

  zetkinExchangeOAuthCode: publicProcedure
    .input(z.object({ redirectSuccessUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      const zetkin = createZetkinClient();
      await zetkin.authenticate(input.redirectSuccessUrl);
      const rawTokenData = zetkin.getTokenData();

      const tokenDataResult = z
        .object({
          access_token: z.string(),
          token_type: z.string(),
          refresh_token: z.string(),
          expires_in: z.number().int().positive(),
        })
        .safeParse(rawTokenData);

      if (!tokenDataResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve valid OAuth tokens from Zetkin",
        });
      }

      const { access_token, token_type, refresh_token, expires_in } =
        tokenDataResult.data;
      const expiry_date = Date.now() + expires_in * 1000;

      return {
        access_token,
        token_type,
        refresh_token,
        expiry_date,
      } as ZetkinOAuthCredentials;
    }),
});
