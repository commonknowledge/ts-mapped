# Full-stack Typescript Mapped

## Local Setup

### Requirements

- Docker
- NodeJS v22+

**For Tests**

- `jq` (Installed by default on MacOS)

### Installation

1. Run `bin/setup.sh` and follow the instuctions.
2. Run `bin/run.sh` to start Mapped!
3. Open the dev server at https://localhost:3000
4. Log in with username `hello@commonknowledge.coop` and password `1234`.

### Migrations

- Create with `npm run kysely migrate:make [name]`
- Run with `npm run kysely migrate:latest`

### Commands

- The [Commander](https://www.npmjs.com/package/commander) library has been used to create a CLI for this project.
- Add commands to `bin/cmd.ts`.
- Run commands with `npm run cmd -- [command] [...args]`

#### Create a user and an org

```bash
npm run cmd -- upsertUser --email a@b.com --password 1234 --org "My Org"
```

### Tests

- Run `npm config set strict-ssl false` to allow testing with HTTPS fetch requests.
- Run tests with `npm test`
- This will download `test_credentials.json` from BitWarden Secrets manager, which is required to test the data source adaptors.
- Filter tests with `npm test -- -t [filter]`

## API Documentation

### TypeScript SDK

TypeScript types are available for consuming the REST API from external projects via a separate SDK package:

```bash
npm install github:commonknowledge/ts-mapped-sdk
```

```typescript
import type { GeoJSONAPIResponse } from "@commonknowledge/ts-mapped-sdk";
```

See [src/api/README.md](src/api/README.md) for detailed usage examples.

### GeoJSON REST API

The application provides a REST API endpoint to retrieve data source items as GeoJSON.

**Endpoint:**

```
GET /api/rest/data-sources/{dataSourceId}/geojson
```

**Authentication:**

- Basic Auth (user:password)
- The authenticated user must have access to the data source through their organisation membership

**Query Parameters:**

- `filter` (optional): JSON string of filter criteria (RecordFilterInput)
- `search` (optional): Search string to filter records
- `page` (optional): Page number for pagination (default: 0)
- `sort` (optional): JSON array of sort criteria (SortInput[])
- `all` (optional): Boolean to return all records instead of paginated (default: false)

**Response:**

- Content-Type: `application/geo+json`
- Returns a GeoJSON FeatureCollection with geocoded items from the data source
- Each feature includes:
  - `geometry`: Point coordinates (longitude, latitude)
  - `properties`: Raw data from the item plus metadata fields (`_dataSourceId`, `_externalId`, `_geocodeResult`)

**Examples:**

```bash
# Get all records
curl -u "user@example.com:password" \
  "https://your-mapped-instance.com/api/rest/data-sources/{uuid}/geojson?all=true"

# Search and filter
curl -u "user@example.com:password" \
  "https://your-mapped-instance.com/api/rest/data-sources/{uuid}/geojson?search=london&page=0"

# With sorting
curl -u "user@example.com:password" \
  "https://your-mapped-instance.com/api/rest/data-sources/{uuid}/geojson?sort=%5B%7B%22name%22%3A%22name%22%2C%22desc%22%3Afalse%7D%5D"
```

**Example Response:**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "record-id",
      "geometry": {
        "type": "Point",
        "coordinates": [-0.1278, 51.5074]
      },
      "properties": {
        "name": "Location Name",
        "address": "123 Main St",
        "_dataSourceId": "data-source-uuid",
        "_externalId": "external-id",
        "_geocodeResult": { ... }
      }
    }
  ]
}
```

## Further Details

### Seed Data

The SQL import includes the following:

- Data sources:
  - Seed Airtable: https://airtable.com/appMdYSgvrFYZcr4k/tblSy67uoOyoeUb50/viwXlZr9qcFowFCJR?blocks=hide
  - Hope Not Hate vote share CSV
- Area sets:
  - Constituencies (2024)
  - Census Output Areas and MSOAs (2021)
