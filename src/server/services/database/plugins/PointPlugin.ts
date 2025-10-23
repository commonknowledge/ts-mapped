import { OperationNodeTransformer } from "kysely";
import logger from "../../../services/logger"; // Relative import required for Kysely CLI
import type { Point } from "@/server/models/shared";
import type { MultiPolygon, Polygon } from "geojson";
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  PrimitiveValueListNode,
  QueryResult,
  RootOperationNode,
  UnknownRow,
  ValueNode,
} from "kysely";

export class PointPlugin implements KyselyPlugin {
  readonly #transformer = new PointTransformer();

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node);
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    // Map all rows: if a value looks like a PostGIS point, convert to {lat, lng}
    const rows = args.result.rows.map((row) => mapDbRowPoints(row));
    return { ...args.result, rows };
  }
}

class PointTransformer extends OperationNodeTransformer {
  protected transformValue(node: ValueNode): ValueNode {
    return {
      ...node,
      value: this.maybeTransformGeometry(node.value),
    };
  }

  protected transformPrimitiveValueList(
    node: PrimitiveValueListNode,
  ): PrimitiveValueListNode {
    return {
      ...node,
      values: node.values.map((v) => this.maybeTransformGeometry(v)),
    };
  }

  private maybeTransformGeometry(value: unknown) {
    if (isPoint(value)) {
      return mapPoint(value);
    }
    if (isPolygon(value)) {
      return mapPolygon(value);
    }
    return value;
  }
}

function mapPoint(point: Point): string {
  return `SRID=4326;POINT(${point.lng} ${point.lat})`;
}

function mapPolygon(polygon: Polygon): string {
  // Convert coordinates array to WKT format
  const rings = polygon.coordinates
    .map((ring) => {
      const coords = ring.map((coord) => `${coord[0]} ${coord[1]}`).join(", ");
      return `(${coords})`;
    })
    .join(", ");

  return `SRID=4326;POLYGON(${rings})`;
}

function isPoint(point: unknown): point is Point {
  return (
    typeof point === "object" &&
    point !== null &&
    "lat" in point &&
    "lng" in point
  );
}

function isPolygon(polygon: unknown): polygon is Polygon {
  const isP =
    typeof polygon === "object" &&
    polygon !== null &&
    "type" in polygon &&
    polygon.type === "Polygon" &&
    "coordinates" in polygon &&
    Array.isArray(polygon.coordinates) &&
    polygon.coordinates.length > 0 &&
    polygon.coordinates.every(
      (ring) =>
        Array.isArray(ring) &&
        ring.every(
          (coord) =>
            Array.isArray(coord) &&
            coord.length === 2 &&
            typeof coord[0] === "number" &&
            typeof coord[1] === "number",
        ),
    );
  return isP;
}

// --- New: handle reading from DB ---
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
