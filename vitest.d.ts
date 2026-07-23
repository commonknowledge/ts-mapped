declare module "vitest" {
  export interface ProvidedContext {
    credentials: {
      actionnetwork: {
        apiKey: string;
      };
      airtable: {
        baseId: string;
        tableId: string;
        apiKey: string;
      };
      baserow: {
        apiUrl: string;
        tableId: string;
        email: string;
        password: string;
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
      mailchimp: {
        apiKey: string;
        listId: string;
      };
      zetkin?: {
        orgId: string;
        oAuthCredentials: {
          access_token: string;
          refresh_token: string;
          token_type: string;
          expiry_date: number;
        };
      };
      enrichment: {
        googlesheets: {
          spreadsheetId: string;
          sheetName: string;
          oAuthCredentials: {
            access_token: string;
            refresh_token: string;
            expiry_date: number;
          };
        };
      };
      ngrokToken: string;
    };
  }
}

export {};
