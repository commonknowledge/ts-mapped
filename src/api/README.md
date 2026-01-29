# TypeScript API Types Usage Guide

This package exports TypeScript types for consuming the ts-mapped REST API from external projects.

## Installation

### Option 1: Install SDK Package (Recommended)

Install the lightweight SDK package that contains only the type definitions:

```bash
npm install github:commonknowledge/ts-mapped-sdk
```

Then import the types:

```typescript
import type { GeoJSONAPIResponse } from "@commonknowledge/ts-mapped-sdk";
```

This installs only `@types/geojson` as a dependency — no bloat.

### Option 2: Copy Types Directly

For the lightest weight option with zero dependencies, copy the types file directly:

```bash
# Download the types file
curl -o src/types/mapped-api.ts https://raw.githubusercontent.com/commonknowledge/ts-mapped/main/src/api/index.ts
```

Then import from your local copy:

```typescript
import type { GeoJSONAPIResponse } from "./types/mapped-api";
```

### Option 3: Install Full ts-mapped Package

```bash
npm install github:commonknowledge/ts-mapped
```

**⚠️ Warning:** This installs ALL dependencies from the ts-mapped project (it's a full Next.js app), which adds ~500MB to node_modules. Only use this if you're already using ts-mapped as a dependency for other reasons.

## Requirements

All installation options require a TypeScript project with:

```bash
npm install -D typescript @types/geojson
```

**Minimum versions:**

- TypeScript: `^5.0.0`
- @types/geojson: `^7946.0.0`

## Available Types

- `GeoJSONAPIResponse` - Main response type from the GeoJSON endpoint
- `GeoJSONAPIFeature` - Individual feature in the response
- `GeoJSONFeatureProperties` - Properties object for each feature
- `GeoJSONAPIQueryParams` - Type-safe query parameters for the API
- `APIRecordFilter` - Filter configuration for querying
- `APIRecordSort` - Sort configuration
- `APIFilterOperator` - `AND` / `OR` operators
- `APIFilterType` - `GEO` / `MULTI` / `TEXT` filter types
- `APIPoint` - Geographic coordinates (lat/lng)
- `APIGeocodeResult` - Geocoding metadata
- `GeoJSONAPIErrorResponse` - Error response structure
- Re-exports: `Feature`, `FeatureCollection`, `Point` from `geojson`

## Basic Usage

### Fetching GeoJSON Data

```typescript
import type {
  GeoJSONAPIResponse,
  GeoJSONFeatureProperties,
} from "@commonknowledge/ts-mapped-sdk";

async function fetchDataSourceGeoJSON(
  dataSourceId: string,
  email: string,
  password: string,
): Promise<GeoJSONAPIResponse> {
  const credentials = btoa(`${email}:${password}`);

  const response = await fetch(
    `https://your-instance.com/api/rest/data-sources/${dataSourceId}/geojson`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Use it
const data = await fetchDataSourceGeoJSON(
  "data-source-uuid",
  "user@example.com",
  "password",
);
console.log(`Found ${data.features.length} locations`);
```

### Processing Features

```typescript
import type {
  GeoJSONAPIResponse,
  GeoJSONAPIFeature,
} from "@commonknowledge/ts-mapped-sdk";

async function processLocations(dataSourceId: string) {
  const data: GeoJSONAPIResponse = await fetchDataSourceGeoJSON(
    dataSourceId,
    "user@example.com",
    "password",
  );

  data.features.forEach((feature: GeoJSONAPIFeature) => {
    // Feature ID
    const id = feature.id; // string

    // Coordinates [longitude, latitude]
    const [lng, lat] = feature.geometry.coordinates;

    // API metadata
    const dataSourceId = feature.properties._dataSourceId;
    const externalId = feature.properties._externalId;
    const geocodeResult = feature.properties._geocodeResult;

    // Custom properties from your data source
    const name = feature.properties.businessName; // unknown - cast as needed
    const category = feature.properties.category as string;

    console.log(`${name} at ${lat}, ${lng}`);
  });
}
```

## Filtering

### Building Query Parameters

Use the `GeoJSONAPIQueryParams` type to construct query parameters in a type-safe way:

```typescript
import type {
  GeoJSONAPIQueryParams,
  APIRecordFilter,
  APIRecordSort,
  APIFilterType,
} from "@commonknowledge/ts-mapped-sdk";

// Build query parameters with type safety
const queryParams: GeoJSONAPIQueryParams = {
  search: "london",
  page: "0",
  all: "false",
  filter: JSON.stringify({
    type: APIFilterType.TEXT,
    column: "status",
    search: "active",
  } as APIRecordFilter),
  sort: JSON.stringify([
    {
      name: "name",
      desc: false,
    },
  ] as APIRecordSort[]),
};

// Convert to URLSearchParams
const params = new URLSearchParams(
  Object.entries(queryParams).filter(([_, v]) => v !== undefined) as [
    string,
    string,
  ][],
);

const url = `https://your-instance.com/api/rest/data-sources/${dataSourceId}/geojson?${params}`;
```

### Text Filters

```typescript
import type {
  APIRecordFilter,
  APIFilterType,
} from "@commonknowledge/ts-mapped-sdk";

const textFilter: APIRecordFilter = {
  type: APIFilterType.TEXT,
  column: "status",
  search: "active",
};

const params = new URLSearchParams({
  filter: JSON.stringify(textFilter),
});

const url = `https://your-instance.com/api/rest/data-sources/${dataSourceId}/geojson?${params}`;
```

### Geographic Filters

```typescript
import type {
  APIRecordFilter,
  APIFilterType,
} from "@commonknowledge/ts-mapped-sdk";

const geoFilter: APIRecordFilter = {
  type: APIFilterType.GEO,
  distance: 5000, // 5km radius
  placedMarker: "marker-123", // Reference to a placed marker
};
```

### Complex Nested Filters

```typescript
import type {
  APIRecordFilter,
  APIFilterType,
  APIFilterOperator,
} from "@commonknowledge/ts-mapped-sdk";

const complexFilter: APIRecordFilter = {
  type: APIFilterType.MULTI,
  operator: APIFilterOperator.AND,
  children: [
    {
      type: APIFilterType.TEXT,
      column: "category",
      search: "retail",
    },
    {
      type: APIFilterType.GEO,
      distance: 5000,
      placedMarker: "marker-123",
    },
    {
      type: APIFilterType.MULTI,
      operator: APIFilterOperator.OR,
      children: [
        {
          type: APIFilterType.TEXT,
          column: "status",
          search: "open",
        },
        {
          type: APIFilterType.TEXT,
          column: "status",
          search: "opening-soon",
        },
      ],
    },
  ],
};

const response = await fetch(
  `https://your-instance.com/api/rest/data-sources/${dataSourceId}/geojson?filter=${encodeURIComponent(JSON.stringify(complexFilter))}`,
  {
    headers: {
      Authorization: `Basic ${btoa("email:password")}`,
    },
  },
);
```

## Sorting

### Sort by Column

```typescript
import type { APIRecordSort } from "@commonknowledge/ts-mapped-sdk";

const nameSort: APIRecordSort = {
  name: "businessName",
  desc: false, // ascending
};

const params = new URLSearchParams({
  sort: JSON.stringify([nameSort]),
});
```

### Sort by Distance from Location

```typescript
import type { APIRecordSort, APIPoint } from "@commonknowledge/ts-mapped-sdk";

const distanceSort: APIRecordSort = {
  name: "distance",
  desc: false, // nearest first
  location: {
    lat: 51.5074,
    lng: -0.1278,
  } as APIPoint,
};

const params = new URLSearchParams({
  sort: JSON.stringify([distanceSort]),
});
```

### Multiple Sort Criteria

```typescript
import type { APIRecordSort } from "@commonknowledge/ts-mapped-sdk";

const sorts: APIRecordSort[] = [
  {
    name: "distance",
    desc: false,
    location: { lat: 51.5074, lng: -0.1278 },
  },
  {
    name: "businessName",
    desc: false,
  },
];

const params = new URLSearchParams({
  sort: JSON.stringify(sorts),
});
```

## Pagination

```typescript
// Get first page (default)
const page0 = await fetch(`${baseUrl}/geojson?page=0`, options);

// Get second page
const page1 = await fetch(`${baseUrl}/geojson?page=1`, options);

// Get all records (no pagination)
const allRecords = await fetch(`${baseUrl}/geojson?all=true`, options);
```

## Error Handling

```typescript
import type {
  GeoJSONAPIResponse,
  GeoJSONAPIErrorResponse,
} from "@commonknowledge/ts-mapped-sdk";

function isErrorResponse(data: unknown): data is GeoJSONAPIErrorResponse {
  return typeof data === "object" && data !== null && "error" in data;
}

async function safeAPICall(
  dataSourceId: string,
  email: string,
  password: string,
) {
  const response = await fetch(
    `https://your-instance.com/api/rest/data-sources/${dataSourceId}/geojson`,
    {
      headers: {
        Authorization: `Basic ${btoa(`${email}:${password}`)}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok || isErrorResponse(data)) {
    console.error(`API Error: ${data.error}`);
    if (data.details) {
      console.error("Details:", data.details);
    }
    throw new Error(data.error);
  }

  return data as GeoJSONAPIResponse;
}
```

## React / Next.js Integration

```typescript
import { useState, useEffect } from 'react';
import type { GeoJSONAPIResponse, GeoJSONAPIFeature } from '@commonknowledge/ts-mapped-sdk';

function DataSourceMap({ dataSourceId }: { dataSourceId: string }) {
  const [data, setData] = useState<GeoJSONAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDataSourceGeoJSON(dataSourceId, email, password)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [dataSourceId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h2>Found {data.features.length} locations</h2>
      <ul>
        {data.features.map((feature: GeoJSONAPIFeature) => (
          <li key={feature.id}>
            {feature.properties.name as string} -
            {feature.geometry.coordinates.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Using with Mapping Libraries

### Mapbox GL JS

```typescript
import mapboxgl from "mapbox-gl";
import type { GeoJSONAPIResponse } from "@commonknowledge/ts-mapped-sdk";

async function addDataToMap(map: mapboxgl.Map, dataSourceId: string) {
  const geojson: GeoJSONAPIResponse = await fetchDataSourceGeoJSON(
    dataSourceId,
    email,
    password,
  );

  // Add as a source
  map.addSource("locations", {
    type: "geojson",
    data: geojson,
  });

  // Add as a layer
  map.addLayer({
    id: "locations-layer",
    type: "circle",
    source: "locations",
    paint: {
      "circle-radius": 6,
      "circle-color": "#007cbf",
    },
  });
}
```

### Leaflet

```typescript
import L from "leaflet";
import type { GeoJSONAPIResponse } from "@commonknowledge/ts-mapped-sdk";

async function addDataToLeafletMap(map: L.Map, dataSourceId: string) {
  const geojson: GeoJSONAPIResponse = await fetchDataSourceGeoJSON(
    dataSourceId,
    email,
    password,
  );

  L.geoJSON(geojson, {
    onEachFeature: (feature, layer) => {
      const props = feature.properties;
      layer.bindPopup(`
        <h3>${props.name}</h3>
        <p>ID: ${feature.id}</p>
      `);
    },
  }).addTo(map);
}
```

## Complete Example

```typescript
import type {
  GeoJSONAPIResponse,
  APIRecordFilter,
  APIRecordSort,
  APIFilterType,
  APIFilterOperator,
} from "@commonknowledge/ts-mapped-sdk";

class MappedAPIClient {
  constructor(
    private baseUrl: string,
    private email: string,
    private password: string,
  ) {}

  private get authHeader(): string {
    return `Basic ${btoa(`${this.email}:${this.password}`)}`;
  }

  async fetchGeoJSON(
    dataSourceId: string,
    options: {
      filter?: APIRecordFilter;
      search?: string;
      sort?: APIRecordSort[];
      page?: number;
      all?: boolean;
    } = {},
  ): Promise<GeoJSONAPIResponse> {
    const params = new URLSearchParams();

    if (options.filter) {
      params.set("filter", JSON.stringify(options.filter));
    }
    if (options.search) {
      params.set("search", options.search);
    }
    if (options.sort) {
      params.set("sort", JSON.stringify(options.sort));
    }
    if (options.page !== undefined) {
      params.set("page", String(options.page));
    }
    if (options.all) {
      params.set("all", "true");
    }

    const url = `${this.baseUrl}/api/rest/data-sources/${dataSourceId}/geojson?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async searchNearby(
    dataSourceId: string,
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<GeoJSONAPIResponse> {
    const filter: APIRecordFilter = {
      type: APIFilterType.GEO,
      distance: radiusMeters,
      // Note: placedMarker would typically be created first via the UI
    };

    const sort: APIRecordSort[] = [
      {
        name: "distance",
        desc: false,
        location: { lat, lng },
      },
    ];

    return this.fetchGeoJSON(dataSourceId, { filter, sort });
  }
}

// Usage
const client = new MappedAPIClient(
  "https://your-instance.com",
  "user@example.com",
  "password",
);

const nearby = await client.searchNearby(
  "data-source-uuid",
  51.5074, // London latitude
  -0.1278, // London longitude
  5000, // 5km radius
);

console.log(`Found ${nearby.features.length} locations within 5km`);
```

## API Endpoint Reference

**Endpoint:** `GET /api/rest/data-sources/{dataSourceId}/geojson`

**Authentication:** Basic Auth (email:password)

**Query Parameters:**

- `filter` - JSON string of `APIRecordFilter`
- `search` - Search text
- `page` - Page number (0-indexed)
- `sort` - JSON array of `APIRecordSort[]`
- `all` - Boolean as string ("true"/"false")

**Response:** `GeoJSONAPIResponse` (Content-Type: application/geo+json)

**Error Response:** `GeoJSONAPIErrorResponse` (4xx/5xx status codes)

## Notes

1. **Authentication Required**: All requests must include valid credentials via Basic Auth
2. **Organization Access**: Users must be members of the organization that owns the data source
3. **GeoJSON Standard**: Responses conform to [RFC 7946](https://tools.ietf.org/html/rfc7946)
4. **Pagination**: Default page size is determined by server configuration
5. **Custom Properties**: The `properties` object contains both API metadata (prefixed with `_`) and custom data from your source
