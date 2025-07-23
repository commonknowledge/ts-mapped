declare module "vitest" {
  export interface ProvidedContext {
    credentials: {
      airtable: {
        baseId: string;
        tableId: string;
        apiKey: string;
      };
      googlesheets: {
        spreadsheetId: string;
        sheetName: string;
        oAuthCredentials: {
          access_token: string;
          refresh_token: string;
          expiry_date: number;
        };
      };
      ngrokToken: string;
    };
  }
}

export {};
