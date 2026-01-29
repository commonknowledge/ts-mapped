import { sql } from "kysely";
import { db } from "@/server/services/database";
import type { Area } from "@/server/models/Area";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { Database } from "@/server/services/database";
import type { SelectQueryBuilder } from "kysely";

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

export async function findAreaByCodeWithGeometry(
  code: string,
  areaSetCode: AreaSetCode,
): Promise<Area | undefined> {
  return db
    .selectFrom("area")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id")
    .where("area.code", "=", code)
    .where("areaSet.code", "=", areaSetCode)
    .selectAll("area")
    .executeTakeFirst();
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

export async function findAreasByPoint({
  point,
  excludeAreaSetCode,
  includeAreaSetCode,
}: {
  point: string;
  excludeAreaSetCode?: AreaSetCode | null | undefined;
  includeAreaSetCode?: AreaSetCode | null | undefined;
}): Promise<AreaWithAreaSetCode[]> {
  let query = db
    .selectFrom("area")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id");
  if (excludeAreaSetCode) {
    query = query.where("areaSet.code", "!=", excludeAreaSetCode);
  }
  if (includeAreaSetCode) {
    query = query.where("areaSet.code", "=", includeAreaSetCode);
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
