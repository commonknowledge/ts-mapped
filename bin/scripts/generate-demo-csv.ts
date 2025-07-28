import fs from "fs";
import https from "https";
import path from "path";
import { faker } from "@faker-js/faker";

const API_URL = "https://api.postcodes.io/random/postcodes";

async function main() {
  const rowsArg = process.argv[2];
  const rows = Number(rowsArg);
  if (!rowsArg || isNaN(rows) || rows < 1) {
    console.error("Usage: tsx bin/scripts/generate-fake-csv.ts <rows>");
    process.exit(1);
  }

  const outPath = path.resolve(process.cwd(), "fake-data.csv");
  const header =
    "first name,last name,fullname,postcode,phone number,email,latitude,longitude,member_numeric_data\n";
  fs.writeFileSync(outPath, header);

  for (let i = 0; i < rows; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    let phone = faker.phone.number({ style: "international" });
    // Replace first two characters with '+44'
    if (phone.length > 2) {
      phone = "+44" + phone.slice(2);
    }
    const email = faker.internet.email({ firstName, lastName });
    let postcode = "";
    let latitude = "";
    let longitude = "";
    try {
      const data = await new Promise<{
        result: { postcode: string; latitude: string; longitude: string };
      }>((resolve, reject) => {
        https
          .get(API_URL, (res) => {
            let raw = "";
            res.on("data", (chunk) => {
              raw += chunk;
            });
            res.on("end", () => {
              try {
                resolve(JSON.parse(raw));
              } catch (err) {
                reject(err);
              }
            });
          })
          .on("error", reject);
      });
      postcode = data.result.postcode;
      latitude = data.result.latitude;
      longitude = data.result.longitude;
    } catch {
      postcode = "ERROR";
      latitude = "";
      longitude = "";
    }
    const memberNumericData = Math.floor(Math.random() * 101);
    const row = `${firstName},${lastName},${fullName},${postcode},${phone},${email},${latitude},${longitude},${memberNumericData}\n`;
    fs.appendFileSync(outPath, row);
    process.stdout.write(`Row ${i + 1}/${rows} done\r`);
  }
  console.log(`\nCSV generated at ${outPath}`);
}

main();
