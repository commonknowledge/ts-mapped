import logger from "../../../services/logger"; // Relative import required for Kysely CLI
import type { Point } from "@/models/shared";
import type { MultiPolygon, Polygon } from "geojson";
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from "kysely";

/**
 * Parses PostGIS geography values on *read*: WKB hex strings become
 * `{ lat, lng }` points, or GeoJSON Polygon/MultiPolygon for the `polygon`
 * and `geography` columns.
 *
 * Writes are deliberately not handled here. Geometry cannot be inferred from
 * a value's shape (a data record's JSON may itself contain `lat` and `lng`
 * keys), so geography columns are typed as `GeographyColumn` and written via
 * `toGeography` in `@/server/services/database/geography`.
 */
export class PointPlugin implements KyselyPlugin {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return args.node;
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    // Map all rows: if a value looks like a PostGIS point, convert to {lat, lng}
    const rows = args.result.rows.map((row) => mapDbRowPoints(row));
    return { ...args.result, rows };
  }
}

function mapDbRowPoints(row: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "string" && ["polygon", "geography"].includes(key)) {
      mapped[key] = parseDbPolygon(value) ?? value;
    } else if (typeof value === "string" && isWkbHex(value)) {
      mapped[key] = parseDbPoint(value) ?? value;
    } else {
      mapped[key] = value;
    }
  }
  return mapped;
}

// Only handle WKB hex: e.g. '0101000020E6100000...'
function isWkbHex(val: string): boolean {
  return /^[0-9A-Fa-f]{40,}$/.test(val);
}

function parseDbPoint(val: string): Point | null {
  if (isWkbHex(val)) {
    try {
      const buf = Buffer.from(val, "hex");
      // WKB: [byte order][type][SRID][x][y]
      // byte order: 1 byte (0x01 = little endian)
      // type: 4 bytes
      // SRID: 4 bytes
      // x: 8 bytes (double)
      // y: 8 bytes (double)
      const littleEndian = buf[0] === 1;

      // Only handle SRID 4326
      const srid = littleEndian ? buf.readUInt32LE(5) : buf.readUInt32BE(5);

      if (srid !== 4326) {
        return null;
      }

      const x = littleEndian ? buf.readDoubleLE(9) : buf.readDoubleBE(9);
      const y = littleEndian ? buf.readDoubleLE(17) : buf.readDoubleBE(17);

      if (isNaN(x) || isNaN(y)) {
        return null;
      }

      return { lng: x, lat: y };
    } catch (e) {
      logger.error("Error parsing PostGIS point", e);
      return null;
    }
  }
  return null;
}

function parseDbPolygon(val: string): Polygon | MultiPolygon | null {
  if (isWkbHex(val)) {
    try {
      const buf = Buffer.from(val, "hex");
      // WKB: [byte order][type][SRID][...]

      const littleEndian = buf[0] === 1;
      let offset = 1;

      // Read type (4 bytes)
      const geomType = littleEndian
        ? buf.readUInt32LE(offset)
        : buf.readUInt32BE(offset);
      offset += 4;

      // Check SRID
      const srid = littleEndian
        ? buf.readUInt32LE(offset)
        : buf.readUInt32BE(offset);
      offset += 4;

      if (srid !== 4326) {
        return null;
      }

      // PostGIS extended WKB type codes with SRID flag (0x20000000):
      // 918 = 0x20000396 = Polygon with SRID
      // 915 = 0x20000393 = MultiPolygon with SRID
      // Extract base type by masking off flags
      const baseType = geomType & 0xff; // Get lowest byte: 0x96 = 150, 0x93 = 147

      // Standard WKB types: 3 = Polygon, 6 = MultiPolygon
      // PostGIS can also use: 0x03 with flags, or extended codes
      const isPolygon = baseType === 3 || geomType === 918;
      const isMultiPolygon = baseType === 6 || geomType === 915;

      if (isPolygon) {
        // Parse Polygon
        const numRings = littleEndian
          ? buf.readUInt32LE(offset)
          : buf.readUInt32BE(offset);
        offset += 4;

        if (numRings === 0) {
          return null;
        }

        const coordinates: [number, number][][] = [];

        for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
          const numPoints = littleEndian
            ? buf.readUInt32LE(offset)
            : buf.readUInt32BE(offset);
          offset += 4;

          const ring: [number, number][] = [];

          for (let i = 0; i < numPoints; i++) {
            const x = littleEndian
              ? buf.readDoubleLE(offset)
              : buf.readDoubleBE(offset);
            offset += 8;
            const y = littleEndian
              ? buf.readDoubleLE(offset)
              : buf.readDoubleBE(offset);
            offset += 8;

            if (isNaN(x) || isNaN(y)) {
              return null;
            }

            ring.push([x, y]);
          }

          coordinates.push(ring);
        }

        return { type: "Polygon", coordinates };
      } else if (isMultiPolygon) {
        // Parse MultiPolygon
        const numPolygons = littleEndian
          ? buf.readUInt32LE(offset)
          : buf.readUInt32BE(offset);
        offset += 4;

        if (numPolygons === 0) {
          return null;
        }

        const coordinates: [number, number][][][] = [];

        for (let polyIndex = 0; polyIndex < numPolygons; polyIndex++) {
          // Each polygon has its own WKB header
          const polyByteOrder = buf[offset];
          const polyLittleEndian = polyByteOrder === 1;
          offset += 1;

          // Skip polygon type (4 bytes)
          offset += 4;

          const numRings = polyLittleEndian
            ? buf.readUInt32LE(offset)
            : buf.readUInt32BE(offset);
          offset += 4;

          const polygonCoords: [number, number][][] = [];

          for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
            const numPoints = polyLittleEndian
              ? buf.readUInt32LE(offset)
              : buf.readUInt32BE(offset);
            offset += 4;

            const ring: [number, number][] = [];

            for (let i = 0; i < numPoints; i++) {
              const x = polyLittleEndian
                ? buf.readDoubleLE(offset)
                : buf.readDoubleBE(offset);
              offset += 8;
              const y = polyLittleEndian
                ? buf.readDoubleLE(offset)
                : buf.readDoubleBE(offset);
              offset += 8;

              if (isNaN(x) || isNaN(y)) {
                return null;
              }

              ring.push([x, y]);
            }

            polygonCoords.push(ring);
          }

          coordinates.push(polygonCoords);
        }

        return { type: "MultiPolygon", coordinates };
      }

      return null;
    } catch (e) {
      logger.error("Error parsing PostGIS geometry", e);
      return null;
    }
  }
  return null;
}
