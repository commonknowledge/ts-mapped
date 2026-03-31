import z from "zod";
import { DataSourceRecordType, DataSourceType } from "./DataSource";

export const oAuthStateSchema = z
  .object({
    dataSourceName: z.string().optional(),
    recordType: z.nativeEnum(DataSourceRecordType).optional(),
    dataSourceType: z.nativeEnum(DataSourceType).optional(),
  })
  .catch({
    dataSourceName: undefined,
    recordType: undefined,
    dataSourceType: undefined,
  });

export type OAuthState = z.infer<typeof oAuthStateSchema>;

export const OAUTH_STATE_KEY = "mapped:oAuthState";
