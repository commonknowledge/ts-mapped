declare module "vitest" {
  export interface ProvidedContext {
    credentials: {
      airtable: {
        baseId: string;
        tableId: string;
        apiKey: string;
      };
      ngrokToken: string;
    };
  }
}

export {};
