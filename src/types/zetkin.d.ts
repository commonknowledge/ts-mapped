declare module "zetkin" {
  interface ZetkinResponse {
    data: { data: unknown } | null;
    meta: Record<string, unknown>;
    httpStatus: number;
  }

  interface ZetkinResourceProxy {
    get(
      page?: number | null,
      perPage?: number | null,
      filters?: unknown[],
    ): Promise<ZetkinResponse>;
    post(data?: unknown): Promise<ZetkinResponse>;
    patch(data?: unknown): Promise<ZetkinResponse>;
    del(): Promise<ZetkinResponse>;
    put(data?: unknown): Promise<ZetkinResponse>;
    meta(keyOrObj: string | Record<string, unknown>, value?: unknown): this;
    getPath(): string;
  }

  interface ZetkinInstance {
    configure(options: {
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
      zetkinDomain?: string;
      host?: string;
      port?: number;
      ssl?: boolean;
      base?: string;
      version?: number;
      scopes?: string[];
    }): void;
    getConfig(): Record<string, unknown>;
    setToken(token: string): void;
    getToken(): string | null;
    setAccessToken(accessToken: string): void;
    setTokenData(data: unknown): void;
    getTokenData(): unknown;
    getLoginUrl(redirectUri?: string, scopes?: string[]): string;
    authenticate(uri: string): Promise<unknown>;
    resource(...args: (string | number)[]): ZetkinResourceProxy;
    refresh(): Promise<void>;
    construct(options?: Record<string, unknown>): ZetkinInstance;
  }

  const Z: ZetkinInstance;
  export default Z;
}
