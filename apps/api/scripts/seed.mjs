/* global console, process, URL */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const seedPath = fileURLToPath(new URL("../seeds/demo.sql", import.meta.url));
const seedSql = await readFile(seedPath, "utf8");
const client = new pg.Client({ connectionString: databaseUrl });

await client.connect();

try {
  await client.query("BEGIN");
  await client.query(seedSql);
  await client.query("COMMIT");
  console.log("Demo data seeded successfully.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
