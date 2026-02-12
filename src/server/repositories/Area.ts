import { sql } from "kysely";
import { db, dbRead } from "@/server/services/database";
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

// Uses the generated `geom` column for 10x performance improvement,
// at the loss of some (potentially negligible) accuracy.
export async function findAreasByPoint({
  point,
  excludeAreaSetCode,
  includeAreaSetCode,
}: {
  point: string;
  excludeAreaSetCode?: AreaSetCode | null | undefined;
  includeAreaSetCode?: AreaSetCode | null | undefined;
}): Promise<AreaWithAreaSetCode[]> {
  // Use the read replica for this expensive read query
  let query = dbRead
    .selectFrom("area")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id");
  if (excludeAreaSetCode) {
    query = query.where("areaSet.code", "!=", excludeAreaSetCode);
  }
  if (includeAreaSetCode) {
    query = query.where("areaSet.code", "=", includeAreaSetCode);
  }
  return query
    .where(sql<boolean>`ST_Covers(geom, ST_GeomFromGeoJson(${point}))`)
    .select([
      "area.id",
      "area.code",
      "area.name",
      "areaSet.code as areaSetCode",
    ])
    .execute();
}

export async function findAreasContaining({
  areaId,
  excludeAreaSetCode,
  includeAreaSetCode,
}: {
  areaId: number;
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
    .where(
      sql<boolean>`ST_Covers(
        geography,
        (SELECT geography FROM area WHERE id = ${areaId})
      )`,
    )
    .select([
      "area.id",
      "area.code",
      "area.name",
      "areaSet.code as areaSetCode",
    ])
    .execute();
}

export async function searchAreas(query: string) {
  const words = query.trim().split(/\s+/);

  // Build search conditions for each word
  const conditions = words
    .map((word) => `search_text ILIKE '%${word.replace(/'/g, "''")}%'`)
    .join(" AND ");

  // Query the materialized view for fast searching
  const result = await sql<{
    id: number;
    code: string;
    name: string;
    areaSetId: number;
    areaSetCode: string;
    areaSetName: string;
  }>`
    SELECT
      id,
      code,
      name,
      area_set_id as "areaSetId",
      area_set_code as "areaSetCode",
      area_set_name as "areaSetName"
    FROM area_search
    WHERE ${sql.raw(conditions)}
    LIMIT 50
  `.execute(dbRead);

  return result.rows;
}
