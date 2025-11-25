import z from "zod";
import type { Generated, Insertable, Updateable } from "kysely";

export enum AreaSetCode {
  MSOA21 = "MSOA21",
  OA21 = "OA21",
  PC = "PC",
  UKR18 = "UKR18",
  WMC24 = "WMC24",
}
export const areaSetCodes = Object.values(AreaSetCode);

export const areaSetCode = z.nativeEnum(AreaSetCode);

export enum AreaSetGroupCode {
  OA21 = "OA21",
  WMC24 = "WMC24",
  UKR18 = "UKR18",
}
export const areaSetGroupCodes = Object.values(AreaSetGroupCode);

export const areaSetGroupCode = z.nativeEnum(AreaSetGroupCode);

export const AreaSetSizes: Record<AreaSetCode, number> = {
  [AreaSetCode.PC]: 1,
  [AreaSetCode.OA21]: 1,
  [AreaSetCode.MSOA21]: 2,
  [AreaSetCode.WMC24]: 4,
  [AreaSetCode.UKR18]: 8,
};

export const areaSetSchema = z.object({
  id: z.number(),
  code: areaSetCode,
  name: z.string(),
});

export type AreaSet = z.infer<typeof areaSetSchema>;

export type AreaSetTable = AreaSet & {
  id: Generated<number>;
};
export type NewAreaSet = Insertable<AreaSetTable>;
export type AreaSetUpdate = Updateable<AreaSetTable>;
