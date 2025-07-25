import { SelectQueryBuilder, sql } from "kysely";
import { AreaSetCode } from "@/__generated__/types";
import { Database, db } from "@/server/services/database";

export interface AreaWithPoints {
  id: number;
  name: string;
  code: string;
  centralPoint: string;
  samplePoint: string;
}

export interface AreaWithAreaSetCode {
  id: number;
  name: string;
  code: string;
  areaSetCode: string;
}

export async function findAreaByCode(
  code: string,
  areaSetCode: AreaSetCode,
): Promise<AreaWithPoints | undefined> {
  const query = db
    .selectFrom("area")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id")
    .where("area.code", "=", code)
    .where("areaSet.code", "=", areaSetCode);
  return applyAreaWithPointsSelect(query).executeTakeFirst();
}

export async function findAreaByName(
  name: string,
  areaSetCode: AreaSetCode,
): Promise<AreaWithPoints | undefined> {
  const query = db
    .selectFrom("area")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id")
    .where("area.name", "=", name)
    .where("areaSet.code", "=", areaSetCode);
  return applyAreaWithPointsSelect(query).executeTakeFirst();
}

const applyAreaWithPointsSelect = (
  query: SelectQueryBuilder<Database, "area" | "areaSet", object>,
) => {
  return query.select([
    "area.id",
    "area.name",
    "area.code",
    sql<string>`ST_AsGeoJson(ST_Centroid(geography::geometry))`.as(
      "centralPoint",
    ),
    sql<string>`ST_AsGeoJson(ST_PointOnSurface(geography::geometry))`.as(
      "samplePoint",
    ),
  ]);
};

export async function findAreasByPoint(
  point: string,
  excludeAreaSetCode: AreaSetCode | null = null,
): Promise<AreaWithAreaSetCode[]> {
  let query = db
    .selectFrom("area")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id");
  if (excludeAreaSetCode) {
    query = query.where("areaSet.code", "!=", excludeAreaSetCode);
  }
  return query
    .where(sql<boolean>`ST_Intersects(geography, ST_GeomFromGeoJson(${point}))`)
    .select([
      "area.id",
      "area.code",
      "area.name",
      "areaSet.code as areaSetCode",
    ])
    .execute();
}
