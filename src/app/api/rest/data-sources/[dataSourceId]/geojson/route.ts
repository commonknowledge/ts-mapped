import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import z from "zod";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { DataRecord } from "@/server/models/DataRecord";
import {
  recordFilterSchema,
  recordSortSchema,
} from "@/server/models/MapView";
import { findDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findOrganisationForUser } from "@/server/repositories/Organisation";
import { findUserByEmailAndPassword } from "@/server/repositories/User";

/**
 * Query parameters schema for GeoJSON API
 */
const queryParamsSchema = z.object({
  filter: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return null;
      try {
        const parsed = JSON.parse(val);
        return recordFilterSchema.parse(parsed);
      } catch {
        return null;
      }
    }),
  search: z.string().optional().nullable(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0).default(0)),
  sort: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        return z.array(recordSortSchema).parse(parsed);
      } catch {
        return [];
      }
    }),
  all: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean().default(false)),
});

/**
 * Authenticated GeoJSON REST API for data source items
 *
 * GET /api/rest/data-sources/:dataSourceId/geojson
 *
 * Authentication: Basic Auth (user:password)
 * Query Parameters:
 *   - filter: JSON string of RecordFilterInput (optional)
 *   - search: Search string (optional)
 *   - page: Page number for pagination (optional, default: 0)
 *   - sort: JSON array of SortInput (optional)
 *   - all: Boolean to return all records (optional, default: false)
 * Returns: GeoJSON FeatureCollection with geocoded items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dataSourceId: string }> }
) {
  const { dataSourceId } = await params;

  // Parse and validate query parameters
  const searchParams = request.nextUrl.searchParams;
  const queryParamsResult = queryParamsSchema.safeParse({
    filter: searchParams.get("filter"),
    search: searchParams.get("search"),
    page: searchParams.get("page"),
    sort: searchParams.get("sort"),
    all: searchParams.get("all"),
  });

  if (!queryParamsResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Invalid query parameters",
        details: queryParamsResult.error.format(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { filter, search, page, sort, all } = queryParamsResult.data;

  // Check Basic Auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new NextResponse(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Data Source API"',
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Decode Basic Auth credentials
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [email, password] = credentials.split(":");

  if (!email || !password) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid credentials format" }),
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Data Source API"',
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Authenticate user with email and password
  const user = await findUserByEmailAndPassword({ email, password });
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid credentials" }),
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Data Source API"',
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Find data source
  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    return new NextResponse(
      JSON.stringify({ error: "Data source not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Check if user has access to the data source via organization
  const organisation = await findOrganisationForUser(
    dataSource.organisationId,
    user.id
  );
  if (!organisation) {
    return new NextResponse(
      JSON.stringify({ error: "Access denied" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Fetch data records for this data source with filters, search, and sorting
  const records = await findDataRecordsByDataSource(
    dataSourceId,
    filter,
    search,
    page,
    sort,
    all
  );

  // Transform to GeoJSON
  const geojson = dataRecordsToGeoJSON(records);

  return NextResponse.json(geojson, {
    headers: {
      "Content-Type": "application/geo+json",
    },
  });
}

/**
 * Convert data records to GeoJSON FeatureCollection
 */
function dataRecordsToGeoJSON(
  records: DataRecord[]
): FeatureCollection {
  const features: Feature[] = records
    .filter((record) => record.geocodePoint) // Only include geocoded records
    .map((record) => {
      const point = record.geocodePoint;
      if (!point) return null;

      const geometry: Point = {
        type: "Point",
        coordinates: [point.lng, point.lat],
      };

      return {
        type: "Feature",
        id: record.id,
        geometry,
        properties: {
          ...record.json, // Include all raw data for display
          _dataSourceId: record.dataSourceId,
          _externalId: record.externalId,
          _geocodeResult: record.geocodeResult,
        },
      };
    })
    .filter((feature): feature is Feature => feature !== null);

  return {
    type: "FeatureCollection",
    features,
  };
}
