import { Generated, Insertable, Updateable } from "kysely";
import z from "zod";

export const areaSetCodes = ["MSOA21", "OA21", "PC", "WMC24"] as const;

export enum AreaSetCode {
  MSOA21 = "MSOA21",
  OA21 = "OA21",
  PC = "PC",
  WMC24 = "WMC24",
}

export const areaSetCode = z.nativeEnum(AreaSetCode);

export const areaSetGroupCodeEnum = z.union([
  z.literal(AreaSetCode.OA21),
  z.literal(AreaSetCode.WMC24),
]);

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
