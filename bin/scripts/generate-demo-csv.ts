import fs from "fs";
import https from "https";
import path from "path";
import { faker } from "@faker-js/faker";

const API_URL = "https://api.postcodes.io/random/postcodes";

function fetchPostcode(): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(API_URL, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.result.postcode);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const rowsArg = process.argv[2];
  const rows = Number(rowsArg);
  if (!rowsArg || isNaN(rows) || rows < 1) {
    console.error("Usage: tsx bin/scripts/generate-fake-csv.ts <rows>");
    process.exit(1);
  }

  const outPath = path.resolve(process.cwd(), "fake-data.csv");
  const header = "first name,last name,fullname,postcode,phone number,email\n";
  fs.writeFileSync(outPath, header);

  for (let i = 0; i < rows; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const phone = faker.phone.number({ style: "international" });
    const email = faker.internet.email({ firstName, lastName });
    let postcode = "";
    try {
      postcode = await fetchPostcode();
    } catch {
      postcode = "ERROR";
    }
    const row = `${firstName},${lastName},${fullName},${postcode},${phone},${email}\n`;
    fs.appendFileSync(outPath, row);
    process.stdout.write(`Row ${i + 1}/${rows} done\r`);
  }
  console.log(`\nCSV generated at ${outPath}`);
}

main();
