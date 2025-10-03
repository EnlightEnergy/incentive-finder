import { db } from "../server/db";
import { utilityZipCodes } from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

async function importZipCodes() {
  const csvPath = path.join(process.cwd(), "utility_zips_out", "consolidated_utility_zips.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n");
  const headers = lines[0].split(",");
  
  const records: Array<{
    zipCode: string;
    ownerUtility: string;
    cca: string | null;
    notes: string;
    source: string;
  }> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(",");
    records.push({
      zipCode: values[0],
      ownerUtility: values[1],
      cca: values[2] === "none" ? null : values[2],
      notes: values[3],
      source: values[4],
    });
  }
  
  console.log(`Importing ${records.length} ZIP code records...`);
  
  await db.delete(utilityZipCodes);
  
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await db.insert(utilityZipCodes).values(batch);
    console.log(`Imported ${Math.min(i + batchSize, records.length)} / ${records.length} records`);
  }
  
  console.log("✅ ZIP code import complete!");
  process.exit(0);
}

importZipCodes().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
