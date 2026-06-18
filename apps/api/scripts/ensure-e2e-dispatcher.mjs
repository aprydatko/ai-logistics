/* global console, process */

import { hash } from "bcrypt";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to prepare the E2E dispatcher");
}

const client = new pg.Client({ connectionString: databaseUrl });
const passwordHash = await hash("Password123!", 12);

await client.connect();

try {
  await client.query(
    `
      INSERT INTO users (
        first_name,
        last_name,
        email,
        password_hash,
        role,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `,
    [
      "E2E",
      "Dispatcher",
      "e2e.dispatcher@example.com",
      passwordHash,
      "dispatcher",
      true,
    ],
  );

  console.log("E2E dispatcher is ready.");
} finally {
  await client.end();
}
