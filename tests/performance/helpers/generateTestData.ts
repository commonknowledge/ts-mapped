import fs from "fs";
import path from "path";

// Sample UK postcodes from sampleAreas.psql
const SAMPLE_POSTCODES = [
  "TN4 0PP",
  "N76AS",
  "G115RD",
  "HP20 2QB",
  "BT15 3ES",
  "SW1A 1AA",
  "M1 1AE",
  "B1 1AA",
  "EH1 1AA",
  "CF10 1AA",
];

const FIRST_NAMES = [
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Eve",
  "Frank",
  "Grace",
  "Henry",
  "Iris",
  "Jack",
  "Kate",
  "Liam",
  "Mia",
  "Noah",
  "Olivia",
  "Peter",
  "Quinn",
  "Rose",
  "Sam",
  "Tara",
];

const LAST_NAMES = [
  "Anderson",
  "Brown",
  "Clark",
  "Davis",
  "Evans",
  "Fisher",
  "Garcia",
  "Harris",
  "Ives",
  "Jones",
  "King",
  "Lee",
  "Miller",
  "Nelson",
  "Owen",
  "Parker",
  "Quinn",
  "Robinson",
  "Smith",
  "Taylor",
];

export function generateCSV(recordCount: number, filePath: string): void {
  const lines = ["Name,Email,Postcode,Age,Member Since"];

  for (let i = 1; i <= recordCount; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName =
      LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const postcode = SAMPLE_POSTCODES[i % SAMPLE_POSTCODES.length];
    const age = 20 + (i % 60);
    const memberSince = 2010 + (i % 15);

    lines.push(`${name},${email},${postcode},${age},${memberSince}`);
  }

  // Ensure directory exists and resolve absolute path
  const absoluteFilePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const dir = path.dirname(absoluteFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(absoluteFilePath, lines.join("\n"), "utf8");
}

export function cleanupTestFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Populate an Airtable table with test records for performance testing
 * Creates records in batches of 10 (Airtable's limit)
 */
export async function populateAirtableTable(
  apiKey: string,
  baseId: string,
  tableId: string,
  recordCount: number,
): Promise<string[]> {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const createdRecordIds: string[] = [];

  // Generate test data similar to CSV
  const records = [];
  for (let i = 1; i <= recordCount; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName =
      LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const postcode = SAMPLE_POSTCODES[i % SAMPLE_POSTCODES.length];
    const age = 20 + (i % 60);
    const memberSince = 2010 + (i % 15);

    records.push({
      fields: {
        Name: name,
        Email: email,
        Postcode: postcode,
        Age: age,
        "Member Since": memberSince,
      },
    });
  }

  // Airtable allows max 10 records per create request
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: batch }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create Airtable records: ${response.status} ${errorText}`,
      );
    }

    const result = (await response.json()) as {
      records: { id: string }[];
    };
    createdRecordIds.push(...result.records.map((r) => r.id));
  }

  return createdRecordIds;
}

/**
 * Delete records from Airtable table
 * Deletes in batches of 10 (Airtable's limit)
 */
export async function deleteAirtableRecords(
  apiKey: string,
  baseId: string,
  tableId: string,
  recordIds: string[],
): Promise<void> {
  const baseUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;

  // Airtable allows max 10 records per delete request
  for (let i = 0; i < recordIds.length; i += 10) {
    const batch = recordIds.slice(i, i + 10);
    const params = new URLSearchParams();
    batch.forEach((id) => params.append("records[]", id));

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to delete Airtable records: ${response.status} ${errorText}`,
      );
      // Continue trying to delete other batches
    }
  }
}
