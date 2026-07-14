/**
 * Generate a large CSV of synthetic incident data for stress-testing marker
 * features (year slider, clustering, category styling).
 *
 * Rows are scattered around UK city centres with Latitude/Longitude columns,
 * so the data source can use Coordinates geocoding and import quickly
 * (no postcode/address lookups).
 *
 * Usage:
 *   npx tsx bin/generateYearSeriesData.ts [rowCount] [outputPath]
 *
 * Defaults: 120,000 rows to resources/dataSets/yearSeriesLarge.csv
 */
import fs from "node:fs";
import path from "node:path";

// Deterministic PRNG so regenerating produces the same file
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Birmingham", lat: 52.4862, lng: -1.8904 },
  { name: "Manchester", lat: 53.4808, lng: -2.2426 },
  { name: "Leeds", lat: 53.8008, lng: -1.5491 },
  { name: "Liverpool", lat: 53.4084, lng: -2.9916 },
  { name: "Newcastle", lat: 54.9783, lng: -1.6178 },
  { name: "Sheffield", lat: 53.3811, lng: -1.4701 },
  { name: "Bristol", lat: 51.4545, lng: -2.5879 },
  { name: "Nottingham", lat: 52.9548, lng: -1.1581 },
  { name: "Leicester", lat: 52.6369, lng: -1.1398 },
  { name: "Coventry", lat: 52.4068, lng: -1.5197 },
  { name: "Hull", lat: 53.7676, lng: -0.3274 },
  { name: "Bradford", lat: 53.795, lng: -1.7594 },
  { name: "Stoke-on-Trent", lat: 53.0027, lng: -2.1794 },
  { name: "Plymouth", lat: 50.3755, lng: -4.1427 },
  { name: "Southampton", lat: 50.9097, lng: -1.4044 },
  { name: "Portsmouth", lat: 50.8198, lng: -1.088 },
  { name: "Norwich", lat: 52.6309, lng: 1.2974 },
  { name: "Brighton", lat: 50.8225, lng: -0.1372 },
  { name: "Oxford", lat: 51.752, lng: -1.2577 },
  { name: "Cambridge", lat: 52.2053, lng: 0.1218 },
  { name: "York", lat: 53.959, lng: -1.0815 },
  { name: "Exeter", lat: 50.7184, lng: -3.5339 },
  { name: "Cardiff", lat: 51.4816, lng: -3.1791 },
  { name: "Swansea", lat: 51.6214, lng: -3.9436 },
  { name: "Glasgow", lat: 55.8642, lng: -4.2518 },
  { name: "Edinburgh", lat: 55.9533, lng: -3.1883 },
  { name: "Aberdeen", lat: 57.1497, lng: -2.0943 },
  { name: "Dundee", lat: 56.462, lng: -2.9707 },
  { name: "Belfast", lat: 54.5973, lng: -5.9301 },
];

const TYPES = [
  "Demonstration",
  "Leafleting",
  "Stickering",
  "Banner drop",
  "Vandalism",
  "Harassment",
  "Online abuse",
  "Assault",
];

const SEVERITIES = ["Low", "Moderate", "High", "Critical"];

// No commas in values: rows are written without CSV quoting
const ATTENDEES = ["1-10", "10-50", "50-100", "100-500", "500-1000"];

const MIN_YEAR = 2000;
const MAX_YEAR = 2026;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function main() {
  const count = Number(process.argv[2] || 120000);
  const outPath =
    process.argv[3] ||
    path.join("resources", "dataSets", "yearSeriesLarge.csv");

  const random = mulberry32(20260714);
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

  const out = fs.createWriteStream(outPath);
  out.write(
    "Title,Latitude,Longitude,Date,Year,Severity,Type of threat,Attendees\n",
  );

  for (let i = 0; i < count; i++) {
    const city = pick(CITIES);
    // Gaussian-ish scatter (~0.1 degrees) around the city centre
    const scatter = () => (random() + random() + random() - 1.5) * 0.1;
    const lat = (city.lat + scatter()).toFixed(5);
    const lng = (city.lng + scatter()).toFixed(5);

    const year = MIN_YEAR + Math.floor(random() * (MAX_YEAR - MIN_YEAR + 1));
    const month = 1 + Math.floor(random() * 12);
    const day = 1 + Math.floor(random() * 28);
    const date = `${year}-${pad(month)}-${pad(day)}`;

    const type = pick(TYPES);
    // ~15% of rows have no severity, ~2% no year/date (hidden when filtering)
    const severity = random() < 0.15 ? "" : pick(SEVERITIES);
    const hasYear = random() >= 0.02;

    const title = `${type} in ${city.name} #${i + 1}`;
    const row = [
      title,
      lat,
      lng,
      hasYear ? date : "",
      hasYear ? String(year) : "",
      severity,
      type,
      pick(ATTENDEES),
    ].join(",");
    out.write(`${row}\n`);
  }

  out.end(() => {
    console.log(`Wrote ${count} rows to ${outPath}`);
  });
}

main();
