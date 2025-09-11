import { GoogleOAuthCredentials } from "@/server/models/DataSource";

export const getOAuthCredentials = async (
  redirectSuccessUrl: string,
): Promise<GoogleOAuthCredentials> => {
  const response = await fetch("/api/google/oauth", {
    body: JSON.stringify({ redirectSuccessUrl }),
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to get Google OAuth Credentials");
  }
  return response.json() as Promise<GoogleOAuthCredentials>;
};

export const getOAuthURL = async (
  state: Record<string, string>,
): Promise<string> => {
  const response = await fetch(
    `/api/google/oauth?state=${encodeURIComponent(JSON.stringify(state))}`,
    {
      method: "GET",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to get Google OAuth URL");
  }
  const body = (await response.json()) as { url: string };
  return body.url;
};

export const getSheets = async (
  oAuthCredentials: GoogleOAuthCredentials,
  spreadsheetId: string,
): Promise<string[]> => {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${oAuthCredentials.access_token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sheet names");
  }

  const data = (await response.json()) as {
    sheets: { properties: { title: string } }[];
  };
  const sheets = data.sheets || [];
  return sheets.map((sheet) => sheet.properties.title);
};
