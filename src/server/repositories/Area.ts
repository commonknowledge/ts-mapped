import { sql } from "kysely";
import { db } from "@/server/services/database";
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

export interface AreaWithCounts extends AreaWithAreaSetCode {
  memberCount: number;
  markerCount: number;
}

export async function findAllAreasByAreaSet(
  areaSetCode: AreaSetCode,
  options: {
    searchTerm?: string;
    page?: number;
    pageSize?: number;
    sortBy?: "name" | "memberCount" | "markerCount" | "membersAndMarkers";
    sortOrder?: "asc" | "desc";
    dataSourceId?: string; // For counting members
    mapId?: string; // For counting markers
  } = {},
): Promise<{ areas: AreaWithCounts[]; total: number }> {
  const {
    searchTerm,
    page = 0,
    pageSize = 50,
    sortBy = "name",
    sortOrder = "asc",
    dataSourceId,
    mapId,
  } = options;

  // Simple query first - just get areas without counts
  let query = db
    .selectFrom("area")
    .innerJoin("areaSet", "area.areaSetId", "areaSet.id")
    .where("areaSet.code", "=", areaSetCode);

  // Apply search filter
  if (searchTerm) {
    const term = `%${searchTerm.toLowerCase()}%`;
    query = query.where((eb) =>
      eb.or([eb("area.name", "ilike", term), eb("area.code", "ilike", term)]),
    );
  }

  // Get total count for pagination
  const totalQuery = query.select(db.fn.count("area.id").as("total"));
  const totalResult = await totalQuery.execute();
  const total = Number(totalResult[0]?.total || 0);

  // For count-based sorting, we need to get all areas first, then sort and paginate
  // For name sorting, we can do it at the database level
  let finalQuery;
  if (sortBy === "name") {
    finalQuery = query
      .select([
        "area.id",
        "area.code",
        "area.name",
        "areaSet.code as areaSetCode",
      ])
      .orderBy("area.name", sortOrder)
      .limit(pageSize)
      .offset(page * pageSize);
  } else {
    // For count-based sorting, get all areas first (we'll sort and paginate after getting counts)
    finalQuery = query
      .select([
        "area.id",
        "area.code",
        "area.name",
        "areaSet.code as areaSetCode",
      ])
      .orderBy("area.name", "asc"); // Default ordering, will be overridden
  }

  const areas = await finalQuery.execute();

  // Get member counts if dataSourceId is provided
  let memberCounts: Record<string, number> = {};
  if (dataSourceId) {
    try {
      const memberCountQuery = db
        .selectFrom("dataRecord")
        .select([
          sql`geocode_result->'areas'->>${areaSetCode}`.as("areaCode"),
          ({ fn }) => fn.countAll().as("count"),
        ])
        .where("dataRecord.dataSourceId", "=", dataSourceId)
        .groupBy("areaCode");

      const memberCountResults = await memberCountQuery.execute();
      console.log("Member count results:", memberCountResults);
      console.log("AreaSetCode used for counting:", areaSetCode);
      console.log("DataSourceId used for counting:", dataSourceId);

      // Debug specific area codes
      const edmontonResults = memberCountResults.filter((row) =>
        String(row.areaCode || "").includes("E14001221"),
      );
      if (edmontonResults.length > 0) {
        console.log("Edmonton member count results:", edmontonResults);
      }

      memberCounts = Object.fromEntries(
        memberCountResults.map((row) => [row.areaCode, Number(row.count)]),
      );
    } catch (error) {
      console.error("Failed to get member counts:", error);
    }
  }

  // Get marker counts if mapId is provided
  let markerCounts: Record<string, number> = {};
  if (mapId) {
    try {
      // Use a single query with spatial join to count markers by area
      const markerCountResults = await sql`
        SELECT 
          area.code as "areaCode",
          COUNT(placed_marker.id)::int as count
        FROM placed_marker
        CROSS JOIN area
        INNER JOIN area_set ON area.area_set_id = area_set.id
        WHERE placed_marker.map_id = ${mapId}
          AND area_set.code = ${areaSetCode}
          AND ST_Intersects(placed_marker.point, area.geography)
        GROUP BY area.code
      `.execute(db);

      markerCounts = Object.fromEntries(
        markerCountResults.rows.map((row: unknown) => {
          const typedRow = row as { areaCode: string; count: string };
          return [typedRow.areaCode, Number(typedRow.count)];
        }),
      );
    } catch (error) {
      console.error("Failed to get marker counts:", error);
    }
  }

  const areasWithCounts = areas.map((area) => ({
    ...area,
    memberCount: memberCounts[area.code] || 0,
    markerCount: markerCounts[area.code] || 0,
  }));

  // Apply sorting by counts if requested
  if (
    sortBy === "memberCount" ||
    sortBy === "markerCount" ||
    sortBy === "membersAndMarkers"
  ) {
    areasWithCounts.sort((a, b) => {
      let aCount: number;
      let bCount: number;

      if (sortBy === "membersAndMarkers") {
        // Sort by total count (members + markers)
        aCount = a.memberCount + a.markerCount;
        bCount = b.memberCount + b.markerCount;
      } else {
        // Sort by specific count
        aCount = sortBy === "memberCount" ? a.memberCount : a.markerCount;
        bCount = sortBy === "memberCount" ? b.memberCount : b.markerCount;
      }

      if (sortOrder === "desc") {
        return bCount - aCount; // Descending: higher counts first
      } else {
        return aCount - bCount; // Ascending: lower counts first
      }
    });

    // Apply pagination after sorting
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedAreas = areasWithCounts.slice(startIndex, endIndex);

    return {
      areas: paginatedAreas,
      total,
    };
  }

  return {
    areas: areasWithCounts,
    total,
  };
}
