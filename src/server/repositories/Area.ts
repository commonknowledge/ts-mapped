import { sql } from "kysely";
import { AreaSetCode } from "@/server/models/AreaSet";
import { db, dbRead } from "@/server/services/database";
import type { Point } from "../models/shared";
import type { Area } from "@/server/models/Area";
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
  point: Point | null;
  excludeAreaSetCode?: AreaSetCode | null | undefined;
  includeAreaSetCode?: AreaSetCode | null | undefined;
}): Promise<AreaWithAreaSetCode[]> {
  if (!point) {
    return [];
  }
  const pointGeoJSON = JSON.stringify({
    type: "Point",
    coordinates: [point.lng, point.lat],
  });
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
    .where(
      sql<boolean>`ST_DWithin(geom, ST_GeomFromGeoJson(${pointGeoJSON}), 0.01)`,
    )
    .select([
      "area.id",
      "area.code",
      "area.name",
      "areaSet.code as areaSetCode",
    ])
    .distinctOn("areaSet.code")
    .orderBy("areaSet.code")
    .orderBy(sql`ST_Distance(geom, ST_GeomFromGeoJson(${pointGeoJSON}))`)
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
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }
  const words = trimmedQuery.split(/\s+/).filter((word) => word.length > 0);

  // Query the materialized view for fast trigram-based searching
  // Join to area table to order by geometric area size (largest first)
  let queryBuilder = dbRead
    .selectFrom("areaSearch")
    .innerJoin("area", "areaSearch.id", "area.id")
    .select([
      "areaSearch.id",
      "areaSearch.code",
      "areaSearch.name",
      "areaSetCode",
      "areaSetName",
    ])
    .where("areaSetCode", "!=", AreaSetCode.PC)
    .limit(10);

  // Apply ILIKE condition for each word to match all words in the search text
  for (const word of words) {
    queryBuilder = queryBuilder.where(
      sql<boolean>`search_text ILIKE ${`%${word}%`}`,
    );
  }

  return queryBuilder.orderBy(sql`ST_Area(geom)`, "desc").execute();
}
