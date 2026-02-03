import { sql } from "kysely";
import { db } from "@/server/services/database";
import type { Area } from "@/server/models/Area";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { Database} from "@/server/services/database";
import type { SelectQueryBuilder } from "kysely";

export interface AreaMatch {
  id: number | null;
  name: string | null;
  code: string | null;
  centralPoint: string | null;
  samplePoint: string | null;
  input: string | null;
}

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
  inputCode: string,
  areaSetCode: AreaSetCode,
): Promise<AreaWithPoints | undefined> {
  const query = db
    .selectFrom("area")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id")
    .where("area.code", "=", inputCode)
    .where("areaSet.code", "=", areaSetCode);
  return applyAreaWithPointsSelect(query).executeTakeFirst();
}

export async function findAreasByCodes(
  codes: string[],
  areaSetCode: AreaSetCode,
): Promise<AreaMatch[]> {
  const query = db
    .with(
      "inputCodes",
      () =>
        sql<{ search: string }>`
        (
          SELECT search
          FROM json_array_elements_text(${codes}::json) AS t(search)
        )
      `,
    )
    .selectFrom("inputCodes")
    .innerJoin("area", "area.code", "inputCodes.search")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id")
    .where("areaSet.code", "=", areaSetCode)
    .select("inputCodes.search as input")

  const q = applyAreaWithPointsSelect(query)
  return q.execute();
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

/**
 *
 * @param names
 * @param areaSetCode
 * @returns
 */
export async function findAreasByNames(
  names: string[],
  areaSetCode: AreaSetCode,
): Promise<AreaMatch[]> {
  const query = db
    .with(
      "inputNames",
      () =>
        sql<{ search: string }>`
        (
          SELECT search
          FROM json_array_elements_text(${names}::json) AS t(search)
        )
      `,
    )
    .selectFrom("inputNames")
    .innerJoin("area", (join) =>
      join.on((eb) => eb("area.name", "ilike", eb.ref("inputNames.search"))),
    )
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id")
    .where("areaSet.code", "=", areaSetCode)
    .select("inputNames.search as input")

  return applyAreaWithPointsSelect(query).execute();
}

const applyAreaWithPointsSelect = <T>(
  query: SelectQueryBuilder<
    Database,
    "area" | "areaSet",
    T
  >,
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

export async function findAreasByPoints({
  points,
  excludeAreaSetCode,
  includeAreaSetCode,
}: {
  points: string[];
  excludeAreaSetCode?: AreaSetCode | null | undefined;
  includeAreaSetCode?: AreaSetCode | null | undefined;
}) {
  let query = db
    .with(
      "inputs",
      () =>
        sql<{ point: string; }>`
        (
          SELECT point
          FROM json_array_elements_text(${points}::json) AS t(point)
        )
      `,
    )
    .selectFrom("inputs")
    .innerJoin("area", (join) =>
      join.on(
        sql<boolean>`ST_Intersects(area.geography, ST_GeomFromGeoJson(inputs.point))`,
      ),
    )
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id");

  if (excludeAreaSetCode) {
    query = query.where("areaSet.code", "!=", excludeAreaSetCode);
  }
  if (includeAreaSetCode) {
    query = query.where("areaSet.code", "=", includeAreaSetCode);
  }

  const q = query
    .select("inputs.point as input")
    .select([
      "area.id",
      "area.code",
      "area.name",
      "areaSet.code as areaSetCode",
    ])
    return q.execute();
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
