import { Polygon } from "geojson";
import {
  KyselyPlugin,
  OperationNodeTransformer,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  PrimitiveValueListNode,
  QueryResult,
  RootOperationNode,
  UnknownRow,
  ValueNode,
} from "kysely";
import logger from "../../../services/logger"; // Relative import required for Kysely CLI
import type { Point } from "@/server/models/shared";

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
    if (typeof value === "string" && key === "polygon") {
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

function parseDbPolygon(val: string): Polygon | null {
  if (isWkbHex(val)) {
    try {
      const buf = Buffer.from(val, "hex");
      // WKB: [byte order][type][SRID][num_rings][ring1][ring2]...
      // For each ring: [num_points][point1][point2]...
      // Each point: [x][y] (8 bytes each)

      const littleEndian = buf[0] === 1;
      let offset = 1;

      // Skip type (4 bytes)
      offset += 4;

      // Check SRID
      const srid = littleEndian
        ? buf.readUInt32LE(offset)
        : buf.readUInt32BE(offset);
      offset += 4;

      if (srid !== 4326) {
        return null;
      }

      // Read number of rings
      const numRings = littleEndian
        ? buf.readUInt32LE(offset)
        : buf.readUInt32BE(offset);
      offset += 4;

      if (numRings === 0) {
        return null;
      }

      const coordinates: [number, number][][] = [];

      // Parse all rings (exterior + holes)
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
    } catch (e) {
      logger.error("Error parsing PostGIS polygon", e);
      return null;
    }
  }
  return null;
}
