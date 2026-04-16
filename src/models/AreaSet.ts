import z from "zod";

export enum AreaSetCode {
  PC = "PC",
  WMC24 = "WMC24",
  LAD25 = "LAD25",
  W25 = "W25",
  LSOA21 = "LSOA21",
  MSOA21 = "MSOA21",
  OA21 = "OA21",
  SDZ22 = "SDZ22",
  SIZ22 = "SIZ22",
  SOA22 = "SOA22",
  UKR18 = "UKR18",
  UKC24 = "UKC24",
  CTYUA24 = "CTYUA24",
  CAUTH25 = "CAUTH25",
  SPC22 = "SPC22",
  SENC22 = "SENC22",
  COED26 = "COED26",
  ICB22 = "ICB22",
}
export const areaSetCodes = Object.values(AreaSetCode);

export const areaSetCode = z.nativeEnum(AreaSetCode);

export enum AreaSetGroupCode {
  WMC24 = "WMC24",
  CTYUA24 = "CTYUA24",
  LAD25 = "LAD25",
  W25 = "W25",
  MSOA21 = "MSOA21",
  LSOA21 = "LSOA21",
  CAUTH25 = "CAUTH25",
  UKR18 = "UKR18",
  UKC24 = "UKC24",
  SPC22 = "SPC22",
  SENC22 = "SENC22",
  SOA22 = "SOA22",
  COED26 = "COED26",
  ICB22 = "ICB22",
}
export const areaSetGroupCodes = Object.values(AreaSetGroupCode);

export const areaSetGroupCode = z.nativeEnum(AreaSetGroupCode);

export const AreaSetSizes: Record<AreaSetCode, number> = {
  [AreaSetCode.PC]: 1,
  [AreaSetCode.OA21]: 1,
  [AreaSetCode.SOA22]: 1,
  [AreaSetCode.LSOA21]: 2,
  [AreaSetCode.SDZ22]: 2,
  [AreaSetCode.MSOA21]: 3,
  [AreaSetCode.SIZ22]: 3,
  [AreaSetCode.W25]: 3,
  [AreaSetCode.LAD25]: 4,
  [AreaSetCode.WMC24]: 4,
  [AreaSetCode.SPC22]: 4,
  [AreaSetCode.SENC22]: 4,
  [AreaSetCode.CTYUA24]: 6,
  [AreaSetCode.CAUTH25]: 6,
  [AreaSetCode.COED26]: 6,
  [AreaSetCode.ICB22]: 6,
  [AreaSetCode.UKR18]: 8,
  [AreaSetCode.UKC24]: 12,
};

export const areaSetSchema = z.object({
  id: z.number(),
  code: areaSetCode,
  name: z.string(),
});

export type AreaSet = z.infer<typeof areaSetSchema>;
